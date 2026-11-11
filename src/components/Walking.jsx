import { useEffect, useRef, useState } from 'react';

/** Port of WalkingIndicator.kt drawWalker(): one frame of the walk cycle on a 100 × 112 grid. */
function drawWalker(ctx, w, h, t, color, showGround, walking) {
  ctx.clearRect(0, 0, w, h);
  const s = h / 112, ox = w / 2 - 50 * s;
  const P = (x, y) => [ox + x * s, y * s];
  const W = 2 * Math.PI * t;
  const bob = walking ? -3 * (Math.cos(2 * W) + 1) / 2 : 0;
  const hip = [50, 56 + bob], shoulder = [51.5, 31 + bob];

  const leg = (ph) => {
    if (!walking) {
      const th = ph === 0 ? 0.09 : -0.09;
      const k = [hip[0] + 22 * Math.sin(th), hip[1] + 22 * Math.cos(th)];
      return [hip, k, [k[0] + 22 * Math.sin(th), k[1] + 22 * Math.cos(th)]];
    }
    const a = W + ph, thigh = 0.46 * Math.sin(a);
    const knee = 0.12 + 0.95 * Math.pow(Math.max(0, Math.cos(a)), 1.6);
    const k = [hip[0] + 22 * Math.sin(thigh), hip[1] + 22 * Math.cos(thigh)];
    const shin = thigh - knee;
    return [hip, k, [k[0] + 22 * Math.sin(shin), k[1] + 22 * Math.cos(shin)]];
  };
  const arm = (ph) => {
    if (!walking) {
      const u = ph === 0 ? 0.12 : -0.12;
      const e = [shoulder[0] + 16 * Math.sin(u), shoulder[1] + 16 * Math.cos(u)];
      return [shoulder, e, [e[0] + 14 * Math.sin(u + 0.12), e[1] + 14 * Math.cos(u + 0.12)]];
    }
    const a = W + ph, upper = -0.5 * Math.sin(a);
    const e = [shoulder[0] + 16 * Math.sin(upper), shoulder[1] + 16 * Math.cos(upper)];
    const fore = upper + 0.55 + 0.25 * Math.max(0, -Math.sin(a));
    return [shoulder, e, [e[0] + 14 * Math.sin(fore), e[1] + 14 * Math.cos(fore)]];
  };
  const limb = (pts, alpha, width) => {
    ctx.beginPath();
    pts.forEach((p, i) => { const [x, y] = P(p[0], p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width * s;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  };

  ctx.fillStyle = color;
  if (showGround && !walking) {
    ctx.globalAlpha = 0.25; const [x, y] = P(30, 103); ctx.fillRect(x, y, 40 * s, 2.2 * s);
  } else if (showGround) {
    const offset = (t * 24) % 12;
    for (let x = -12; x < 112; x += 12) {
      const xx = x - offset;
      if (xx >= 4 && xx <= 92) {
        ctx.globalAlpha = 0.45 * (1 - Math.abs(xx - 50) / 48);
        const [px, py] = P(xx, 103); ctx.fillRect(px, py, 6 * s, 2.2 * s);
      }
    }
  }
  limb(arm(Math.PI), 0.45, 7);
  limb(leg(Math.PI), 0.45, 8);
  limb([hip, shoulder], 1, 9);
  limb(leg(0), 1, 8);
  ctx.globalAlpha = 1; ctx.beginPath();
  const [hx, hy] = P(walking ? 53 : 51, 17 + bob); ctx.arc(hx, hy, 9 * s, 0, Math.PI * 2); ctx.fill();
  limb(arm(0), 1, 7);
  ctx.globalAlpha = 1;
}

export function WalkingFigure({ height = 72, width = height * 1.5, walking = true, showGround = true, stepMs = 1000 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    const color = getComputedStyle(canvas).color;
    let raf; const start = performance.now();
    const frame = (now) => {
      drawWalker(ctx, width, height, walking ? ((now - start) % stepMs) / stepMs : 0, color, showGround, walking);
      if (walking) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [width, height, walking, showGround, stepMs]);
  return <canvas ref={ref} className="walker" style={{ width, height }} role="img" aria-label={walking ? 'Walking now' : 'Standing still'} />;
}

/** Ticks every second (MovementStatus re-evaluates each second). */
export function useSecondTick() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  return now;
}

function lastMovedInfo(lastActiveAt, nowMs) {
  const then = lastActiveAt ? Date.parse(lastActiveAt) : NaN;
  if (Number.isNaN(then)) return { title: "Hasn't moved yet", recency: 'not_today' };
  const total = Math.max(0, Math.floor((nowMs - then) / 1000));
  const days = Math.floor(total / 86400), hours = Math.floor((total % 86400) / 3600), mins = Math.floor((total % 3600) / 60);
  if (total < 5) return { title: 'Last moved just now', recency: 'just_now' };
  if (days > 0) return { title: `Last moved ${days}d ago`, recency: 'not_today' };
  if (hours > 0) return { title: `Last moved ${hours}h${mins > 0 ? ` ${mins}min` : ''} ago`, recency: 'earlier_today' };
  if (mins > 0) return { title: `Last moved ${mins}min ago`, recency: mins < 2 ? 'just_now' : 'within_hour' };
  return { title: `Last moved ${total}s ago`, recency: 'just_now' };
}

/** WalkingIndicator.kt MovementStatus: big walker while moving, "Last moved …" text when not. */
export function MovementStatus({ isWalking, lastActiveAt, walkerHeight = 72 }) {
  const now = useSecondTick();
  if (isWalking) {
    return (
      <div className="movement walking fade-in">
        <WalkingFigure height={walkerHeight} />
        <div className="walking-label">Walking now</div>
      </div>
    );
  }
  const info = lastMovedInfo(lastActiveAt, now);
  return <div className={`movement last-moved ${info.recency} fade-in`}>{info.title}</div>;
}
