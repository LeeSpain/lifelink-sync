import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useEmergencySOS } from "@/hooks/useEmergencySOS";
import { Phone, Loader2, Check } from "lucide-react";

const HOLD_DURATION = 500; // ms to hold before triggering

export function FloatingSOSButton() {
  const { t } = useTranslation();
  const { triggerEmergencySOS, isTriggering } = useEmergencySOS();
  const [holding, setHolding] = useState(false);
  const [sent, setSent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStartRef = useRef<number>(0);

  const startHold = useCallback(() => {
    setHolding(true);
    holdStartRef.current = Date.now();

    timerRef.current = setTimeout(async () => {
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(200);

      try {
        await triggerEmergencySOS();
        setSent(true);
        setTimeout(() => setSent(false), 3000);
      } catch {
        // Error handled by the hook's toast
      }
      setHolding(false);
    }, HOLD_DURATION);
  }, [triggerEmergencySOS]);

  const cancelHold = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
  }, []);

  return (
    <button
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onTouchCancel={cancelHold}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      disabled={isTriggering}
      aria-label={t("mobile.sos.holdToActivate", { defaultValue: "Hold for SOS" })}
      className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-red-600 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform disabled:opacity-70"
    >
      {/* Pulse ring */}
      {!isTriggering && !sent && (
        <span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-30" />
      )}

      {/* Hold fill animation */}
      {holding && !isTriggering && (
        <span
          className="absolute inset-0 rounded-full bg-red-400 opacity-50"
          style={{
            animation: `sos-fill ${HOLD_DURATION}ms linear forwards`,
          }}
        />
      )}

      {/* Icon states */}
      <span className="relative z-10">
        {isTriggering ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : sent ? (
          <Check className="h-6 w-6" />
        ) : (
          <Phone className="h-6 w-6" />
        )}
      </span>

      {/* Label below button */}
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-red-600 whitespace-nowrap">
        SOS
      </span>

      {/* Inline keyframes */}
      <style>{`
        @keyframes sos-fill {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
      `}</style>
    </button>
  );
}
