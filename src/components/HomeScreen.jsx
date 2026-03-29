import { useEffect, useRef, useState } from 'react';
import { BLOCK_SKINS, BACKGROUNDS, ACHIEVEMENTS } from '../data/skins.js';
import { gameStore } from '../store/gameStore.js';
import { audioEngine } from '../audio/engine.js';

function renderObjectBlock(ctx, obj, x, y, w, h) {
  ctx.save();
  ctx.translate(x + w/2, y + h/2);
  
  if (obj.shape === 'apartment') {
    ctx.fillStyle = obj.color;
    ctx.fillRect(-w/2, -h/2, w, h);
    ctx.fillStyle = 'rgba(255,255,200,0.9)';
    const winW = w * 0.12, winH = h * 0.22;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillRect(-w/2 + w*0.15 + col * w*0.175, -h/2 + h*0.2 + row * h*0.4, winW, winH);
      }
    }
    ctx.fillStyle = obj.accent;
    ctx.fillRect(-w/2, h/2 - h*0.15, w, h*0.15);
  } else if (obj.shape === 'rocket') {
    ctx.fillStyle = obj.color;
    ctx.fillRect(-w*0.35, -h/2, w*0.7, h);
    ctx.fillStyle = obj.accent;
    ctx.beginPath();
    ctx.moveTo(-w*0.35, -h/2);
    ctx.lineTo(0, -h/2 - h*0.35);
    ctx.lineTo(w*0.35, -h/2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(200,240,255,0.95)';
    ctx.beginPath();
    ctx.arc(0, -h*0.1, w*0.12, 0, Math.PI*2);
    ctx.fill();
  } else if (obj.shape === 'tower') {
    ctx.fillStyle = obj.color;
    ctx.beginPath();
    ctx.moveTo(-w*0.45, h/2);
    ctx.lineTo(-w*0.38, -h/2);
    ctx.lineTo(w*0.38, -h/2);
    ctx.lineTo(w*0.45, h/2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = obj.accent;
    ctx.fillRect(-w*0.38, -h/2, w*0.76, h*0.18);
  } else {
    ctx.fillStyle = obj.color;
    const r = 8;
    ctx.beginPath();
    ctx.roundRect(-w/2, -h/2, w, h, r);
    ctx.fill();
  }
  ctx.restore();
}

export default function HomeScreen({ onPlay, onShop, onLeaderboard }) {
  const [store, setStore] = useState(gameStore.get());
  const canvasRef = useRef(null);
  const raf = useRef(0);
  const skin = BLOCK_SKINS.find(s=>s.id===store.equippedSkin) || BLOCK_SKINS[0];
  const bg = BACKGROUNDS.find(b=>b.id===store.equippedBg) || BACKGROUNDS[0];
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    const unsub = gameStore.subscribe(setStore);
    return unsub;
  }, []);

  useEffect(() => {
    audioEngine.init();
    audioEngine.startBackground();
    return () => audioEngine.stopBackground();
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    let w, h, dpr;
    const blocks = [];
    const blockH = 32;
    const blockW = 180;
    let yBase = 0;
    let time = 0;

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cvs.clientWidth; h = cvs.clientHeight;
      cvs.width = w * dpr; cvs.height = h * dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      yBase = h - 90;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create animated tower
    blocks.length = 0;
    for (let i=0; i<12; i++) {
      const isObjectSkin = skin.type === 'objects' && skin.objects;
      let blockData;
      
      if (isObjectSkin) {
        const obj = skin.objects[i % skin.objects.length];
        blockData = { ...obj, isObject: true };
      } else {
        blockData = { 
          color: skin.colors[i % skin.colors.length], 
          isObject: false 
        };
      }
      
      blocks.push({
        x: w/2 - blockW/2 + (Math.random()*8-4),
        y: yBase - i*blockH,
        baseX: w/2 - blockW/2,
        wobble: Math.random()*0.4-0.2,
        data: blockData,
        phase: Math.random() * Math.PI * 2,
      });
    }

    function frame() {
      time += 0.016;
      ctx.clearRect(0,0,w,h);
      
      const globalSway = Math.sin(time*0.7) * 1.8;
      
      blocks.forEach((b, i) => {
        const heightFactor = i * 0.035;
        const localSway = Math.sin(time*1.8 + b.phase) * 0.8 * heightFactor;
        const totalSway = (globalSway + localSway) * (i * 0.08);
        const breathe = Math.sin(time*2.2 + i*0.3) * 0.4;
        
        const xx = b.baseX + totalSway + b.wobble;
        const yy = b.y + breathe;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        if (b.data.isObject) {
          renderObjectBlock(ctx, b.data, xx+3, yy+4, blockW, blockH);
        } else {
          ctx.beginPath();
          ctx.roundRect(xx+3, yy+4, blockW, blockH, 10);
          ctx.fill();
        }
        
        // Main block
        if (b.data.isObject) {
          renderObjectBlock(ctx, b.data, xx, yy, blockW, blockH);
        } else {
          ctx.fillStyle = b.data.color;
          ctx.beginPath();
          ctx.roundRect(xx, yy, blockW, blockH, 10);
          ctx.fill();
          
          // Highlight
          const grad = ctx.createLinearGradient(xx, yy, xx, yy+blockH);
          grad.addColorStop(0, 'rgba(255,255,255,0.28)');
          grad.addColorStop(0.4, 'rgba(255,255,255,0.08)');
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(xx, yy, blockW, blockH, 10);
          ctx.fill();
          
          // Edge
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.beginPath();
          ctx.roundRect(xx, yy, blockW, blockH, 10);
          ctx.stroke();
        }
      });

      // Animated falling block
      const slide = Math.sin(time*1.3) * (w*0.28);
      const fx = w/2 - blockW/2 + slide;
      const fy = 85 + Math.abs(Math.sin(time*0.9)) * 5;
      const blockIdx = Math.floor(time * 0.5) % (skin.objects?.length || skin.colors.length);
      
      ctx.globalAlpha = 0.92;
      if (skin.type === 'objects' && skin.objects) {
        const obj = skin.objects[blockIdx % skin.objects.length];
        renderObjectBlock(ctx, { ...obj, isObject: true }, fx, fy, blockW, blockH);
      } else {
        ctx.fillStyle = skin.colors[blockIdx % skin.colors.length];
        ctx.beginPath();
        ctx.roundRect(fx, fy, blockW, blockH, 10);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf.current = requestAnimationFrame(frame);
    }
    frame();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', resize); };
  }, [skin]);

  const unlockedAchievements = ACHIEVEMENTS.filter(a => store.achievements.includes(a.id));
  const completedDaily = store.dailyChallenge?.completed;

  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden select-none text-white" style={{background: bg.style}}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_20%,transparent_60%,rgba(0,0,0,.45)_100%)]" />
      
      {/* Animated background elements */}
      {bg.animated && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {bg.id === 'city' && Array.from({length: 6}).map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 bg-black/70"
              style={{
                left: `${i * 16.6}%`,
                width: '15%',
                height: `${100 + Math.sin(i) * 30}px`,
                animation: `pulse ${3 + i*0.3}s ease-in-out infinite`
              }}
            />
          ))}
        </div>
      )}
      
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      
      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-between px-5 py-8">
        <div className="w-full">
          <div className="mx-auto max-w-[700px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[13px]">
                <span className="inline-flex h-7 items-center rounded-full bg-black/40 px-3 font-bold backdrop-blur-md border border-white/10">
                  🪙 {store.coins.toLocaleString()}
                </span>
                <span className="inline-flex h-7 items-center rounded-full bg-black/40 px-3 font-bold backdrop-blur-md border border-white/10">
                  ⏭️ {store.skipsOwned}/3
                </span>
                {completedDaily && (
                  <span className="inline-flex h-7 items-center rounded-full bg-amber-500/20 px-3 font-bold backdrop-blur-md border border-amber-500/40 text-amber-200">
                    ✓ Daily
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAchievements(!showAchievements)}
                  className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold backdrop-blur-md border border-white/10 active:scale-95"
                >
                  🏆 {unlockedAchievements.length}
                </button>
                <button
                  onClick={() => { audioEngine.click(); document.documentElement.requestFullscreen?.().catch(()=>{}); }}
                  className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold backdrop-blur-md border border-white/10 active:scale-95"
                >
                  ⛶
                </button>
              </div>
            </div>

            <div className="mt-14 text-center">
              <h1 className="font-black tracking-tight text-[52px] sm:text-[68px] leading-[0.88]">
                <span className="bg-gradient-to-b from-white via-white to-white/75 bg-clip-text text-transparent drop-shadow-[0_8px_0_rgba(0,0,0,.38)]">
                  STACK
                </span>
                <br/>
                <span className="bg-gradient-to-b from-yellow-200 via-amber-300 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_8px_0_rgba(0,0,0,.38)]">
                  HEIST
                </span>
              </h1>
              <p className="mx-auto mt-4 max-w-[42ch] text-[15px] text-white/85 font-medium leading-relaxed">
                Stack perfect blocks to build your tower. Survive the heist every 10 drops and claim massive bonuses!
              </p>
              
              {store.dailyChallenge && !store.dailyChallenge.completed && (
                <div className="mt-5 mx-auto max-w-[340px] bg-black/40 backdrop-blur-md rounded-2xl px-4 py-3 border border-amber-500/30">
                  <div className="text-xs font-black text-amber-300 uppercase tracking-wide mb-1">Daily Challenge</div>
                  <div className="text-sm font-bold">{store.dailyChallenge.desc}</div>
                  <div className="mt-2 w-full bg-white/15 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (store.dailyChallenge.progress / store.dailyChallenge.target) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs opacity-75 mt-1 font-mono">
                    {store.dailyChallenge.progress}/{store.dailyChallenge.target} • Reward: {store.dailyChallenge.reward} 🪙
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="mx-auto grid max-w-[420px] gap-3.5">
            <button
              onClick={() => { audioEngine.click(); onPlay(); }}
              className="group relative w-full rounded-[22px] bg-gradient-to-b from-lime-300 via-lime-400 to-lime-600 py-[18px] text-[22px] font-black text-lime-950 shadow-[0_10px_0_0_#3f6212,inset_0_2px_0_0_rgba(255,255,255,.7)] transition active:translate-y-[5px] active:shadow-[0_5px_0_0_#3f6212]"
            >
              PLAY
              <span className="pointer-events-none absolute inset-0 rounded-[22px] bg-white/15 opacity-0 transition group-hover:opacity-100" />
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { audioEngine.click(); onShop(); }} 
                className="rounded-2xl bg-white/10 py-3.5 font-bold backdrop-blur-md border border-white/10 active:scale-95 hover:bg-white/15"
              >
                🛍️ SHOP
              </button>
              <button 
                onClick={() => { audioEngine.click(); onLeaderboard(); }} 
                className="rounded-2xl bg-white/10 py-3.5 font-bold backdrop-blur-md border border-white/10 active:scale-95 hover:bg-white/15"
              >
                🏆 RANKS
              </button>
            </div>
            
            <div className="mt-1 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="bg-black/30 rounded-xl py-2 backdrop-blur-md border border-white/5">
                <div className="opacity-60 font-semibold">BEST</div>
                <div className="font-black text-[13px]">{store.bestScore.toLocaleString()}</div>
              </div>
              <div className="bg-black/30 rounded-xl py-2 backdrop-blur-md border border-white/5">
                <div className="opacity-60 font-semibold">GAMES</div>
                <div className="font-black text-[13px]">{store.stats.gamesPlayed}</div>
              </div>
              <div className="bg-black/30 rounded-xl py-2 backdrop-blur-md border border-white/5">
                <div className="opacity-60 font-semibold">HEISTS</div>
                <div className="font-black text-[13px]">{store.stats.heistsCompleted}</div>
              </div>
            </div>
            
            <div className="text-center text-[11px] text-white/55 font-medium">
              Audio {Math.round(store.volume*100)}% {store.muted ? '• Muted' : '• On'} • Tap to drop blocks
            </div>
          </div>
        </div>
      </div>
      
      {showAchievements && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-5 pointer-events-auto" onClick={() => setShowAchievements(false)}>
          <div className="bg-gray-900 rounded-3xl p-5 w-full max-w-[420px] max-h-[80vh] overflow-auto border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">Achievements</h2>
              <button onClick={() => setShowAchievements(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✕</button>
            </div>
            
            <div className="space-y-2.5">
              {ACHIEVEMENTS.map(ach => {
                const unlocked = store.achievements.includes(ach.id);
                return (
                  <div 
                    key={ach.id}
                    className={`rounded-2xl p-3.5 border-2 ${unlocked ? 'bg-amber-950/30 border-amber-500/40' : 'bg-white/5 border-white/10 opacity-60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{unlocked ? ach.icon : '🔒'}</span>
                      <div className="flex-1">
                        <div className="font-black text-sm">{ach.name}</div>
                        <div className="text-xs opacity-80">{ach.desc}</div>
                      </div>
                      {unlocked && <span className="text-amber-400 font-black">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 text-center text-xs opacity-60">
              {unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
