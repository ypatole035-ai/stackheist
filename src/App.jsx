import { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen.jsx';
import GameplayScreen from './components/GameplayScreen.jsx';
import GameOverScreen from './components/GameOverScreen.jsx';
import ShopScreen from './components/ShopScreen.jsx';
import LeaderboardScreen from './components/LeaderboardScreen.jsx';
import { gameStore } from './store/gameStore.js';
import { audio } from './audio/engine.js';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [overData, setOverData] = useState(null);
  const [store, setStore] = useState(gameStore.get());

  useEffect(() => {
    const currentStore = gameStore.get();
    audio.setVolume(currentStore.volume);
    audio.setMuted(currentStore.muted);
    
    const unsub = gameStore.subscribe(setStore);
    
    // try enter fullscreen on first interaction
    const onFirst = () => {
      audio.init();
      audio.resume();
      document.removeEventListener('touchstart', onFirst);
      document.removeEventListener('mousedown', onFirst);
    };
    document.addEventListener('touchstart', onFirst, { once:true });
    document.addEventListener('mousedown', onFirst, { once:true });
    return unsub;
  }, []);

  return (
    <div className="font-[ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Ubuntu,Cantarell,Noto_Sans,sans-serif] antialiased bg-black">
      {screen === 'home' && (
        <HomeScreen
          onPlay={() => setScreen('game')}
          onShop={() => setScreen('shop')}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}
      {screen === 'game' && (
        <GameplayScreen
          onGameOver={(data) => { setOverData(data); setScreen('over'); }}
          onHome={() => setScreen('home')}
        />
      )}
      {screen === 'over' && overData && (
        <GameOverScreen
          score={overData.score}
          best={overData.best}
          coinsEarned={overData.coinsEarned}
          towerSnapshot={overData.snapshot}
          onReplay={() => setScreen('game')}
          onShop={() => setScreen('shop')}
          onHome={() => setScreen('home')}
        />
      )}
      {screen === 'shop' && (
        <ShopScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen onBack={() => setScreen('home')} />
      )}
    </div>
  );
}
