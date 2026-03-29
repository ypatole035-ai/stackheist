import { useEffect, useRef } from 'react';
import { audio } from '../audio/engine.js';

export default function GameOverScreen({ score, best, coinsEarned, towerSnapshot, onReplay, onShop, onHome }) {
  const canvasRef = useRef(null);
  const raf = useRef(0);

  useEffect(() => {
    audio.crash();
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');
    let w, h, dpr;
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio||1);
      w = cvs.clientWidth; h = cvs.clientHeight;
      cvs.width = w*dpr; cvs.height = h*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();
    window.addEventListener('resize', resize);

    const blocks = (towerSnapshot || []).map((b,i)=>({
      x: b.x, y: b.y, w: b.w, h: b.h,
      color: b.color,
      vx: (Math.random()-0.5)*6,
      vy: -2 - Math.random()*4,
      rot: 0, vr: (Math.random()-0.5)*0.2,
    }));
    const ground = h - 40;

    let t=0;
    function frame() {
      t+=0.016;
      ctx.clearRect(0,0,w,h);
      // background fade
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0,0,w,h);
      // draw blocks falling
      blocks.forEach(b=>{
        b.vy += 0.5; // gravity
        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.vr;
        if (b.y + b.h > ground) {
          b.y = ground - b.h;
          b.vy *= -0.35;
          b.vx *= 0.7;
          b.vr *= 0.7;
          if (Math.abs(b.vy) < 1) b.vy = 0;
        }
        ctx.save();
        ctx.translate(b.x + b.w/2, b.y + b.h/2);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        roundRect(ctx, -b.w/2, -b.h/2, b.w, b.h, 10, true);
        ctx.restore();
      });
      raf.current = requestAnimationFrame(frame);
    }
    frame();
    return ()=>{ cancelAnimationFrame(raf.current); window.removeEventListener('resize', resize); };
  }, [towerSnapshot]);

  return (
    <div className="relative min-h-[100svh] bg-[#070A12] text-white">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_20%,transparent_55%,rgba(0,0,0,.6)_100%)]" />
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[520px] flex-col items-center justify-center px-6 text-center">
        <div className="mb-2 rounded-full bg-red-500/20 px-3 py-1 text-sm font-bold text-red-200">TOWER COLLAPSED</div>
        <h1 className="text-5xl font-black tracking-tight">Game Over</h1>
        <div className="mt-6 grid w-full grid-cols-3 gap-3">
          <Stat label="Score" value={score.toLocaleString()} />
          <Stat label="Best" value={best.toLocaleString()} />
          <Stat label="Coins" value={`+${coinsEarned} 🪙`} />
        </div>
        <div className="mt-8 grid w-full gap-3">
          <button onClick={() => { audio.click(); onReplay(); }} className="rounded-2xl bg-gradient-to-b from-lime-300 to-lime-500 py-4 text-lg font-extrabold text-lime-950 shadow-[0_8px_0_0_#3f6212] active:translate-y-[4px] active:shadow-[0_4px_0_0_#3f6212]">PLAY AGAIN</button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { audio.click(); onShop(); }} className="rounded-2xl bg-white/10 py-3 font-bold backdrop-blur active:scale-95">SHOP</button>
            <button onClick={() => { audio.click(); onHome(); }} className="rounded-2xl bg-white/10 py-3 font-bold backdrop-blur active:scale-95">HOME</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({label, value}) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 backdrop-blur">
      <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r, fill) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
  if (fill) ctx.fill(); else ctx.stroke();
}
