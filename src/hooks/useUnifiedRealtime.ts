import { useEffect, useRef, useCallback, useState } from 'react';
import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from './useOptimizedAuth';

// Connection state types
interface ConnectionHealth {
  isConnected: boolean;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  latency: number | null;
}

interface ChannelSubscription {
  id: string;
  channel: RealtimeChannel;
  subscribers: Set<string>;
  lastActivity: Date;
  config: ChannelConfig;
}

interface ChannelConfig {
  channelName: string;
  events: Array<{
    event: string;
    schema?: string;
    table?: string;
    filter?: string;
  }>;
  presence?: boolean;
}

interface UnifiedRealtimeState {
  connectionHealth: ConnectionHealth;
  activeChannels: Map<string, ChannelSubscription>;
  presenceState: Map<string, any>;
  liveData: Map<string, any[]>;
  errors: Map<string, Error>;
}

// Subscription management
class RealtimeManager {
  private static instance: RealtimeManager;
  private channels = new Map<string, ChannelSubscription>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionHealth: ConnectionHealth = {
    isConnected: false,
    lastHeartbeat: null,
    reconnectAttempts: 0,
    latency: null
  };

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) return;
    
    this.heartbeatInterval = setInterval(() => {
      const startTime = Date.now();
      
      // Send heartbeat to measure latency
      Promise.resolve().then(() => {
        this.connectionHealth.latency = Date.now() - startTime;
        this.connectionHealth.lastHeartbeat = new Date();
        this.connectionHealth.isConnected = true;
      }).catch(() => {
        this.connectionHealth.isConnected = false;
      });
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  subscribeToChannel(
    subscriberId: string,
    config: ChannelConfig,
    callbacks: {
      onData?: (data: any) => void;
      onPresence?: (presence: any) => void;
      onError?: (error: Error) => void;
    }
  ): string {
    const channelKey = `${config.channelName}-${JSON.stringify(config.events)}`;
    
    let subscription = this.channels.get(channelKey);
    
    if (!subscription) {
      // Create new channel
      const channel = supabase.channel(config.channelName, {
        config: {
          presence: {
            key: subscriberId,
          },
        },
      });

      // Subscribe to events
      config.events.forEach(eventConfig => {
        if (eventConfig.schema && eventConfig.table) {
          channel.on(
            'postgres_changes',
            {
              event: eventConfig.event as any,
              schema: eventConfig.schema,
              table: eventConfig.table,
              filter: eventConfig.filter,
            },
            (payload) => {
              callbacks.onData?.(payload);
              subscription!.lastActivity = new Date();
            }
          );
        }
      });

      // Handle presence if enabled
      if (config.presence) {
        channel
          .on('presence', { event: 'sync' }, () => {
            const newState = channel.presenceState();
            callbacks.onPresence?.(newState);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            callbacks.onPresence?.({ type: 'join', key, newPresences });
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            callbacks.onPresence?.({ type: 'leave', key, leftPresences });
          });
      }

      // Subscribe and handle connection
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.connectionHealth.isConnected = true;
          this.connectionHealth.reconnectAttempts = 0;
          this.startHeartbeat();
        } else if (status === 'CHANNEL_ERROR') {
          this.connectionHealth.isConnected = false;
          this.connectionHealth.reconnectAttempts++;
          callbacks.onError?.(new Error(`Channel error: ${status}`));
        }
      });

      subscription = {
        id: channelKey,
        channel,
        subscribers: new Set([subscriberId]),
        lastActivity: new Date(),
        config
      };

      this.channels.set(channelKey, subscription);
    } else {
      // Add to existing channel
      subscription.subscribers.add(subscriberId);
    }

    return channelKey;
  }

  unsubscribeFromChannel(subscriberId: string, channelKey: string) {
    const subscription = this.channels.get(channelKey);
    if (!subscription) return;

    subscription.subscribers.delete(subscriberId);

    // If no more subscribers, remove the channel
    if (subscription.subscribers.size === 0) {
      subscription.channel.unsubscribe();
      this.channels.delete(channelKey);
      
      // Stop heartbeat if no channels
      if (this.channels.size === 0) {
        this.stopHeartbeat();
        this.connectionHealth.isConnected = false;
      }
    }
  }

  getConnectionHealth(): ConnectionHealth {
    return { ...this.connectionHealth };
  }

  async trackPresence(channelKey: string, presenceData: any): Promise<RealtimeChannelSendResponse> {
    const subscription = this.channels.get(channelKey);
    if (!subscription) {
      throw new Error('Channel not found');
    }

    return subscription.channel.track(presenceData);
  }

  cleanup() {
    this.channels.forEach(subscription => {
      subscription.channel.unsubscribe();
    });
    this.channels.clear();
    this.stopHeartbeat();
    this.connectionHealth.isConnected = false;
  }
}

