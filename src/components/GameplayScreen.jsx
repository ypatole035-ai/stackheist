import { useEffect, useRef, useState, useCallback } from 'react';
import { gameStore } from '../store/gameStore';
import { audioEngine } from '../audio/engine';
import { BLOCK_SKINS, POWER_UPS, ACHIEVEMENTS } from '../data/skins';

const W = 420;
const H = 780;
const BLOCK_W = 120;
const BLOCK_H = 36;
const PERFECT_THRESHOLD = 5;
const GOOD_THRESHOLD = 20;
const MAX_WOBBLES = 5;
const HEIST_INTERVAL = 10;
const HEIST_TIME = 5000;

function rand(min, max) { return Math.random() * (max - min) + min; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function generateBlockObject(skin, type = null, colorIndex = 0) {
  if (skin.type === 'objects' && skin.objects) {
    const obj = skin.objects[colorIndex % skin.objects.length];
    return { ...obj, isObject: true, type, typeIndex: colorIndex };
  }
  const colors = skin.colors || ['#888'];
  return { 
    shape: 'rect', 
    color: colors[colorIndex % colors.length],
    isObject: false,
    type, 
    typeIndex: colorIndex 
  };
}

function drawObjectBlock(ctx, obj, x, y, w, h, isGhost = false, wobbleOffset = 0, rotation = 0) {
  ctx.save();
  ctx.translate(x + w/2 + wobbleOffset, y + h/2);
  if (rotation) ctx.rotate(rotation);
  
  if (isGhost) {
    ctx.globalAlpha = 0.25;
  }
  
  const scale = 1;
  const drawW = w * scale;
  const drawH = h * scale;
  
  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  
  if (obj.isObject) {
    drawDetailedObject(ctx, obj, drawW, drawH);
  } else {
    // Simple rounded rect
    const r = Math.min(10, drawH/2);
    ctx.fillStyle = obj.color;
    ctx.beginPath();
    ctx.roundRect(-drawW/2, -drawH/2, drawW, drawH, r);
    ctx.fill();
    
    // Highlight
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.roundRect(-drawW/2, -drawH/2, drawW, drawH/2.5, r);
    ctx.fill();
    
    // Edge
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-drawW/2, -drawH/2, drawW, drawH, r);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawDetailedObject(ctx, obj, w, h) {
  const shape = obj.shape;
  ctx.shadowColor = 'transparent';
  
  switch(shape) {
    case 'apartment': {
      // Base building
      const r = 6;
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.roundRect(-w/2, -h/2, w, h, r);
      ctx.fill();
      
      // Windows grid
      ctx.fillStyle = 'rgba(255,255,200,0.9)';
      const winW = w * 0.12;
      const winH = h * 0.22;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
          const wx = -w/2 + w*0.15 + col * w*0.175;
          const wy = -h/2 + h*0.2 + row * h*0.4;
          if ((row + col) % 3 !== 0) {
            ctx.fillRect(wx, wy, winW, winH);
          }
        }
      }
      
      // Bottom stripe (accent)
      ctx.fillStyle = obj.accent;
      ctx.fillRect(-w/2, h/2 - h*0.15, w, h*0.15);
      break;
    }
    
    case 'tower': {
      // Tapered tower
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.moveTo(-w*0.45, h/2);
      ctx.lineTo(-w*0.38, -h/2);
      ctx.lineTo(w*0.38, -h/2);
      ctx.lineTo(w*0.45, h/2);
      ctx.closePath();
      ctx.fill();
      
      // Vertical windows
      ctx.fillStyle = 'rgba(150, 220, 255, 0.85)';
      for (let i = 0; i < 5; i++) {
        const wy = -h/2 + h*0.15 + i * h*0.17;
        ctx.fillRect(-w*0.05, wy, w*0.1, h*0.12);
      }
      
      // Top glow
      ctx.fillStyle = obj.accent;
      ctx.fillRect(-w*0.38, -h/2, w*0.76, h*0.18);
      break;
    }
    
    case 'rocket': {
      // Body
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.roundRect(-w*0.35, -h/2, w*0.7, h, 8);
      ctx.fill();
      
      // Nose cone
      ctx.fillStyle = obj.accent;
      ctx.beginPath();
      ctx.moveTo(-w*0.35, -h/2);
      ctx.lineTo(0, -h/2 - h*0.35);
      ctx.lineTo(w*0.35, -h/2);
      ctx.closePath();
      ctx.fill();
      
      // Fins
      if (obj.fins) {
        ctx.fillStyle = obj.accent;
        // Left fin
        ctx.beginPath();
        ctx.moveTo(-w*0.35, h/2 - h*0.2);
        ctx.lineTo(-w*0.5, h/2);
        ctx.lineTo(-w*0.35, h/2);
        ctx.closePath();
        ctx.fill();
        // Right fin
        ctx.beginPath();
        ctx.moveTo(w*0.35, h/2 - h*0.2);
        ctx.lineTo(w*0.5, h/2);
        ctx.lineTo(w*0.35, h/2);
        ctx.closePath();
        ctx.fill();
      }
      
      // Window
      ctx.fillStyle = 'rgba(200,240,255,0.95)';
      ctx.beginPath();
      ctx.arc(0, -h*0.1, w*0.12, 0, Math.PI*2);
      ctx.fill();
      break;
    }
    
    case 'crate': {
      ctx.fillStyle = obj.color;
      const r = 4;
      ctx.beginPath();
      ctx.roundRect(-w/2, -h/2, w, h, r);
      ctx.fill();
      
      // Wood bands
      if (obj.bands) {
        ctx.strokeStyle = obj.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-w/2, -h/2 + h*0.33);
        ctx.lineTo(w/2, -h/2 + h*0.33);
        ctx.moveTo(-w/2, -h/2 + h*0.66);
        ctx.lineTo(w/2, -h/2 + h*0.66);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-w/2 + w*0.33, -h/2);
        ctx.lineTo(-w/2 + w*0.33, h/2);
        ctx.moveTo(-w/2 + w*0.66, -h/2);
        ctx.lineTo(-w/2 + w*0.66, h/2);
        ctx.stroke();
      }
      
      // Corner bolts
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      const bolt = w*0.06;
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.arc(sx * (w/2 - bolt*1.5), sy * (h/2 - bolt*1.5), bolt, 0, Math.PI*2);
        ctx.fill();
      });
      break;
    }
    
    case 'house': {
      // Base
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.roundRect(-w/2, -h/2 + h*0.25, w, h*0.75, 6);
      ctx.fill();
      
      // Roof
      if (obj.roof) {
        ctx.fillStyle = obj.accent;
        ctx.beginPath();
        ctx.moveTo(-w/2 - w*0.05, -h/2 + h*0.25);
        ctx.lineTo(0, -h/2 - h*0.15);
        ctx.lineTo(w/2 + w*0.05, -h/2 + h*0.25);
        ctx.closePath();
        ctx.fill();
      }
      
      // Door
      ctx.fillStyle = 'rgba(60,40,20,0.9)';
      ctx.fillRect(-w*0.15, h/2 - h*0.45, w*0.3, h*0.45);
      
      // Windows
      ctx.fillStyle = 'rgba(255,245,200,0.9)';
      ctx.fillRect(-w*0.4, -h*0.1, w*0.22, h*0.2);
      ctx.fillRect(w*0.18, -h*0.1, w*0.22, h*0.2);
      break;
    }
    
    case 'cylinder': {
      // Main body
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.roundRect(-w/2, -h/2, w, h, w/2);
      ctx.fill();
      
      // Rings
      if (obj.rings) {
        ctx.strokeStyle = obj.accent;
        ctx.lineWidth = 2.5;
        for (let i = 1; i <= 2; i++) {
          const y = -h/2 + h * (i/3);
          ctx.beginPath();
          ctx.moveTo(-w/2 + w*0.1, y);
          ctx.lineTo(w/2 - w*0.1, y);
          ctx.stroke();
        }
      }
      
      // Cap highlights
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, -h/2 + h*0.15, w*0.35, h*0.12, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, h/2 - h*0.15, w*0.35, h*0.12, 0, 0, Math.PI*2);
      ctx.fill();
      break;
    }
    
    case 'castle': {
      // Main keep
      ctx.fillStyle = obj.color;
      ctx.fillRect(-w*0.4, -h/2 + h*0.2, w*0.8, h*0.8);
      
      // Battlements
      const toothW = w*0.8/7;
      for (let i = 0; i < 7; i += 2) {
        ctx.fillRect(-w*0.4 + i*toothW, -h/2, toothW, h*0.2);
      }
      
      // Turrets
      if (obj.turrets) {
        ctx.fillStyle = obj.accent;
        // Left turret
        ctx.fillRect(-w/2, -h/2, w*0.18, h);
        ctx.beginPath();
        ctx.arc(-w/2 + w*0.09, -h/2, w*0.09, Math.PI, 0);
        ctx.fill();
        // Right turret
        ctx.fillRect(w/2 - w*0.18, -h/2, w*0.18, h);
        ctx.beginPath();
        ctx.arc(w/2 - w*0.09, -h/2, w*0.09, Math.PI, 0);
        ctx.fill();
      }
      
      // Gate
      ctx.fillStyle = 'rgba(40,25,15,0.95)';
      ctx.beginPath();
      ctx.arc(0, h/2 - h*0.15, w*0.12, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-w*0.12, h/2 - h*0.15, w*0.24, h*0.15);
      break;
    }
    
    case 'station': {
      // Base
      ctx.fillStyle = obj.color;
      const r = 8;
      ctx.beginPath();
      ctx.roundRect(-w/2, -h/2, w, h, r);
      ctx.fill();
      
      // Screen
      ctx.fillStyle = 'rgba(20,30,50,0.9)';
      ctx.fillRect(-w*0.35, -h*0.25, w*0.7, h*0.5);
      
      // Screen glow
      ctx.fillStyle = 'rgba(100,200,255,0.6)';
      ctx.fillRect(-w*0.32, -h*0.22, w*0.64, h*0.12);
      
      // Antennas
      if (obj.antennas) {
        ctx.strokeStyle = obj.accent;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        // Left
        ctx.beginPath();
        ctx.moveTo(-w*0.25, -h/2);
        ctx.lineTo(-w*0.35, -h/2 - h*0.25);
        ctx.stroke();
        ctx.fillStyle = obj.accent;
        ctx.beginPath();
        ctx.arc(-w*0.35, -h/2 - h*0.25, 3, 0, Math.PI*2);
        ctx.fill();
        // Right
        ctx.beginPath();
        ctx.moveTo(w*0.25, -h/2);
        ctx.lineTo(w*0.35, -h/2 - h*0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w*0.35, -h/2 - h*0.25, 3, 0, Math.PI*2);
        ctx.fill();
      }
      break;
    }
    
    // Candy shapes
    case 'lollipop': {
      // Stick
      ctx.fillStyle = '#E0D0B8';
      ctx.fillRect(-w*0.04, 0, w*0.08, h/2);
      // Candy
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.arc(0, -h*0.15, w*0.38, 0, Math.PI*2);
      ctx.fill();
      // Swirl
      if (obj.swirl) {
        ctx.strokeStyle = obj.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -h*0.15, w*0.28, 0, Math.PI*1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -h*0.15, w*0.18, Math.PI*0.5, Math.PI*2);
        ctx.stroke();
      }
      break;
    }
    
    case 'donut': {
      // Outer
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.arc(0, 0, w*0.42, 0, Math.PI*2);
      ctx.arc(0, 0, w*0.22, 0, Math.PI*2, true);
      ctx.fill('evenodd');
      // Frosting
      ctx.fillStyle = obj.accent;
      ctx.beginPath();
      ctx.arc(0, 0, w*0.42, 0, Math.PI*2);
      ctx.arc(0, 0, w*0.26, 0, Math.PI*2, true);
      ctx.fill('evenodd');
      // Sprinkles
      if (obj.sprinkles) {
        const sprinkles = ['#FF6B9D','#FFD166','#06D6A0','#118AB2'];
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI*2;
          const r = w*0.34;
          ctx.fillStyle = sprinkles[i % sprinkles.length];
          ctx.fillRect(Math.cos(ang)*r - 2, Math.sin(ang)*r - 6, 4, 12);
        }
      }
      break;
    }
    
    // Tech shapes
    case 'server': {
      ctx.fillStyle = obj.color;
      const r = 5;
      ctx.beginPath();
      ctx.roundRect(-w/2, -h/2, w, h, r);
      ctx.fill();
      
      // Drive bays
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      for (let i = 0; i < 3; i++) {
        const y = -h/2 + h*0.22 + i * h*0.26;
        ctx.fillRect(-w*0.42, y, w*0.84, h*0.16);
      }
      
      // Lights
      if (obj.lights) {
        const lightColors = ['#10B981', '#F59E0B', '#EF4444'];
        for (let i = 0; i < 3; i++) {
          const y = -h/2 + h*0.25 + i * h*0.26;
          ctx.fillStyle = lightColors[i];
          ctx.beginPath();
          ctx.arc(w*0.35, y + h*0.08, 3, 0, Math.PI*2);
          ctx.fill();
          // Glow
          ctx.fillStyle = lightColors[i] + '60';
          ctx.beginPath();
          ctx.arc(w*0.35, y + h*0.08, 6, 0, Math.PI*2);
          ctx.fill();
        }
      }
      break;
    }
    
    default: {
      // Fallback simple rect
      ctx.fillStyle = obj.color;
      const r = 8;
      ctx.beginPath();
      ctx.roundRect(-w/2, -h/2, w, h, r);
      ctx.fill();
    }
  }
  
  // Special type indicators
  if (obj.type === 'power') {
    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 0, 0);
  } else if (obj.type === 'bomb') {
    ctx.fillStyle = '#F87171';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💀', 0, 0);
  } else if (obj.type === 'gold') {
    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', 0, 0);
  } else if (obj.type === 'ghost') {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.roundRect(-w/2 + 4, -h/2 + 4, w - 8, h - 8, 6);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export default function GameplayScreen({ onGameOver, onHome }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef(null);
  const [ui, setUi] = useState({ score: 0, multiplier: 1, coins: 0, count: 0, skips: 0, combo: 0 });
  const [pauseMenu, setPauseMenu] = useState({ open: false, confirm: null });
  const [heistPrompt, setHeistPrompt] = useState(null);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [particles, setParticles] = useState([]);
  const [powerUpActive, setPowerUpActive] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const ftIdRef = useRef(1);
  const particleIdRef = useRef(1);
  const gameStartTime = useRef(Date.now());
  const gameStats = useRef({ maxHeight: 0, maxPerfectStreak: 0, heistsCompleted: 0, bombsRemoved: 0, ghostBlocksStacked: 0, perfectStreak: 0 });
  
  const addFloatingText = useCallback((text, x, y, color = '#fff', big = false) => {
    const id = ftIdRef.current++;
    setFloatingTexts(arr => [...arr, { id, text, x, y, color, big, life: 1 }]);
    setTimeout(() => {
      setFloatingTexts(arr => arr.filter(t => t.id !== id));
    }, 1200);
  }, []);
  
  const addParticles = useCallback((x, y, color, count = 12) => {
    const id = particleIdRef.current++;
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: id + i,
        x, y,
        vx: rand(-4, 4),
        vy: rand(-6, -2),
        color,
        life: 1,
        size: rand(3, 8)
      });
    }
    setParticles(arr => [...arr, ...newParticles]);
    setTimeout(() => {
      setParticles(arr => arr.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 1000);
  }, []);
  
  const checkAchievements = useCallback(() => {
    const store = gameStore.get();
    const newAchievements = [];
    
    ACHIEVEMENTS.forEach(achievement => {
      if (!store.achievements.includes(achievement.id) && achievement.condition(store.stats)) {
        gameStore.unlockAchievement(achievement.id);
        newAchievements.push(achievement);
      }
    });
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      setTimeout(() => setAchievements(prev => prev.slice(newAchievements.length)), 3000);
    }
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    
    const store = gameStore.get();
    const skinData = BLOCK_SKINS.find(s => s.id === store.equippedSkin) || BLOCK_SKINS[0];
    
    const state = {
      tower: [],
      current: null,
      dropping: null,
      score: 0,
      multiplier: 1,
      wobbles: 0,
      blockCount: 0,
      speed: 2.2,
      dir: 1,
      perfectStreak: 0,
      paused: false,
      gameOver: false,
      heist: null,
      cameraY: 0,
      time: performance.now(),
      backgroundTime: 0,
      screenShake: 0,
      comboMultiplier: 1,
      skin: skinData,
      activePowerUps: {},
      windOffset: 0,
      lastBlockTypeIndex: 0,
    };
    stateRef.current = state;
    
    // Daily challenge
    const today = new Date().toDateString();
    let challenge = store.dailyChallenge;
    if (!challenge || challenge.date !== today) {
      const challenges = [
        { id: 'blocks_50', desc: 'Stack 50 blocks', target: 50, reward: 100, type: 'blocks' },
        { id: 'perfect_10', desc: 'Get 10 perfect drops', target: 10, reward: 75, type: 'perfect' },
        { id: 'heist_3', desc: 'Complete 3 heists', target: 3, reward: 150, type: 'heist' },
        { id: 'score_10000', desc: 'Score 10,000 points', target: 10000, reward: 120, type: 'score' },
      ];
      challenge = { ...challenges[Math.floor(Math.random() * challenges.length)], date: today, progress: 0, completed: false };
      gameStore.setDailyChallenge(challenge);
    }
    setDailyChallenge(challenge);
    
    gameStartTime.current = Date.now();
    gameStats.current = { maxHeight: 0, maxPerfectStreak: 0, heistsCompleted: 0, bombsRemoved: 0, ghostBlocksStacked: 0, perfectStreak: 0 };
    
    function spawnBlock() {
      state.blockCount += 1;
      gameStats.current.maxHeight = Math.max(gameStats.current.maxHeight, state.tower.length + 1);
      
      let blockType = null;
      const r = Math.random();
      if (r < 0.08) blockType = 'power';
      else if (r < 0.16) blockType = 'bomb';
      else if (r < 0.24) blockType = 'gold';
      else if (r < 0.32) blockType = 'ghost';
      
      if (blockType === 'ghost') gameStats.current.ghostBlocksStacked += 1;
      
      const colorIdx = (state.lastBlockTypeIndex + 1) % (state.skin.objects?.length || state.skin.colors?.length || 5);
      state.lastBlockTypeIndex = colorIdx;
      
      state.current = {
        x: W/2 - BLOCK_W/2,
        y: 60,
        w: BLOCK_W,
        h: BLOCK_H,
        type: blockType,
        vx: state.speed * state.dir,
        object: generateBlockObject(state.skin, blockType, colorIdx),
        wobbleTime: 0,
        rotation: 0,
      };
      
      state.dir *= -1;
      state.speed = Math.min(5.5, 2.2 + state.blockCount * 0.018);
      
      if (state.blockCount % HEIST_INTERVAL === 0 && state.tower.length >= 6) {
        triggerHeist();
      }
    }
    
    function triggerHeist() {
      state.paused = true;
      state.heist = {
        active: true,
        timeLeft: HEIST_TIME,
        chosenIndex: null,
        success: null,
        promptShown: false,
      };
      audioEngine.heistAlarm();
      
      // Show prompt first, then start timer after dismissal
      setHeistPrompt({ show: true });
    }
    
    function startHeistTimer() {
      if (state.heist) {
        state.heist.promptShown = true;
        state.paused = false;
      }
    }
    
    function settleDrop() {
      const b = state.dropping;
      const top = state.tower[state.tower.length - 1];
      const topY = top ? top.y : H - 80;
      b.y = topY - BLOCK_H;
      
      const prev = state.tower[state.tower.length - 1];
      const prevCenter = prev ? (prev.x + prev.w/2) : W/2;
      const currCenter = b.x + b.w/2;
      const offset = Math.abs(currCenter - prevCenter);
      
      let dropQuality = 'bad';
      let scoreAdd = 100;
      
      if (offset <= PERFECT_THRESHOLD) {
        dropQuality = 'perfect';
        state.perfectStreak += 1;
        gameStats.current.perfectStreak = Math.max(gameStats.current.perfectStreak, state.perfectStreak);
        state.multiplier = Math.min(10, state.multiplier + 1 + Math.floor(state.perfectStreak / 5));
        scoreAdd = 100 * state.multiplier;
        
        if (state.perfectStreak % 5 === 0) {
          state.multiplier = Math.min(10, state.multiplier + 1);
          addFloatingText('COMBO! +2 MULTIPLIER', W/2, b.y - 50, '#FFD93D', true);
          addParticles(b.x + b.w/2, b.y, '#FFD93D', 20);
          audioEngine.powerUp();
        }
        
        addFloatingText(`PERFECT! ×${state.multiplier}`, currCenter, b.y - 30, '#7CFC00', true);
        addParticles(b.x + b.w/2, b.y + b.h/2, '#7CFC00', 15);
        audioEngine.perfectDing();
        state.screenShake = 0;
      } else if (offset <= GOOD_THRESHOLD) {
        dropQuality = 'good';
        state.perfectStreak = 0;
        scoreAdd = 100;
        addFloatingText('Good!', currCenter, b.y - 25, '#FFFFFF');
        audioEngine.dropThud();
      } else {
        dropQuality = 'bad';
        state.perfectStreak = 0;
        const overlap = Math.max(30, BLOCK_W - offset);
        const ratio = overlap / BLOCK_W;
        
        if (currCenter > prevCenter) {
          b.x = prevCenter + prev.w/2 - overlap;
        } else {
          b.x = prevCenter - prev.w/2;
        }
        b.w = overlap;
        b.hang = true;
        b.wobbleTime = 0;
        
        state.wobbles += 1;
        state.screenShake = Math.min(12, state.wobbles * 2.5);
        scoreAdd = Math.floor(100 * ratio);
        addFloatingText('WOBBLE!', currCenter, b.y - 25, '#FF6B6B');
        addParticles(b.x + b.w/2, b.y, '#FF6B6B', 10);
        audioEngine.dropThud();
        
        if (state.wobbles >= 3 && state.wobbles < MAX_WOBBLES) {
          setTimeout(() => addFloatingText('TOWER UNSTABLE!', W/2, H/2, '#FF4444', true), 200);
        }
      }
      
      if (b.type === 'gold') {
        const goldBonus = 300 * (state.tower.length + 1);
        state.score += goldBonus;
        addFloatingText(`+${goldBonus} GOLD BONUS`, W/2, 140, '#FFD700');
        audioEngine.coinShimmer();
      }
      
      state.score += scoreAdd;
      state.tower.push(b);
      state.dropping = null;
      
      if (state.wobbles >= MAX_WOBBLES) {
        collapse();
        return;
      }
      
      const targetCamY = Math.max(0, (state.tower.length * BLOCK_H) - (H * 0.55));
      state.cameraY += (targetCamY - state.cameraY) * 0.12;
      
      if (state.tower.length >= 5) checkAchievements();
      
      // Update daily challenge
      if (dailyChallenge && !dailyChallenge.completed) {
        let progress = dailyChallenge.progress;
        if (dailyChallenge.type === 'blocks') progress = state.blockCount;
        else if (dailyChallenge.type === 'perfect' && dropQuality === 'perfect') progress += 1;
        else if (dailyChallenge.type === 'score') progress = state.score;
        
        if (progress >= dailyChallenge.target) {
          const updated = { ...dailyChallenge, progress, completed: true };
          gameStore.setDailyChallenge(updated);
          setDailyChallenge(updated);
          gameStore.addCoins(dailyChallenge.reward);
          addFloatingText(`DAILY COMPLETE! +${dailyChallenge.reward} 🪙`, W/2, H/2 - 100, '#FFD700', true);
        } else {
          gameStore.setDailyChallenge({ ...dailyChallenge, progress });
          setDailyChallenge(prev => ({ ...prev, progress }));
        }
      }
      
      setUi({
        score: state.score,
        multiplier: state.multiplier,
        coins: Math.floor(state.score / 100),
        count: state.blockCount,
        skips: gameStore.get().skipsOwned,
        combo: state.perfectStreak
      });
      
      if (!state.heist) spawnBlock();
    }
    
    function collapse() {
      state.gameOver = true;
      state.paused = true;
      audioEngine.collapse();
      
      const finalScore = state.score;
      const coinsEarned = gameStore.recordScore(finalScore, gameStats.current);
      gameStore.updateStats({
        heistsCompleted: gameStats.current.heistsCompleted,
        bombsRemoved: gameStats.current.bombsRemoved,
      });
      
      setTimeout(() => onGameOver({ score: finalScore, coins: coinsEarned, blocks: state.blockCount }), 1400);
    }
    
    function doHeistRemoval(idx) {
      if (!state.heist || state.heist.chosenIndex !== null) return;
      state.heist.chosenIndex = idx;
      
      const removed = state.tower[idx];
      const isPower = removed.type === 'power';
      const isBomb = removed.type === 'bomb';
      const totalBlocks = state.tower.length;
      const positionRatio = (totalBlocks - idx) / totalBlocks;
      
      state.tower.splice(idx, 1);
      if (isBomb) gameStats.current.bombsRemoved += 1;
      
      for (let i = idx; i < state.tower.length; i++) {
        state.tower[i].y += BLOCK_H;
      }
      
      let success = false;
      let bonus = 0;
      
      if (isBomb) {
        const toRemove = [];
        if (idx - 1 >= 0) toRemove.push(idx - 1);
        if (idx < state.tower.length) toRemove.push(idx);
        
        toRemove.sort((a, b) => b - a).forEach(i => {
          if (state.tower[i]) {
            addParticles(state.tower[i].x + state.tower[i].w/2, state.tower[i].y + BLOCK_H/2, '#FF4500', 18);
            state.tower.splice(i, 1);
          }
        });
        
        for (let i = 0; i < state.tower.length; i++) {
          state.tower[i].y = (H - 80) - (state.tower.length - i) * BLOCK_H;
        }
        
        state.wobbles = Math.min(MAX_WOBBLES - 1, state.wobbles + 3);
        state.screenShake = 15;
        addFloatingText('BOMB EXPLODED!', W/2, H/2, '#FF4500', true);
        audioEngine.bombBoom();
        
        const stability = 0.3 + positionRatio * 0.4;
        success = Math.random() < stability;
      } else {
        const baseStability = 0.85;
        const positionMalus = (1 - positionRatio) * 0.55;
        const wobbleMalus = (state.wobbles / MAX_WOBBLES) * 0.3;
        const finalStability = baseStability - positionMalus - wobbleMalus;
        
        success = Math.random() < finalStability;
      }
      
      if (success) {
        bonus = state.multiplier * 500 * (isPower ? 2 : 1) * state.comboMultiplier;
        state.score += bonus;
        gameStats.current.heistsCompleted += 1;
        state.wobbles = Math.max(0, state.wobbles - 1);
        addFloatingText(`HEIST SUCCESS! +${bonus}`, W/2, H/2 - 80, '#00FF88', true);
        addParticles(W/2, H/2, '#00FF88', 25);
        audioEngine.heistSuccess();
        state.heist.success = true;
        
        if (dailyChallenge && dailyChallenge.type === 'heist' && !dailyChallenge.completed) {
          const newProgress = dailyChallenge.progress + 1;
          if (newProgress >= dailyChallenge.target) {
            gameStore.setDailyChallenge({ ...dailyChallenge, progress: newProgress, completed: true });
            gameStore.addCoins(dailyChallenge.reward);
            addFloatingText(`DAILY COMPLETE! +${dailyChallenge.reward} 🪙`, W/2, H/2 - 40, '#FFD700', true);
          }
        }
      } else {
        addFloatingText('HEIST FAILED!', W/2, H/2, '#FF0000', true);
        state.screenShake = 20;
        setTimeout(collapse, 900);
        return;
      }
      
      setTimeout(() => {
        state.heist = null;
        state.paused = false;
        setUi(s => ({ ...s, score: state.score, skips: gameStore.get().skipsOwned }));
        if (!state.gameOver) spawnBlock();
      }, 1600);
    }
    
    function drawBackground() {
      const time = state.backgroundTime * 0.0003;
      const bg = gameStore.get().equippedBg;
      
      if (bg === 'space') {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (let i = 0; i < 60; i++) {
          const x = (i * 37 + time * 20) % W;
          const y = (i * 59 + time * 10) % H;
          const size = (Math.sin(time + i) + 1) * 0.8 + 0.3;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI*2);
          ctx.fill();
        }
      } else if (bg === 'underwater') {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0369A1');
        grad.addColorStop(1, '#0C4A6E');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const y = (time * 40 + i * 180) % (H + 100) - 50;
          ctx.beginPath();
          for (let x = 0; x < W; x += 10) {
            const waveY = y + Math.sin((x * 0.02) + time * 2 + i) * 8;
            if (x === 0) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
          }
          ctx.stroke();
        }
      } else if (bg === 'jungle') {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0B3D0B');
        grad.addColorStop(1, '#2E8B57');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (let i = 0; i < 8; i++) {
          const x = (i * W/7) + Math.sin(time + i) * 10;
          const leafY = H - 100 + Math.sin(time*0.5 + i) * 5;
          ctx.beginPath();
          ctx.ellipse(x, leafY, 30, 60, Math.sin(time + i) * 0.2, 0, Math.PI*2);
          ctx.fill();
        }
      } else if (bg === 'sunset') {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#1A1A2E');
        grad.addColorStop(0.3, '#16213E');
        grad.addColorStop(0.7, '#533483');
        grad.addColorStop(1, '#0F3460');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        
        ctx.fillStyle = 'rgba(255, 107, 157, 0.18)';
        ctx.beginPath();
        ctx.arc(W * 0.7, H * 0.85, 120 + Math.sin(time) * 5, 0, Math.PI*2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255,20,147,0.4)';
        ctx.lineWidth = 2;
        const gridY = H * 0.6;
        for (let i = 0; i < 12; i++) {
          const y = gridY + i * 18;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
      } else {
        const baseGrad = ctx.createLinearGradient(0, 0, 0, H);
        baseGrad.addColorStop(0, '#0D1B2A');
        baseGrad.addColorStop(1, '#415A77');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, W, H);
        
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        const buildingCount = 14;
        for (let i = 0; i < buildingCount; i++) {
          const buildingW = W / buildingCount;
          const buildingH = 120 + Math.sin(i * 0.8) * 40 + Math.sin(time + i*0.3) * 3;
          const x = i * buildingW;
          const y = H - buildingH;
          
          ctx.fillRect(x + 2, y, buildingW - 4, buildingH);
          
          if (i % 3 === 0) {
            ctx.fillStyle = 'rgba(255,220,100,0.8)';
            for (let wy = 0; wy < buildingH - 30; wy += 18) {
              for (let wx = 0; wx < buildingW - 8; wx += 12) {
                if (Math.random() > 0.3) {
                  ctx.fillRect(x + 6 + wx, y + 10 + wy, 5, 8);
                }
              }
            }
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
          }
        }
      }
    }
    
    function render() {
      state.backgroundTime += 16;
      
      if (state.screenShake > 0) {
        state.screenShake *= 0.9;
        if (state.screenShake < 0.1) state.screenShake = 0;
      }
      
      ctx.save();
      if (state.screenShake > 0) {
        ctx.translate(rand(-state.screenShake, state.screenShake), rand(-state.screenShake, state.screenShake));
      }
      
      drawBackground();
      
      ctx.save();
      ctx.translate(0, -state.cameraY);
      
      const windEffect = Math.sin(state.backgroundTime * 0.001) * 2;
      state.windOffset = windEffect;
      
      state.tower.forEach((b, i) => {
        const baseWobble = b.hang ? Math.sin((state.backgroundTime * 0.005) + i) * 2.5 : 0;
        const windWobble = state.wobbles > 2 ? windEffect * (i / state.tower.length) : 0;
        const totalWobble = baseWobble + windWobble;
        const instability = state.wobbles > 0 ? Math.sin(state.backgroundTime * 0.003 + i * 0.5) * state.wobbles * 0.3 : 0;
        
        const isGhost = b.type === 'ghost' && (!state.heist || !state.heist.active);
        
        if (isGhost) {
          ctx.save();
          ctx.globalAlpha = 0.15;
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x + totalWobble, b.y + instability, b.w, b.h);
          ctx.restore();
        } else {
          drawObjectBlock(ctx, b.object, b.x, b.y, b.w, b.h, b.type === 'ghost', totalWobble, instability * 0.01);
        }
      });
      
      if (state.dropping) {
        const b = state.dropping;
        drawObjectBlock(ctx, b.object, b.x, b.y, b.w, b.h, b.type === 'ghost');
      }
      
      if (state.current && !state.dropping) {
        const b = state.current;
        const previewY = state.tower.length > 0 ? state.tower[state.tower.length - 1].y - BLOCK_H : H - 80 - BLOCK_H;
        
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, previewY - state.cameraY, b.w, b.h);
        ctx.restore();
        
        const bounce = state.current.type === 'power' ? Math.sin(state.backgroundTime * 0.008) * 1.5 : 0;
        drawObjectBlock(ctx, b.object, b.x, b.y - state.cameraY + bounce, b.w, b.h, b.type === 'ghost');
        
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(b.x, b.y - state.cameraY + bounce, b.w, b.h, 8);
        } else {
          ctx.rect(b.x, b.y - state.cameraY + bounce, b.w, b.h);
        }
        ctx.fill();
      }
      
      if (state.heist && state.heist.active && state.heist.promptShown) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, state.cameraY - 100, W, H + 200);
        
        const pulseSize = 1 + Math.sin(state.backgroundTime * 0.01) * 0.03;
        ctx.save();
        ctx.translate(W/2, state.cameraY + H/2 - 120);
        ctx.scale(pulseSize, pulseSize);
        
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 220);
        grad.addColorStop(0, 'rgba(220,20,60,0.5)');
        grad.addColorStop(0.7, 'rgba(220,20,60,0.2)');
        grad.addColorStop(1, 'rgba(220,20,60,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 220, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 54px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#DC143C';
        ctx.shadowBlur = 20;
        ctx.fillText('HEIST!', 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
        
        const timeRatio = state.heist.timeLeft / HEIST_TIME;
        const barW = W * 0.7;
        const barX = W * 0.15;
        const barY = state.cameraY + H - 140;
        
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(barX - 3, barY - 3, barW + 6, 22);
        
        const timeColor = timeRatio > 0.5 ? '#22c55e' : timeRatio > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillStyle = timeColor;
        ctx.fillRect(barX, barY, barW * timeRatio, 16);
        
        if (timeRatio < 0.3) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
          ctx.fillRect(0, state.cameraY, W, H);
        }
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('TAP A BLOCK TO REMOVE', W/2, barY - 18);
        
        ctx.font = '13px system-ui';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText('Lower blocks = higher risk, higher reward', W/2, barY + 30);
        
        state.tower.forEach((b, i) => {
          const isRemovable = state.tower.length > 3;
          if (isRemovable) {
            const pulse = 1 + Math.sin(state.backgroundTime * 0.008 + i) * 0.04;
            ctx.save();
            ctx.translate(b.x + b.w/2, b.y + b.h/2);
            ctx.scale(pulse, pulse);
            
            ctx.strokeStyle = b.type === 'bomb' ? '#ef4444' : 
                             b.type === 'power' ? '#3b82f6' :
                             b.type === 'gold' ? '#facc15' : 'rgba(255,255,255,0.9)';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.strokeRect(-b.w/2 - 3, -b.h/2 - 3, b.w + 6, b.h + 6);
            
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(-14, -b.h/2 - 22, 28, 16);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${i+1}`, 0, -b.h/2 - 14);
            ctx.restore();
          }
        });
        ctx.restore();
      }
      
      ctx.restore();
      ctx.restore();
      
      // Ground
      const groundY = H - 80 - state.cameraY;
      if (groundY > -50 && groundY < H) {
        const groundGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 80);
        groundGrad.addColorStop(0, '#1f2937');
        groundGrad.addColorStop(1, '#111827');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, groundY, W, 80);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 28) {
          ctx.beginPath();
          ctx.moveTo(x, groundY);
          ctx.lineTo(x, groundY + 80);
          ctx.stroke();
        }
      }
      
      // Particles
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y - state.cameraY, p.size * p.life, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life -= 0.025;
      });
      
      // Floating texts
      floatingTexts.forEach(t => {
        ctx.save();
        ctx.globalAlpha = t.life;
        ctx.fillStyle = t.color;
        ctx.font = t.big ? 'bold 26px system-ui' : 'bold 17px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (t.big) {
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 8;
        }
        ctx.fillText(t.text, t.x, t.y - state.cameraY - (1 - t.life) * 45);
        ctx.restore();
        t.life -= 0.018;
        t.y -= 0.9;
      });
      
      const now = performance.now();
      const dt = Math.min(32, now - state.time);
      state.time = now;
      
      const isPaused = state.paused || pauseMenu.open || heistPrompt?.show;
      if (!isPaused && !state.gameOver) {
        
        if (state.heist && state.heist.active && state.heist.promptShown) {
          state.heist.timeLeft -= dt;
          if (state.heist.timeLeft <= 0 && state.heist.chosenIndex === null) {
            collapse();
          }
        }
        
        if (state.current && !state.dropping && !state.heist) {
          let speedMultiplier = 1;
          if (state.activePowerUps.slowmo) speedMultiplier = 0.5;
          
          state.current.x += state.current.vx * speedMultiplier * (dt / 16);
          if (state.current.x <= 0) {
            state.current.x = 0;
            state.current.vx = Math.abs(state.current.vx);
          } else if (state.current.x + state.current.w >= W) {
            state.current.x = W - state.current.w;
            state.current.vx = -Math.abs(state.current.vx);
          }
        }
        
        if (state.dropping) {
          state.dropping.vy += 0.85 * (dt / 16);
          state.dropping.y += state.dropping.vy * (dt / 16);
          const top = state.tower[state.tower.length - 1];
          const targetY = top ? top.y - BLOCK_H : H - 80 - BLOCK_H;
          if (state.dropping.y >= targetY) {
            settleDrop();
          }
        }
      }
      
      rafRef.current = requestAnimationFrame(render);
    }
    
    function handleTap(clientX, clientY) {
      if (state.gameOver) return;
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * (W / rect.width);
      const y = (clientY - rect.top) * (H / rect.height);
      
      if (state.heist && state.heist.active && state.heist.promptShown && state.heist.chosenIndex === null) {
        const worldY = y + state.cameraY;
        
        for (let i = state.tower.length - 1; i >= 0; i--) {
          const b = state.tower[i];
          if (x >= b.x - 5 && x <= b.x + b.w + 5 && worldY >= b.y - 5 && worldY <= b.y + b.h + 5) {
            doHeistRemoval(i);
            return;
          }
        }
        return;
      }
      
      if (state.current && !state.dropping && !state.heist && !pauseMenu.open && !heistPrompt?.show) {
        state.dropping = { ...state.current, vy: 0 };
        state.current = null;
        audioEngine.dropThud();
        
        if (state.activePowerUps.autoperfect && state.activePowerUps.autoperfect > 0) {
          const top = state.tower[state.tower.length - 1];
          const targetX = top ? top.x + (top.w - BLOCK_W)/2 : W/2 - BLOCK_W/2;
          state.dropping.x = targetX;
          state.activePowerUps.autoperfect -= 1;
          if (state.activePowerUps.autoperfect === 0) {
            delete state.activePowerUps.autoperfect;
            setPowerUpActive(null);
          }
        }
      }
    }
    
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches[0]) handleTap(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    
    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      handleTap(e.clientX, e.clientY);
    });
    
    spawnBlock();
    audioEngine.startBackground();
    
    rafRef.current = requestAnimationFrame(render);
    
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      audioEngine.stopBackground();
    };
  }, [addFloatingText, addParticles, onGameOver, checkAchievements, dailyChallenge]);
  
  const skipHeist = () => {
    const s = stateRef.current;
    if (!s?.heist || !gameStore.useSkip()) return;
    
    s.heist = null;
    s.paused = false;
    setUi(prev => ({ ...prev, skips: gameStore.get().skipsOwned }));
    setHeistPrompt(null);
    
    if (s.tower.length === 0) {
      const store = gameStore.get();
      const skinData = BLOCK_SKINS.find(sk => sk.id === store.equippedSkin) || BLOCK_SKINS[0];
      s.current = {
        x: W/2 - BLOCK_W/2,
        y: 60,
        w: BLOCK_W,
        h: BLOCK_H,
        type: null,
        vx: s.speed * s.dir,
        object: generateBlockObject(skinData, null, 0),
        wobbleTime: 0,
        rotation: 0,
      };
    }
  };
  
  const startHeistFromPrompt = () => {
    const s = stateRef.current;
    if (s?.heist) {
      s.paused = false;
      s.heist.promptShown = true;
    }
    setHeistPrompt(null);
  };
  
  const usePowerUp = (powerId) => {
    const s = stateRef.current;
    if (!s || s.gameOver) return;
    
    switch(powerId) {
      case 'slowmo':
        s.activePowerUps.slowmo = true;
        setPowerUpActive('slowmo');
        setTimeout(() => {
          if (s) delete s.activePowerUps.slowmo;
          setPowerUpActive(null);
        }, 10000);
        break;
      case 'freeze':
        if (s.current) s.current.vx = 0;
        setTimeout(() => {
          if (s?.current && !s.dropping) {
            s.current.vx = s.speed * (Math.random() > 0.5 ? 1 : -1);
          }
        }, 3000);
        break;
      case 'autoperfect':
        s.activePowerUps.autoperfect = 3;
        setPowerUpActive('autoperfect');
        break;
      case 'shield':
        s.wobbles = Math.max(0, s.wobbles - 2);
        addFloatingText('SHIELD ACTIVATED', W/2, H/2, '#60A5FA', true);
        break;
    }
    audioEngine.powerUp();
  };
  
  const pause = () => {
    audioEngine.click();
    setPauseMenu({ open: true, confirm: null });
    if (stateRef.current) stateRef.current.paused = true;
  };
  
  const resume = () => {
    audioEngine.click();
    setPauseMenu({ open: false, confirm: null });
    if (stateRef.current && !stateRef.current.heist?.active) {
      stateRef.current.paused = false;
    }
  };
  
  const askRestart = () => {
    audioEngine.click();
    setPauseMenu(m => ({ ...m, confirm: 'restart' }));
  };
  
  const askHome = () => {
    audioEngine.click();
    setPauseMenu(m => ({ ...m, confirm: 'home' }));
  };
  
  const doRestart = () => {
    audioEngine.click();
    window.location.reload();
  };
  
  const goHome = () => {
    audioEngine.click();
    onHome();
  };
  
  return (
    <div className="h-[100svh] w-screen bg-black text-white flex flex-col items-center select-none touch-none">
      <div className="relative w-full max-w-[420px] flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none' }}
        />
        
        <div className="pointer-events-none absolute top-0 inset-x-0 p-3 flex items-start justify-between">
          <div className="bg-black/75 backdrop-blur-md rounded-2xl px-3 py-2 pointer-events-auto shadow-xl border border-white/10">
            <div className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">Score</div>
            <div className="text-xl font-black tabular-nums">{ui.score.toLocaleString()}</div>
            <div className="flex gap-3 text-[11px] mt-0.5">
              <span className="opacity-85 font-semibold">×{ui.multiplier}</span>
              <span className="opacity-70">Blocks: {ui.count}</span>
              {ui.combo >= 3 && (
                <span className="text-amber-300 font-bold">🔥{ui.combo}</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 pointer-events-auto">
            <div className="flex gap-1 items-center bg-black/75 backdrop-blur-md rounded-2xl px-2.5 py-2 shadow-xl border border-white/10">
              {[0,1,2].map(i => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center text-[11px] font-black transition-all ${
                    i < ui.skips ? 'bg-amber-400 border-amber-300 text-black shadow-lg' : 'border-white/25 text-white/35'
                  }`}
                  title="Skip tokens"
                >
                  ⏭
                </div>
              ))}
            </div>
            <button
              onClick={pause}
              className="w-11 h-11 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 shadow-xl"
              aria-label="Pause"
            >
              <span className="text-xl">⏸</span>
            </button>
          </div>
        </div>
        
        {powerUpActive && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-purple-600/90 backdrop-blur-md rounded-full px-4 py-1.5 text-sm font-bold animate-pulse">
              {powerUpActive === 'slowmo' ? '🐌 SLOW MO' : powerUpActive === 'autoperfect' ? '🎯 AUTO PERFECT' : '⚡ POWER'}
            </div>
          </div>
        )}
        
        {dailyChallenge && !dailyChallenge.completed && (
          <div className="absolute top-20 left-3 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md rounded-xl px-3 py-2 text-xs max-w-[160px]">
              <div className="font-bold text-amber-300">Daily</div>
              <div className="opacity-90">{dailyChallenge.desc}</div>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-amber-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (dailyChallenge.progress / dailyChallenge.target) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] opacity-70 mt-0.5">
                {dailyChallenge.progress}/{dailyChallenge.target}
              </div>
            </div>
          </div>
        )}
        
        {stateRef.current?.heist?.active && stateRef.current.heist.promptShown && (
          <div className="absolute bottom-24 inset-x-3 pointer-events-auto">
            <button
              onClick={skipHeist}
              disabled={gameStore.get().skipsOwned === 0}
              className={`w-full py-3 rounded-2xl font-black backdrop-blur-md border-2 transition-all ${
                gameStore.get().skipsOwned > 0
                  ? 'bg-amber-500/95 border-amber-300 text-black active:scale-98 shadow-xl'
                  : 'bg-black/60 border-white/20 text-white/40'
              }`}
            >
              Skip Heist ({gameStore.get().skipsOwned} token{gameStore.get().skipsOwned === 1 ? '' : 's'})
            </button>
          </div>
        )}
        
        {heistPrompt?.show && (
          <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-auto">
            <div className="bg-gradient-to-t from-red-950 to-red-900/95 border-t-2 border-red-500 rounded-t-3xl p-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl animate-pulse">🚨</span>
                <div>
                  <h2 className="text-xl font-black text-red-400">HEIST TIME!</h2>
                  <p className="text-white/70 text-xs">Tap a block to remove it from the tower</p>
                </div>
              </div>
              <div className="flex gap-2 mb-3 text-xs">
                <span className="bg-green-900/60 rounded-lg px-2 py-1 text-green-300">✓ Top = safer</span>
                <span className="bg-amber-900/60 rounded-lg px-2 py-1 text-amber-300">⚠ Bottom = bigger bonus</span>
              </div>
              <button
                onClick={startHeistFromPrompt}
                className="w-full py-3 bg-red-600 active:scale-98 rounded-2xl font-black text-base shadow-xl"
              >
                START HEIST 🔓
              </button>
            </div>
          </div>
        )}
        
        {achievements.map((ach, i) => (
          <div
            key={ach.id}
            className="absolute top-32 left-1/2 -translate-x-1/2 pointer-events-none z-30"
            style={{ transform: `translate(-50%, ${i * 70}px)` }}
          >
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-2xl px-4 py-2.5 shadow-2xl border border-amber-300 animate-slide-down">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ach.icon}</span>
                <div>
                  <div className="font-black text-sm">Achievement Unlocked!</div>
                  <div className="text-xs font-semibold opacity-90">{ach.name}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {pauseMenu.open && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center pointer-events-auto z-50">
            <div className="bg-gray-900 rounded-3xl p-6 w-[88%] max-w-[340px] shadow-2xl border border-white/10">
              {!pauseMenu.confirm ? (
                <>
                  <h2 className="text-2xl font-black mb-5 text-center">Paused</h2>
                  <div className="space-y-2.5">
                    <button onClick={resume} className="w-full py-3.5 bg-white text-black rounded-2xl font-black active:scale-98">
                      Resume
                    </button>
                    <button onClick={askRestart} className="w-full py-3.5 bg-gray-800 rounded-2xl font-bold active:scale-98 border border-white/10">
                      Restart
                    </button>
                    <button onClick={askHome} className="w-full py-3.5 bg-gray-800 rounded-2xl font-bold active:scale-98 border border-white/10">
                      Home
                    </button>
                  </div>
                  
                  <div className="mt-5 pt-5 border-t border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold">Volume</span>
                      <span className="text-xs opacity-70 font-mono">{Math.round(gameStore.get().volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0" max="1" step="0.01"
                      value={gameStore.get().volume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        gameStore.setVolume(v);
                        audioEngine.setVolume(v);
                      }}
                      className="w-full mb-4 accent-white"
                    />
                    <button
                      onClick={() => {
                        const m = !gameStore.get().muted;
                        gameStore.setMuted(m);
                        audioEngine.setMuted(m);
                      }}
                      className="w-full py-2.5 bg-gray-800 rounded-xl text-sm font-bold border border-white/10"
                    >
                      {gameStore.get().muted ? '🔈 Unmute' : '🔊 Mute'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-black mb-3 text-center">
                    {pauseMenu.confirm === 'restart' ? 'Restart Game?' : 'Return Home?'}
                  </h2>
                  <p className="text-sm opacity-80 mb-5 text-center">
                    {pauseMenu.confirm === 'restart'
                      ? 'Your current progress will be lost.'
                      : 'Your current run will end and score will be saved.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPauseMenu(m => ({ ...m, confirm: null }))}
                      className="py-3 bg-gray-800 rounded-2xl font-bold border border-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={pauseMenu.confirm === 'restart' ? doRestart : goHome}
                      className="py-3 bg-red-600 rounded-2xl font-black"
                    >
                      Confirm
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="w-full max-w-[420px] px-3 py-2.5 flex items-center justify-between text-xs opacity-80">
        <span className="font-bold">STACK HEIST</span>
        <span className="font-mono">{ui.coins} 🪙 this run</span>
      </div>
      
      <style>{`
        @keyframes slide-down {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
