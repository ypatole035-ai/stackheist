const SAVE_KEY = 'stack-heist-save-v1';

const defaultSave = {
  coins: 0,
  skipsOwned: 0,
  bestScore: 0,
  leaderboard: [],
  unlockedSkins: ['rainbow'],
  unlockedBgs: ['city'],
  equippedSkin: 'rainbow',
  equippedBg: 'city',
  volume: 0.7,
  muted: false,
  unlockedPowerUps: [],
  stats: {
    gamesPlayed: 0,
    totalScore: 0,
    heistsCompleted: 0,
    maxHeight: 0,
    maxPerfectStreak: 0,
    totalCoins: 0,
    bombsRemoved: 0,
    ghostBlocksStacked: 0,
    consecutiveHeists: 0,
    fastRunCompleted: false,
  },
  achievements: [],
  dailyChallenge: null,
  lastPlayDate: null,
};

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return {...defaultSave};
    const data = JSON.parse(raw);
    return { ...defaultSave, ...data, stats: { ...defaultSave.stats, ...(data.stats||{}) } };
  } catch {
    return {...defaultSave};
  }
}

function saveData(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

let state = loadSave();
const listeners = new Set();

export const gameStore = {
  get() { return state; },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  set(partial) {
    state = { ...state, ...partial };
    saveData(state);
    listeners.forEach(fn => fn(state));
  },

  addCoins(n) {
    state.coins = Math.max(0, state.coins + (n|0));
    state.stats.totalCoins += (n|0);
    saveData(state);
    listeners.forEach(fn => fn(state));
  },

  spendCoins(n) {
    if (state.coins >= n) {
      state.coins -= (n|0);
      saveData(state);
      listeners.forEach(fn => fn(state));
      return true;
    }
    return false;
  },

  addSkip() {
    if (state.skipsOwned >= 3) return false;
    state.skipsOwned = Math.min(3, state.skipsOwned + 1);
    saveData(state);
    listeners.forEach(fn => fn(state));
    return true;
  },

  useSkip() {
    if (state.skipsOwned > 0) {
      state.skipsOwned -= 1;
      saveData(state);
      listeners.forEach(fn => fn(state));
      return true;
    }
    return false;
  },

  unlockSkin(id) {
    if (!state.unlockedSkins.includes(id)) {
      state.unlockedSkins = [...state.unlockedSkins, id];
      saveData(state);
      listeners.forEach(fn => fn(state));
    }
  },

  equipSkin(id) {
    state.equippedSkin = id;
    saveData(state);
    listeners.forEach(fn => fn(state));
  },

  unlockBg(id) {
    if (!state.unlockedBgs.includes(id)) {
      state.unlockedBgs = [...state.unlockedBgs, id];
      saveData(state);
      listeners.forEach(fn => fn(state));
    }
  },

  equipBg(id) {
    state.equippedBg = id;
    saveData(state);
    listeners.forEach(fn => fn(state));
  },

  unlockPowerUp(id) {
    if (!state.unlockedPowerUps.includes(id)) {
      state.unlockedPowerUps = [...state.unlockedPowerUps, id];
      saveData(state);
      listeners.forEach(fn => fn(state));
    }
  },

  updateStats(partial) {
    state.stats = { ...state.stats, ...partial };
    saveData(state);
    listeners.forEach(fn => fn(state));
  },

  unlockAchievement(id) {
    if (!state.achievements.includes(id)) {
      state.achievements = [...state.achievements, id];
      saveData(state);
      listeners.forEach(fn => fn(state));
      return true;
    }
    return false;
  },

  setDailyChallenge(challenge) {
    state.dailyChallenge = challenge;
    saveData(state);
    listeners.forEach(fn => fn(state));
  },

  recordScore(score, gameStats = {}) {
    state.stats.gamesPlayed += 1;
    state.stats.totalScore += score;
    
    if (score > state.bestScore) state.bestScore = score;
    if (gameStats.maxHeight && gameStats.maxHeight > state.stats.maxHeight) {
      state.stats.maxHeight = gameStats.maxHeight;
    }
    if (gameStats.maxPerfectStreak && gameStats.maxPerfectStreak > state.stats.maxPerfectStreak) {
      state.stats.maxPerfectStreak = gameStats.maxPerfectStreak;
    }
    if (gameStats.heistsCompleted) {
      state.stats.heistsCompleted += gameStats.heistsCompleted;
    }
    if (gameStats.bombsRemoved) {
      state.stats.bombsRemoved += gameStats.bombsRemoved;
    }
    if (gameStats.ghostBlocksStacked) {
      state.stats.ghostBlocksStacked += gameStats.ghostBlocksStacked;
    }
    
    const coinsEarned = Math.floor(score / 100);
    if (coinsEarned > 0) {
      state.coins += coinsEarned;
      state.stats.totalCoins += coinsEarned;
    }
    
    const list = [...state.leaderboard, { score, date: Date.now() }]
      .sort((a,b) => b.score - a.score)
      .slice(0,10);
    state.leaderboard = list;
    
    state.lastPlayDate = Date.now();
    saveData(state);
    listeners.forEach(fn => fn(state));
    return coinsEarned;
  },

  setVolume(v) {
    state.volume = Math.max(0, Math.min(1, v));
    saveData(state);
    listeners.forEach(fn => fn(state));
  },

  setMuted(m) {
    state.muted = !!m;
    saveData(state);
    listeners.forEach(fn => fn(state));
  },

  reset() {
    state = {...defaultSave};
    saveData(state);
    listeners.forEach(fn => fn(state));
  }
};