export const useUnifiedRealtime = () => {
  const { user } = useOptimizedAuth();
  const managerRef = useRef<RealtimeManager>();
  const [state, setState] = useState<UnifiedRealtimeState>({
    connectionHealth: {
      isConnected: false,
      lastHeartbeat: null,
      reconnectAttempts: 0,
      latency: null
    },
    activeChannels: new Map(),
    presenceState: new Map(),
    liveData: new Map(),
    errors: new Map()
  });

  // Initialize manager
  if (!managerRef.current) {
    managerRef.current = RealtimeManager.getInstance();
  }

  // Subscribe to channel with optimized management
  const subscribe = useCallback((
    subscriberId: string,
    config: ChannelConfig,
    callbacks: {
      onData?: (data: any) => void;
      onPresence?: (presence: any) => void;
      onError?: (error: Error) => void;
    }
  ) => {
    if (!managerRef.current) return null;

    const enhancedCallbacks = {
      ...callbacks,
      onData: (data: any) => {
        // Update live data state
        setState(prev => {
          const newLiveData = new Map(prev.liveData);
          const existingData = newLiveData.get(subscriberId) || [];
          
          if (data.eventType === 'INSERT') {
            existingData.push(data.new);
          } else if (data.eventType === 'UPDATE') {
            const index = existingData.findIndex(item => item.id === data.new.id);
            if (index >= 0) {
              existingData[index] = data.new;
            }
          } else if (data.eventType === 'DELETE') {
            const filtered = existingData.filter(item => item.id !== data.old.id);
            newLiveData.set(subscriberId, filtered);
          }
          
          if (data.eventType !== 'DELETE') {
            newLiveData.set(subscriberId, existingData);
          }
          
          return {
            ...prev,
            liveData: newLiveData
          };
        });
        
        callbacks.onData?.(data);
      },
      onPresence: (presence: any) => {
        setState(prev => {
          const newPresenceState = new Map(prev.presenceState);
          newPresenceState.set(subscriberId, presence);
          return {
            ...prev,
            presenceState: newPresenceState
          };
        });
        
        callbacks.onPresence?.(presence);
      },
      onError: (error: Error) => {
        setState(prev => {
          const newErrors = new Map(prev.errors);
          newErrors.set(subscriberId, error);
          return {
            ...prev,
            errors: newErrors
          };
        });
        
        callbacks.onError?.(error);
      }
    };

    return managerRef.current.subscribeToChannel(subscriberId, config, enhancedCallbacks);
  }, []);

  // Unsubscribe from channel
  const unsubscribe = useCallback((subscriberId: string, channelKey: string) => {
    if (!managerRef.current) return;
    
    managerRef.current.unsubscribeFromChannel(subscriberId, channelKey);
    
    // Clean up state
    setState(prev => {
      const newLiveData = new Map(prev.liveData);
      const newPresenceState = new Map(prev.presenceState);
      const newErrors = new Map(prev.errors);
      
      newLiveData.delete(subscriberId);
      newPresenceState.delete(subscriberId);
      newErrors.delete(subscriberId);
      
      return {
        ...prev,
        liveData: newLiveData,
        presenceState: newPresenceState,
        errors: newErrors
      };
    });
  }, []);

  // Track presence
  const trackPresence = useCallback(async (channelKey: string, presenceData: any) => {
    if (!managerRef.current) throw new Error('Manager not initialized');
    return managerRef.current.trackPresence(channelKey, presenceData);
  }, []);

  // Update connection health periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (managerRef.current) {
        const health = managerRef.current.getConnectionHealth();
        setState(prev => ({
          ...prev,
          connectionHealth: health
        }));
      }
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.cleanup();
      }
    };
  }, []);

  return {
    // Connection management
    subscribe,
    unsubscribe,
    trackPresence,
    
    // State
    connectionHealth: state.connectionHealth,
    presenceState: state.presenceState,
    liveData: state.liveData,
    errors: state.errors,
    
    // Helper methods
    isConnected: state.connectionHealth.isConnected,
    hasErrors: state.errors.size > 0,
    getPresenceForChannel: (subscriberId: string) => state.presenceState.get(subscriberId),
    getDataForChannel: (subscriberId: string) => state.liveData.get(subscriberId) || [],
    
    // Connection quality
    connectionLatency: state.connectionHealth.latency,
    reconnectAttempts: state.connectionHealth.reconnectAttempts
  };
};