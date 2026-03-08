import { MessageSquare } from 'lucide-react';

export interface FamilyMessage {
  id: string;
  message: string;
  from_name: string;
  created_at: string;
}

interface FamilyMessagesCardProps {
  messages: FamilyMessage[];
  onViewAll: () => void;
}

export const FamilyMessagesCard = ({ messages, onViewAll }: FamilyMessagesCardProps) => {
  const unreadCount = messages.length;

  return (
    <button
      onClick={onViewAll}
      className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl p-6 text-left hover:bg-slate-800/80 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <MessageSquare className="h-7 w-7 text-blue-400" />
        {unreadCount > 0 && (
          <span className="bg-blue-500 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </div>
      <p className="text-lg font-semibold text-white">Messages</p>
      <p className="text-sm text-slate-400 mt-1">
        {unreadCount > 0 ? `${unreadCount} from family` : 'No new messages'}
      </p>
      {messages[0] && (
        <p className="text-xs text-slate-500 mt-2 truncate">
          {messages[0].from_name}: {messages[0].message}
        </p>
      )}
    </button>
  );
};
