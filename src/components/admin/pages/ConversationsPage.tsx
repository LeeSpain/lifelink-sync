import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Search, MessageSquare, User, Bot, Loader2 } from 'lucide-react';

interface Conversation {
  id: string;
  session_id: string;
  message_type: string;
  content: string;
  created_at: string;
  user_id?: string;
}

interface ConversationGroup {
  session_id: string;
  messages: Conversation[];
  user_id?: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groupedConversations, setGroupedConversations] = useState<ConversationGroup[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    groupConversations();
  }, [conversations, searchTerm]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      setConversations(conversationsData || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupConversations = () => {
    const sessionGroups: { [key: string]: ConversationGroup } = {};

    conversations.forEach(conv => {
      if (!sessionGroups[conv.session_id]) {
        sessionGroups[conv.session_id] = {
          session_id: conv.session_id,
          messages: [],
          user_id: conv.user_id,
          started_at: conv.created_at,
          last_message_at: conv.created_at,
          message_count: 0
        };
      }

      sessionGroups[conv.session_id].messages.push(conv);
      sessionGroups[conv.session_id].message_count++;
      
      if (new Date(conv.created_at) < new Date(sessionGroups[conv.session_id].started_at)) {
        sessionGroups[conv.session_id].started_at = conv.created_at;
      }
      if (new Date(conv.created_at) > new Date(sessionGroups[conv.session_id].last_message_at)) {
        sessionGroups[conv.session_id].last_message_at = conv.created_at;
      }
    });

    // Sort messages within each group
    Object.values(sessionGroups).forEach(group => {
      group.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    let filteredGroups = Object.values(sessionGroups);

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredGroups = filteredGroups.filter(group =>
        group.session_id.toLowerCase().includes(searchLower) ||
        group.messages.some(msg => msg.content.toLowerCase().includes(searchLower))
      );
    }

    // Sort by last message time
    filteredGroups.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    setGroupedConversations(filteredGroups);
  };

  const selectedConversation = selectedSession 
    ? groupedConversations.find(g => g.session_id === selectedSession)
    : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Conversations</h1>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Chat Conversations</h1>
          <p className="text-muted-foreground">View and analyze chat sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span className="font-medium">{groupedConversations.length} sessions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Conversation List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat Sessions
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 p-4">
                {groupedConversations.map((group) => (
                  <div
                    key={group.session_id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSession === group.session_id
                        ? 'bg-muted border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedSession(group.session_id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">
                        Session: {group.session_id.substring(0, 8)}...
                      </div>
                      <Badge variant="secondary">
                        {group.message_count} messages
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Started: {new Date(group.started_at).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last: {new Date(group.last_message_at).toLocaleString()}
                    </div>
                    {group.user_id && (
                      <div className="text-xs text-blue-600 mt-1">
                        User ID: {group.user_id.substring(0, 8)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Conversation Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedConversation 
                ? `Conversation Details - ${selectedConversation.session_id.substring(0, 8)}...`
                : 'Select a conversation to view details'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConversation ? (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.message_type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 break-words ${
                          message.message_type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                        style={{
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.message_type === 'user' ? (
                            <User className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <Bot className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium capitalize">
                            {message.message_type === 'user' ? 'User' : 'AI Assistant'}
                          </span>
                          <span className="text-xs opacity-70 ml-auto flex-shrink-0">
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation from the list to view the chat history</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}