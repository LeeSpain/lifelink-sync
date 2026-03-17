// Sales Rep Callback Dashboard
// Manage incoming callback requests and view performance metrics

'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CallbackRequest {
  id: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  callbackReason: string;
  urgency: string;
  status: string;
  createdAt: string;
  timeToCallSeconds?: number;
  customerContext: any;
}

const urgencyColors = {
  urgent: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  normal: 'bg-blue-100 text-blue-800 border-blue-300',
  low: 'bg-gray-100 text-gray-800 border-gray-300',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  queued: 'bg-blue-100 text-blue-800',
  calling: 'bg-purple-100 text-purple-800',
  connected: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  no_answer: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-100 text-red-800',
};

export const CallbackDashboard: React.FC = () => {
  const [callbacks, setCallbacks] = useState<CallbackRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availability, setAvailability] = useState<'online' | 'offline'>('offline');
  const [selectedCallback, setSelectedCallback] = useState<CallbackRequest | null>(null);
  const [stats, setStats] = useState({
    totalToday: 0,
    completedToday: 0,
    avgResponseTime: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchCallbacks();
    fetchStats();
    fetchAvailability();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('callback-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'callback_requests',
        },
        () => {
          fetchCallbacks();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCallbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('callback_requests')
        .select('*')
        .in('status', ['pending', 'queued', 'calling'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setCallbacks(data || []);
    } catch (err) {
      console.error('Failed to fetch callbacks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('callback_analytics')
        .select('*')
        .eq('date', today)
        .single();

      if (data) {
        setStats({
          totalToday: data.total_requests || 0,
          completedToday: data.completed_calls || 0,
          avgResponseTime: data.average_response_time_seconds || 0,
          pending: callbacks.filter((c) => c.status === 'pending').length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchAvailability = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sales_rep_availability')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setAvailability(data.status === 'online' ? 'online' : 'offline');
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    }
  };

  const toggleAvailability = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newStatus = availability === 'online' ? 'offline' : 'online';

      await supabase
        .from('sales_rep_availability')
        .upsert({
          user_id: user.id,
          status: newStatus,
          last_status_change: new Date().toISOString(),
        });

      setAvailability(newStatus);
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const claimCallback = async (callbackId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('callback_requests')
        .update({
          assigned_to: user.id,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', callbackId);

      // Initiate call via edge function
      // In production, this would trigger the actual Twilio call
      alert('Call initiated! Check your phone.');

      fetchCallbacks();
    } catch (err) {
      console.error('Failed to claim callback:', err);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getTimeSinceRequest = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
    return formatTime(diffSeconds);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Availability Toggle */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Callback Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage incoming callback requests and track performance
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              availability === 'online'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {availability === 'online' ? '🟢 Online' : '⚫ Offline'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-blue-700 text-xs uppercase font-semibold">Pending Now</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-green-700 text-xs uppercase font-semibold">Completed Today</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{stats.completedToday}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-purple-700 text-xs uppercase font-semibold">Total Today</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{stats.totalToday}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-orange-700 text-xs uppercase font-semibold">Avg Response</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">
              {formatTime(stats.avgResponseTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Callback Queue */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Callback Queue</h2>
          <p className="text-sm text-gray-600 mt-1">
            Click "Call Now" to initiate a callback
          </p>
        </div>

        <div className="divide-y">
          {callbacks.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">No pending callbacks</p>
              <p className="text-sm text-gray-500 mt-1">
                New requests will appear here automatically
              </p>
            </div>
          ) : (
            callbacks.map((callback) => (
              <div
                key={callback.id}
                className="p-6 hover:bg-gray-50 transition cursor-pointer"
                onClick={() => setSelectedCallback(callback)}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Contact Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {callback.contactName}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          urgencyColors[callback.urgency as keyof typeof urgencyColors]
                        }`}
                      >
                        {callback.urgency}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          statusColors[callback.status as keyof typeof statusColors]
                        }`}
                      >
                        {callback.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">
                      📞 {callback.contactPhone}
                      {callback.contactEmail && ` • 📧 ${callback.contactEmail}`}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Reason: {callback.callbackReason} •
                      Requested {getTimeSinceRequest(callback.createdAt)} ago
                    </p>

                    {/* Customer Context */}
                    {callback.customerContext?.fullContext && (
                      <div className="mt-3 bg-purple-50 rounded p-3">
                        <p className="text-xs text-purple-700 font-semibold uppercase">
                          Customer Context
                        </p>
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                          {callback.customerContext.fullContext}
                        </p>
                        {callback.customerContext.leadScore && (
                          <p className="text-xs text-purple-600 mt-1">
                            Lead Score: {callback.customerContext.leadScore}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      claimCallback(callback.id);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold whitespace-nowrap"
                  >
                    📞 Call Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Callback Detail Modal */}
      {selectedCallback && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCallback(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {selectedCallback.contactName}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedCallback.contactPhone}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCallback(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase">Status</h3>
                <div className="flex gap-2 mt-1">
                  <span
                    className={`px-3 py-1 rounded ${
                      urgencyColors[selectedCallback.urgency as keyof typeof urgencyColors]
                    }`}
                  >
                    {selectedCallback.urgency}
                  </span>
                  <span
                    className={`px-3 py-1 rounded ${
                      statusColors[selectedCallback.status as keyof typeof statusColors]
                    }`}
                  >
                    {selectedCallback.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                  Callback Reason
                </h3>
                <p className="text-gray-900 mt-1">{selectedCallback.callbackReason}</p>
              </div>

              {selectedCallback.customerContext?.fullContext && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase">
                    Customer History
                  </h3>
                  <div className="bg-purple-50 rounded p-4 mt-1">
                    <p className="text-gray-700">
                      {selectedCallback.customerContext.fullContext}
                    </p>
                    {selectedCallback.customerContext.leadScore && (
                      <p className="text-purple-700 font-semibold mt-2">
                        Lead Score: {selectedCallback.customerContext.leadScore}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => claimCallback(selectedCallback.id)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                📞 Call {selectedCallback.contactName} Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallbackDashboard;
