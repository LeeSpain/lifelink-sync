import { useState, useEffect } from "react";
import { Brain } from "lucide-react";

interface RivenSpeechProps {
  text: string;
  speed?: number;
}

export function RivenSpeech({ text, speed = 25 }: RivenSpeechProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(timer);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
      <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
        <Brain className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-primary mb-1">Riven</p>
        <p className="text-sm text-foreground">
          {displayed}
          {!done && <span className="animate-pulse">|</span>}
        </p>
      </div>
    </div>
  );
}
