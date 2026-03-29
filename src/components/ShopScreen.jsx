import { useEffect, useState } from 'react';
import { BLOCK_SKINS, BACKGROUNDS, POWER_UPS } from '../data/skins.js';
import { gameStore } from '../store/gameStore.js';
import { audioEngine } from '../audio/engine.js';

function renderObjectPreview(ctx, obj, x, y, w, h) {
  ctx.save();
  ctx.translate(x + w/2, y + h/2);
  
  const shape = obj.shape;
  
  switch(shape) {
    case 'apartment': {
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
      break;
    }
    case 'rocket': {
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
      break;
    }
    case 'tower': {
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
      break;
    }
    case 'server': {
      ctx.fillStyle = obj.color;
      ctx.fillRect(-w/2, -h/2, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(-w*0.42, -h/2 + h*0.22 + i * h*0.26, w*0.84, h*0.16);
      }
      break;
    }
    default: {
      ctx.fillStyle = obj.color;
      ctx.fillRect(-w/2, -h/2, w, h);
    }
  }
  ctx.restore();
}

export default function ShopScreen({ onBack }) {
  const [store, setStore] = useState(gameStore.get());
  const [msg, setMsg] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('skins');

  useEffect(() => gameStore.subscribe(setStore), []);

  function tryBuySkin(skin) {
    if (store.unlockedSkins.includes(skin.id)) {
      gameStore.equipSkin(skin.id);
      audioEngine.click();
      setMsg(`Equipped ${skin.name}!`);
      setTimeout(()=>setMsg(''), 1500);
      return;
    }
    if (gameStore.spendCoins(skin.price)) {
      gameStore.unlockSkin(skin.id);
      gameStore.equipSkin(skin.id);
      audioEngine.cashRegister();
      setMsg(`Unlocked ${skin.name}!`);
      setTimeout(()=>setMsg(''), 1500);
    } else {
      setMsg('Not enough coins!');
      audioEngine.tick();
      setTimeout(()=>setMsg(''), 1500);
    }
  }
  
  function tryBuyBg(bg) {
    if (store.unlockedBgs.includes(bg.id)) {
      gameStore.equipBg(bg.id);
      audioEngine.click();
      setMsg(`Equipped ${bg.name}!`);
      setTimeout(()=>setMsg(''), 1500);
      return;
    }
    if (gameStore.spendCoins(bg.price)) {
      gameStore.unlockBg(bg.id);
      gameStore.equipBg(bg.id);
      audioEngine.cashRegister();
      setMsg(`Unlocked ${bg.name}!`);
      setTimeout(()=>setMsg(''), 1500);
    } else {
      setMsg('Not enough coins!');
      audioEngine.tick();
      setTimeout(()=>setMsg(''), 1500);
    }
  }
  
  function buySkip() {
    if (store.skipsOwned >= 3) {
      setMsg('MAX SKIPS REACHED — Use one first!');
      audioEngine.tick();
      setTimeout(()=>setMsg(''), 1800);
      return;
    }
    if (gameStore.spendCoins(75)) {
      gameStore.addSkip();
      audioEngine.cashRegister();
      setMsg('Skip token purchased!');
      setTimeout(()=>setMsg(''), 1500);
    } else {
      setMsg('Need 75 coins');
      audioEngine.tick();
      setTimeout(()=>setMsg(''), 1500);
    }
  }
  
  function buyPowerUp(powerUp) {
    if (store.unlockedPowerUps.includes(powerUp.id)) {
      setMsg('Already owned!');
      setTimeout(()=>setMsg(''), 1500);
      return;
    }
    if (gameStore.spendCoins(powerUp.price)) {
      gameStore.unlockPowerUp(powerUp.id);
      audioEngine.powerUp();
      setMsg(`${powerUp.name} unlocked!`);
      setTimeout(()=>setMsg(''), 1500);
    } else {
      setMsg(`Need ${powerUp.price} coins`);
      audioEngine.tick();
      setTimeout(()=>setMsg(''), 1500);
    }
  }

  return (
    <div className="min-h-[100svh] bg-[#0a0f1c] text-white">
      <div className="mx-auto max-w-[900px] px-4 py-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => { audioEngine.click(); onBack(); }} className="rounded-xl bg-white/10 px-4 py-2.5 font-bold active:scale-95 hover:bg-white/15">
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-black/50 px-3.5 py-1.5 font-black border border-amber-500/30">
              🪙 {store.coins}
            </div>
            <div className="rounded-full bg-black/50 px-3.5 py-1.5 font-bold border border-white/10">
              ⏭️ {store.skipsOwned}/3
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-black mb-1">SHOP</h1>
        <p className="text-white/60 text-sm mb-4">Unlock new skins, backgrounds & power-ups</p>
        
        {msg && (
          <div className="mb-4 rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2.5 text-amber-100 font-bold text-center animate-pulse">
            {msg}
          </div>
        )}

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[
            { id: 'skins', name: 'Skins', icon: '🎨' },
            { id: 'backgrounds', name: 'Backgrounds', icon: '🌆' },
            { id: 'powerups', name: 'Power-ups', icon: '⚡' },
            { id: 'skips', name: 'Skip Tokens', icon: '⏭️' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => { audioEngine.click(); setSelectedCategory(cat.id); }}
              className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id 
                  ? 'bg-white text-black' 
                  : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {selectedCategory === 'skins' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BLOCK_SKINS.map(skin => {
              const owned = store.unlockedSkins.includes(skin.id);
              const equipped = store.equippedSkin === skin.id;
              return (
                <button 
                  key={skin.id} 
                  onClick={() => tryBuySkin(skin)}
                  className={`relative rounded-2xl p-4 text-left font-bold active:scale-98 transition-all border-2 ${
                    equipped ? 'border-lime-400 bg-lime-950/30' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="h-24 rounded-xl overflow-hidden mb-3 relative" style={{background: skin.bg}}>
                    {skin.type === 'objects' && skin.objects ? (
                      <canvas
                        ref={el => {
                          if (el && !el.dataset.drawn) {
                            const ctx = el.getContext('2d');
                            el.width = 200;
                            el.height = 96;
                            el.dataset.drawn = '1';
                            skin.objects.slice(0, 4).forEach((obj, i) => {
                              renderObjectPreview(ctx, obj, 15 + i * 46, 20, 36, 22);
                            });
                          }
                        }}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="flex h-full items-end gap-1.5 px-3 pb-3">
                        {(skin.colors || []).slice(0, 6).map((c, i) => (
                          <div key={i} className="flex-1 rounded-lg h-8 shadow-lg" style={{background: c}} />
                        ))}
                      </div>
                    )}
                    {equipped && (
                      <div className="absolute top-2 right-2 bg-lime-500 text-black text-xs font-black px-2 py-1 rounded-full">
                        ✓ EQUIPPED
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-black text-[15px]">{skin.name}</div>
                      <div className="text-xs text-white/60 mt-0.5">
                        {skin.type === 'objects' ? '🎯 3D Objects' : '🎨 Color Blocks'}
                      </div>
                      <div className="text-xs mt-1.5 font-semibold">
                        {owned ? (
                          <span className="text-lime-400">{equipped ? 'Currently equipped' : 'Owned — tap to equip'}</span>
                        ) : (
                          <span className="text-amber-300">{skin.price} 🪙</span>
                        )}
                      </div>
                    </div>
                    <div className={`rounded-xl px-3 py-1.5 text-xs font-black ${
                      owned ? 'bg-lime-500/20 text-lime-300 border border-lime-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {owned ? (equipped ? '✓' : 'EQUIP') : 'BUY'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedCategory === 'backgrounds' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BACKGROUNDS.map(bg => {
              const owned = store.unlockedBgs.includes(bg.id);
              const equipped = store.equippedBg === bg.id;
              return (
                <button 
                  key={bg.id} 
                  onClick={() => tryBuyBg(bg)}
                  className={`relative rounded-2xl p-4 text-left font-bold active:scale-98 transition-all border-2 ${
                    equipped ? 'border-lime-400 bg-lime-950/30' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="h-24 rounded-xl mb-3 relative overflow-hidden" style={{background: bg.style}}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {equipped && (
                      <div className="absolute top-2 right-2 bg-lime-500 text-black text-xs font-black px-2 py-1 rounded-full">
                        ✓ EQUIPPED
                      </div>
                    )}
                    {bg.animated && (
                      <div className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-0.5 rounded-full">
                        ✨ Animated
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-black text-[15px]">{bg.name}</div>
                      <div className="text-xs mt-1.5 font-semibold">
                        {owned ? (
                          <span className="text-lime-400">{equipped ? 'Currently equipped' : 'Owned — tap to equip'}</span>
                        ) : (
                          <span className="text-amber-300">{bg.price} 🪙</span>
                        )}
                      </div>
                    </div>
                    <div className={`rounded-xl px-3 py-1.5 text-xs font-black ${
                      owned ? 'bg-lime-500/20 text-lime-300 border border-lime-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {owned ? (equipped ? '✓' : 'EQUIP') : 'BUY'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedCategory === 'powerups' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {POWER_UPS.map(power => {
              const owned = store.unlockedPowerUps.includes(power.id);
              return (
                <button
                  key={power.id}
                  onClick={() => buyPowerUp(power)}
                  className={`rounded-2xl p-4 text-left border-2 transition-all active:scale-98 ${
                    owned ? 'border-purple-500/50 bg-purple-950/20' : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{power.icon}</div>
                    <div className="flex-1">
                      <div className="font-black">{power.name}</div>
                      <div className="text-xs text-white/70 mt-1 leading-relaxed">{power.description}</div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className={`text-sm font-black ${owned ? 'text-purple-300' : 'text-amber-300'}`}>
                          {owned ? '✓ Owned' : `${power.price} 🪙`}
                        </div>
                        {!owned && (
                          <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1 text-xs font-black">
                            BUY
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
              <div className="text-sm text-white/70 text-center py-2">
                💡 Power-ups activate automatically during gameplay!
              </div>
            </div>
          </div>
        )}

        {selectedCategory === 'skips' && (
          <div className="max-w-[500px]">
            <div className="rounded-2xl bg-gradient-to-br from-amber-950/40 to-orange-950/40 border-2 border-amber-500/30 p-5">
              <div className="flex items-start gap-4">
                <div className="text-4xl">⏭️</div>
                <div className="flex-1">
                  <div className="font-black text-lg mb-1">Heist Skip Token</div>
                  <div className="text-sm text-white/80 mb-3 leading-relaxed">
                    Skip a heist event completely. No risk, but no bonus either. Perfect for when your tower gets too tall!
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    {[0,1,2].map(i => (
                      <div
                        key={i}
                        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black ${
                          i < store.skipsOwned 
                            ? 'bg-amber-400 border-amber-300 text-black' 
                            : 'border-white/20 text-white/30 bg-white/5'
                        }`}
                      >
                        {i < store.skipsOwned ? '✓' : '○'}
                      </div>
                    ))}
                    <span className="text-sm text-white/60 ml-1">{store.skipsOwned}/3 owned</span>
                  </div>
                  
                  <button 
                    onClick={buySkip} 
                    disabled={store.skipsOwned >= 3}
                    className={`w-full py-3.5 rounded-xl font-black text-[15px] transition-all ${
                      store.skipsOwned >= 3
                        ? 'bg-white/10 text-white/40 cursor-not-allowed'
                        : 'bg-gradient-to-b from-amber-400 to-amber-600 text-black active:scale-98 shadow-lg'
                    }`}
                  >
                    {store.skipsOwned >= 3 ? 'MAXIMUM REACHED' : 'Buy for 75 🪙'}
                  </button>
                  
                  <div className="mt-3 text-xs text-white/50 text-center">
                    You earn ~1 coin per 100 points scored
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 rounded-xl bg-white/5 p-3 border border-white/10">
              <div className="text-xs font-bold text-white/80 mb-1">💡 Pro Tips:</div>
              <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                <li>Save tokens for when tower is very tall (40+ blocks)</li>
                <li>Bottom block removal is risky but gives bigger rewards</li>
                <li>Use tokens strategically, not just because you're scared!</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
