import { useEffect, useRef } from 'react';
import type { OrbState } from './types';

const ORB_STATES = {
  idle:      { amplitude: 0.12, speed: 0.007, color: [50, 40, 140] as [number, number, number],  alpha: 0.85 },
  listening: { amplitude: 0.42, speed: 0.020, color: [100, 80, 255] as [number, number, number], alpha: 0.90 },
  thinking:  { amplitude: 0.28, speed: 0.013, color: [55, 110, 255] as [number, number, number], alpha: 0.88 },
  speaking:  { amplitude: 0.72, speed: 0.036, color: [140, 80, 255] as [number, number, number], alpha: 0.95 },
};

export function ClaraOrb({ state, modeBadge, wakeActive }: { state: OrbState; modeBadge?: string; wakeActive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);
  const currentRef = useRef({ ...ORB_STATES.idle });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    const CX = W / 2, CY = H / 2, R = W * 0.35, N = 80;
    const target = ORB_STATES[state];
    const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

    const draw = () => {
      tRef.current += currentRef.current.speed;
      const cur = currentRef.current;
      cur.amplitude = lerp(cur.amplitude, target.amplitude, 0.05);
      cur.speed = lerp(cur.speed, target.speed, 0.05);
      cur.color = cur.color.map((c, i) => lerp(c, target.color[i], 0.05)) as [number, number, number];
      cur.alpha = lerp(cur.alpha, target.alpha, 0.05);

      ctx.clearRect(0, 0, W, H);
      const t = tRef.current, amp = cur.amplitude;
      const [r, g, b] = cur.color;

      const grd = ctx.createRadialGradient(CX, CY, 0, CX, CY, R + 20);
      grd.addColorStop(0, `rgba(${r},${g},${b},0.15)`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath(); ctx.arc(CX, CY, R + 20, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();

      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const angle = (i / N) * Math.PI * 2;
        const noise = Math.sin(angle*3+t*2.1)*amp*0.4 + Math.sin(angle*5+t*1.7)*amp*0.3 + Math.sin(angle*7+t*3.1)*amp*0.2 + Math.sin(angle*2+t*0.9)*amp*0.1;
        const radius = R * (1 + noise);
        const x = CX + Math.cos(angle) * radius, y = CY + Math.sin(angle) * radius;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      const blobGrd = ctx.createRadialGradient(CX-8, CY-8, 0, CX, CY, R*1.3);
      blobGrd.addColorStop(0, `rgba(${Math.min(r+60,255)},${Math.min(g+60,255)},255,${cur.alpha})`);
      blobGrd.addColorStop(1, `rgba(${r},${g},${b},${cur.alpha})`);
      ctx.fillStyle = blobGrd; ctx.fill();

      if (state === 'speaking') {
        for (let i = 0; i < 12; i++) {
          const angle = (i/12)*Math.PI*2;
          const barLen = 4 + Math.abs(Math.sin(t*8+i*0.8))*12;
          ctx.beginPath();
          ctx.moveTo(CX+Math.cos(angle)*(R+6), CY+Math.sin(angle)*(R+6));
          ctx.lineTo(CX+Math.cos(angle)*(R+6+barLen), CY+Math.sin(angle)*(R+6+barLen));
          ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };

    // Backup interval in case rAF is throttled by iOS during speech recognition
    const intervalId = window.setInterval(() => {
      if (!document.hidden) draw();
    }, 50);

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(intervalId);
    };
  }, [state]);

  // Wake flash: briefly spike to speaking when entering listening
  const prevStateRef = useRef(state);
  useEffect(() => {
    if (state === 'listening' && prevStateRef.current === 'idle') {
      // Flash to speaking briefly
      Object.assign(currentRef.current, ORB_STATES.speaking);
      setTimeout(() => {
        Object.assign(currentRef.current, ORB_STATES.listening);
      }, 400);
    }
    prevStateRef.current = state;
  }, [state]);

  const stateLabel = state === 'listening' ? 'Listening...' : state === 'thinking' ? 'Thinking...' : state === 'speaking' ? 'Speaking...' : 'Ready';
  const labelColor = state === 'idle' ? '#5a4f80' : state === 'listening' ? '#8070d0' : state === 'thinking' ? '#6090ff' : '#a070ff';

  return (
    <div style={{ height: '33.333vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 60%, #1a0f3a 0%, #0a0812 70%)', flexShrink: 0 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#6b5fa0', textTransform: 'uppercase' as const, marginBottom: 10 }}>CLARA</div>
      <canvas ref={canvasRef} width={140} height={140} style={{ width: 140, height: 140 }} />
      <div style={{ fontSize: 10, letterSpacing: '0.15em', color: labelColor, textTransform: 'uppercase' as const, marginTop: 10, transition: 'color 0.3s' }}>{stateLabel}</div>
      {modeBadge && (
        <div style={{ fontSize: 10, letterSpacing: '0.1em', color: '#5a4f80', textTransform: 'uppercase' as const, marginTop: 4, background: 'rgba(90,53,184,0.2)', padding: '2px 8px', borderRadius: 10 }}>
          {modeBadge}
        </div>
      )}
      {wakeActive && state === 'idle' && (
        <div style={{ fontSize: 9, color: '#4a3f70', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#6050a0', animation: 'cpWakePulse 2s infinite' }} />
          Say "CLARA" to activate
        </div>
      )}
      <style>{`@keyframes cpWakePulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}
