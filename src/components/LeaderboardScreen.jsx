import { useEffect, useState } from 'react';
import { gameStore } from '../store/gameStore.js';
import { audio } from '../audio/engine.js';

function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

export default function LeaderboardScreen({ onBack }) {
  const [store, setStore] = useState(gameStore.get());
  useEffect(()=>gameStore.subscribe(setStore), []);
  const list = store.leaderboard || [];

  return (
    <div className="min-h-[100svh] bg-[#0a0f1c] text-white">
      <div className="mx-auto max-w-[640px] px-5 py-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { audio.click(); onBack(); }} className="rounded-xl bg-white/10 px-4 py-2 font-bold active:scale-95">← Back</button>
          <div className="text-sm text-white/60">Best: <span className="font-bold text-white">{store.bestScore.toLocaleString()}</span></div>
        </div>
        <h1 className="mt-6 text-3xl font-black">Leaderboard</h1>
        <div className="mt-4 rounded-2xl bg-white/5">
          {list.length === 0 && (
            <div className="p-6 text-center text-white/70">Play a game to set your first score!</div>
          )}
          <ul className="divide-y divide-white/10">
            {list.map((e,i)=>(
              <li key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`grid h-8 w-8 place-items-center rounded-full font-black ${i===0?'bg-yellow-400 text-yellow-950': i===1?'bg-slate-300 text-slate-900': i===2?'bg-amber-700 text-amber-100':'bg-white/10'}`}>{i+1}</div>
                  <div>
                    <div className="font-extrabold">{e.score.toLocaleString()}</div>
                    <div className="text-xs text-white/60">{fmtDate(e.date)}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-white/70">+{Math.floor(e.score/100)} 🪙</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
