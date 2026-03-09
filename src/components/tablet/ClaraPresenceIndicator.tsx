import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface ClaraPresenceIndicatorProps {
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  hasPermission: boolean | null;
  transcript: string;
  onToggleMute: () => void;
  onToggleListening: () => void;
}

export const ClaraPresenceIndicator = ({
  isListening,
  isSpeaking,
  isMuted,
  hasPermission,
  transcript,
  onToggleMute,
  onToggleListening,
}: ClaraPresenceIndicatorProps) => {
  const { t } = useTranslation('common');
  const [visibleTranscript, setVisibleTranscript] = useState('');

  // Show transcript briefly then fade
  useEffect(() => {
    if (transcript) {
      setVisibleTranscript(transcript);
      const timer = setTimeout(() => setVisibleTranscript(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [transcript]);

  // Determine state icon & color
  const noPermission = hasPermission === false;

  return (
    <div className="flex items-center gap-2">
      {/* Clara avatar */}
      <div className="relative">
        <img
          src="/clara-avatar.png"
          alt="Clara"
          className={`w-8 h-8 rounded-full object-cover ring-2 ${
            isSpeaking
              ? 'ring-blue-400'
              : isListening
                ? 'ring-green-400'
                : 'ring-white/20'
          }`}
        />
        {/* Status dot */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
            isSpeaking
              ? 'bg-blue-400 animate-pulse'
              : isListening
                ? 'bg-green-400 animate-pulse'
                : noPermission
                  ? 'bg-red-400'
                  : 'bg-slate-500'
          }`}
        />
      </div>

      {/* Mic toggle */}
      <button
        type="button"
        onClick={onToggleListening}
        aria-label={
          noPermission
            ? t('tablet.clara.micDenied')
            : isListening
              ? t('tablet.clara.disableVoice')
              : t('tablet.clara.enableVoice')
        }
        aria-pressed={isListening}
        className={`p-1.5 rounded-full transition-colors ${
          noPermission
            ? 'text-red-400 hover:bg-red-400/10'
            : isListening
              ? 'text-green-400 hover:bg-green-400/10'
              : 'text-slate-500 hover:bg-slate-700'
        }`}
        title={
          noPermission
            ? t('tablet.clara.micDenied')
            : isListening
              ? t('tablet.clara.voiceActiveTap')
              : t('tablet.clara.tapToEnable')
        }
      >
        {noPermission || !isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>

      {/* Mute/unmute TTS */}
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={isMuted ? t('tablet.clara.unmute') : t('tablet.clara.mute')}
        aria-pressed={isMuted}
        className={`p-1.5 rounded-full transition-colors ${
          isMuted
            ? 'text-red-400 hover:bg-red-400/10'
            : isSpeaking
              ? 'text-blue-400 hover:bg-blue-400/10'
              : 'text-slate-400 hover:bg-slate-700'
        }`}
        title={isMuted ? t('tablet.clara.mutedTap') : t('tablet.clara.tapToMute')}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className={`h-4 w-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
        )}
      </button>

      {/* Transcript pill */}
      {visibleTranscript && (
        <div className="bg-slate-800 border border-slate-700 rounded-full px-3 py-1 max-w-[200px] truncate">
          <span className="text-[11px] text-slate-300 italic">
            "{visibleTranscript}"
          </span>
        </div>
      )}
    </div>
  );
};
