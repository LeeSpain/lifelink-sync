import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Volume2, VolumeX, Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatMessage } from '@/hooks/useTabletVoice';

interface TabletClaraPanelProps {
  messages: ChatMessage[];
  isThinking: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isListening: boolean;
  voiceEnabled: boolean;
  onSendMessage: (text: string) => void;
  onToggleMute: () => void;
  onToggleVoice: (enabled: boolean) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

export function TabletClaraPanel({
  messages,
  isThinking,
  isSpeaking,
  isMuted,
  isListening,
  voiceEnabled,
  onSendMessage,
  onToggleMute,
  onToggleVoice,
  expanded,
  onToggleExpand,
}: TabletClaraPanelProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    onSendMessage(text);
    setInputText('');
  };

  // Last 5 messages for display (all scroll, but keep it manageable)
  const visibleMessages = messages.slice(-20);

  return (
    <>
      {/* Floating corner button — always visible */}
      <button
        onClick={onToggleExpand}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 ${
          expanded
            ? 'bg-slate-700 hover:bg-slate-600'
            : isSpeaking
            ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/40'
            : isListening
            ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/40'
            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
        }`}
      >
        <div className="relative">
          <Bot className="h-7 w-7 text-white" />
          {(isSpeaking || isListening) && !expanded && (
            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              isSpeaking ? 'bg-blue-300 animate-pulse' : 'bg-emerald-300 animate-pulse'
            }`} />
          )}
        </div>
      </button>

      {/* Chat panel — floats above content, does not push layout */}
      {expanded && (
        <div className="fixed bottom-24 right-6 z-40 w-80 h-[520px] bg-slate-900/98 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center ring-2 ${
              isSpeaking ? 'ring-blue-400' : isListening ? 'ring-emerald-400' : 'ring-slate-600'
            }`}>
              <Bot className={`h-5 w-5 ${isSpeaking ? 'text-blue-400' : 'text-emerald-400'}`} />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
              isSpeaking ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'
            }`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Clara</p>
            <p className="text-[10px] text-slate-400">
              {isSpeaking ? 'Speaking...' : isThinking ? 'Thinking...' : 'Online'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Mic toggle */}
          <button
            onClick={() => onToggleVoice(!voiceEnabled)}
            className={`p-1.5 rounded-full transition-colors ${
              voiceEnabled && isListening ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-slate-500 hover:bg-slate-700'
            }`}
          >
            {voiceEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
          </button>

          {/* Mute toggle */}
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-full transition-colors ${
              isMuted ? 'text-red-400 hover:bg-red-400/10' : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>

          {/* Close */}
          <button
            onClick={onToggleExpand}
            className="p-1.5 rounded-full text-slate-500 hover:bg-slate-700 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {visibleMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-slate-800 text-slate-200 rounded-bl-md'
              }`}
            >
              {msg.content}
              <p className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-slate-500'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 border-slate-600 text-white placeholder-slate-500 text-sm h-9"
            disabled={isThinking}
          />
          <Button
            type="submit"
            size="sm"
            className="h-9 w-9 p-0 bg-emerald-500 hover:bg-emerald-600"
            disabled={!inputText.trim() || isThinking}
          >
            {isThinking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
        </div>
      )}
    </>
  );
}
