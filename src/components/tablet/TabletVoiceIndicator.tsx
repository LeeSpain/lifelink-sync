import { Mic, MicOff } from 'lucide-react';

interface TabletVoiceIndicatorProps {
  isListening: boolean;
  isSpeaking: boolean;
  hasPermission: boolean | null;
}

export function TabletVoiceIndicator({
  isListening,
  isSpeaking,
  hasPermission,
}: TabletVoiceIndicatorProps) {
  const noPermission = hasPermission === false;

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <div className="relative">
        {/* Outer breathing pulse ring */}
        {isListening && !isSpeaking && (
          <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-[breathe_3s_ease-in-out_infinite]" />
        )}
        {isSpeaking && (
          <span className="absolute inset-0 rounded-full bg-blue-500/40 animate-pulse" />
        )}

        {/* Main indicator button */}
        <div
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSpeaking
              ? 'bg-blue-500 shadow-lg shadow-blue-500/40'
              : isListening
                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                : noPermission
                  ? 'bg-slate-700 border border-red-500/40'
                  : 'bg-slate-700 border border-slate-600'
          }`}
        >
          {noPermission || !isListening ? (
            <MicOff className={`h-6 w-6 ${noPermission ? 'text-red-400' : 'text-slate-400'}`} />
          ) : (
            <Mic className={`h-6 w-6 ${isSpeaking ? 'text-white' : 'text-white'}`} />
          )}
        </div>

        {/* Status label */}
        <div className="absolute -top-1 -right-1">
          <span
            className={`block w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
              isSpeaking
                ? 'bg-blue-400 animate-pulse'
                : isListening
                  ? 'bg-emerald-400 animate-[breathe_3s_ease-in-out_infinite]'
                  : noPermission
                    ? 'bg-red-400'
                    : 'bg-slate-500'
            }`}
          />
        </div>
      </div>

      {/* Inline CSS for breathe animation */}
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}
