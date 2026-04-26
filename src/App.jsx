import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play, Pause, Plus, X, Trash2, Edit2, Settings as SettingsIcon,
  Users, BarChart3, Activity, RotateCcw, ArrowLeftRight, Award,
  AlertTriangle, ChevronDown, Square, Save, Goal as GoalIcon,
  Clock, Hash, Check
} from 'lucide-react';

// ===================================================================
// CONSTANTS
// ===================================================================

const STORAGE_KEYS = {
  settings: 'app:settings',
  roster: 'app:roster',
  game: 'app:currentGame',
};

const DEFAULT_SETTINGS = {
  homeTeam: 'Mitt lag',
  awayTeam: 'Motståndare',
};

const ROLES = {
  MV: { label: 'Målvakt', short: 'MV', tint: '#e1a800' },
  B:  { label: 'Back',    short: 'B',  tint: '#3b82f6' },
  M:  { label: 'Mittfält',short: 'M',  tint: '#10b981' },
  F:  { label: 'Forward', short: 'F',  tint: '#d8501a' },
};

const CARD_TYPES = [
  { value: 'yellow', label: 'Gult kort', color: '#eab308' },
  { value: 'red',    label: 'Rött kort', color: '#dc2626' },
];

// All formations have positions with { x, y, role } where x∈[0,1] left→right and y∈[0,1] own goal→opponent goal
const FORMATS = {
  '3v3': {
    label: '3 mot 3',
    playerCount: 3,
    halfMinutes: 15,
    formations: [
      { name: 'Triangel', positions: [
        { role: 'B', x: 0.50, y: 0.20 },
        { role: 'F', x: 0.30, y: 0.65 },
        { role: 'F', x: 0.70, y: 0.65 },
      ]},
      { name: '1-2 (med MV)', positions: [
        { role: 'MV', x: 0.50, y: 0.08 },
        { role: 'F',  x: 0.30, y: 0.55 },
        { role: 'F',  x: 0.70, y: 0.55 },
      ]},
      { name: 'Linje', positions: [
        { role: 'M', x: 0.20, y: 0.50 },
        { role: 'M', x: 0.50, y: 0.50 },
        { role: 'M', x: 0.80, y: 0.50 },
      ]},
    ],
  },
  '5v5': {
    label: '5 mot 5',
    playerCount: 5,
    halfMinutes: 20,
    formations: [
      { name: '2-2', positions: [
        { role: 'MV', x: 0.50, y: 0.08 },
        { role: 'B',  x: 0.30, y: 0.32 },
        { role: 'B',  x: 0.70, y: 0.32 },
        { role: 'F',  x: 0.30, y: 0.72 },
        { role: 'F',  x: 0.70, y: 0.72 },
      ]},
      { name: '1-2-1 (diamant)', positions: [
        { role: 'MV', x: 0.50, y: 0.08 },
        { role: 'B',  x: 0.50, y: 0.30 },
        { role: 'M',  x: 0.22, y: 0.55 },
        { role: 'M',  x: 0.78, y: 0.55 },
        { role: 'F',  x: 0.50, y: 0.82 },
      ]},
      { name: '1-1-2', positions: [
        { role: 'MV', x: 0.50, y: 0.08 },
        { role: 'B',  x: 0.50, y: 0.30 },
        { role: 'M',  x: 0.50, y: 0.55 },
        { role: 'F',  x: 0.30, y: 0.80 },
        { role: 'F',  x: 0.70, y: 0.80 },
      ]},
      { name: '2-1-1', positions: [
        { role: 'MV', x: 0.50, y: 0.08 },
        { role: 'B',  x: 0.30, y: 0.30 },
        { role: 'B',  x: 0.70, y: 0.30 },
        { role: 'M',  x: 0.50, y: 0.58 },
        { role: 'F',  x: 0.50, y: 0.82 },
      ]},
    ],
  },
  '7v7': {
    label: '7 mot 7',
    playerCount: 7,
    halfMinutes: 25,
    formations: [
      { name: '2-3-1', positions: [
        { role: 'MV', x: 0.50, y: 0.07 },
        { role: 'B',  x: 0.30, y: 0.25 },
        { role: 'B',  x: 0.70, y: 0.25 },
        { role: 'M',  x: 0.18, y: 0.50 },
        { role: 'M',  x: 0.50, y: 0.50 },
        { role: 'M',  x: 0.82, y: 0.50 },
        { role: 'F',  x: 0.50, y: 0.82 },
      ]},
      { name: '3-2-1', positions: [
        { role: 'MV', x: 0.50, y: 0.07 },
        { role: 'B',  x: 0.18, y: 0.27 },
        { role: 'B',  x: 0.50, y: 0.25 },
        { role: 'B',  x: 0.82, y: 0.27 },
        { role: 'M',  x: 0.32, y: 0.55 },
        { role: 'M',  x: 0.68, y: 0.55 },
        { role: 'F',  x: 0.50, y: 0.82 },
      ]},
      { name: '2-1-3', positions: [
        { role: 'MV', x: 0.50, y: 0.07 },
        { role: 'B',  x: 0.30, y: 0.27 },
        { role: 'B',  x: 0.70, y: 0.27 },
        { role: 'M',  x: 0.50, y: 0.50 },
        { role: 'F',  x: 0.20, y: 0.78 },
        { role: 'F',  x: 0.50, y: 0.82 },
        { role: 'F',  x: 0.80, y: 0.78 },
      ]},
      { name: '3-3', positions: [
        { role: 'MV', x: 0.50, y: 0.07 },
        { role: 'B',  x: 0.20, y: 0.30 },
        { role: 'B',  x: 0.50, y: 0.30 },
        { role: 'B',  x: 0.80, y: 0.30 },
        { role: 'F',  x: 0.20, y: 0.72 },
        { role: 'F',  x: 0.50, y: 0.74 },
        { role: 'F',  x: 0.80, y: 0.72 },
      ]},
    ],
  },
  '9v9': {
    label: '9 mot 9',
    playerCount: 9,
    halfMinutes: 30,
    formations: [
      { name: '3-3-2', positions: [
        { role: 'MV', x: 0.50, y: 0.06 },
        { role: 'B',  x: 0.20, y: 0.25 },
        { role: 'B',  x: 0.50, y: 0.23 },
        { role: 'B',  x: 0.80, y: 0.25 },
        { role: 'M',  x: 0.20, y: 0.50 },
        { role: 'M',  x: 0.50, y: 0.50 },
        { role: 'M',  x: 0.80, y: 0.50 },
        { role: 'F',  x: 0.35, y: 0.78 },
        { role: 'F',  x: 0.65, y: 0.78 },
      ]},
      { name: '3-2-3', positions: [
        { role: 'MV', x: 0.50, y: 0.06 },
        { role: 'B',  x: 0.20, y: 0.25 },
        { role: 'B',  x: 0.50, y: 0.23 },
        { role: 'B',  x: 0.80, y: 0.25 },
        { role: 'M',  x: 0.35, y: 0.50 },
        { role: 'M',  x: 0.65, y: 0.50 },
        { role: 'F',  x: 0.20, y: 0.78 },
        { role: 'F',  x: 0.50, y: 0.82 },
        { role: 'F',  x: 0.80, y: 0.78 },
      ]},
      { name: '3-4-1', positions: [
        { role: 'MV', x: 0.50, y: 0.06 },
        { role: 'B',  x: 0.20, y: 0.25 },
        { role: 'B',  x: 0.50, y: 0.23 },
        { role: 'B',  x: 0.80, y: 0.25 },
        { role: 'M',  x: 0.16, y: 0.52 },
        { role: 'M',  x: 0.40, y: 0.50 },
        { role: 'M',  x: 0.60, y: 0.50 },
        { role: 'M',  x: 0.84, y: 0.52 },
        { role: 'F',  x: 0.50, y: 0.82 },
      ]},
    ],
  },
  '11v11': {
    label: '11 mot 11',
    playerCount: 11,
    halfMinutes: 45,
    formations: [
      { name: '4-4-2', positions: [
        { role: 'MV', x: 0.50, y: 0.05 },
        { role: 'B',  x: 0.18, y: 0.22 },
        { role: 'B',  x: 0.40, y: 0.20 },
        { role: 'B',  x: 0.60, y: 0.20 },
        { role: 'B',  x: 0.82, y: 0.22 },
        { role: 'M',  x: 0.18, y: 0.48 },
        { role: 'M',  x: 0.40, y: 0.50 },
        { role: 'M',  x: 0.60, y: 0.50 },
        { role: 'M',  x: 0.82, y: 0.48 },
        { role: 'F',  x: 0.38, y: 0.78 },
        { role: 'F',  x: 0.62, y: 0.78 },
      ]},
      { name: '4-3-3', positions: [
        { role: 'MV', x: 0.50, y: 0.05 },
        { role: 'B',  x: 0.18, y: 0.22 },
        { role: 'B',  x: 0.40, y: 0.20 },
        { role: 'B',  x: 0.60, y: 0.20 },
        { role: 'B',  x: 0.82, y: 0.22 },
        { role: 'M',  x: 0.30, y: 0.48 },
        { role: 'M',  x: 0.50, y: 0.50 },
        { role: 'M',  x: 0.70, y: 0.48 },
        { role: 'F',  x: 0.20, y: 0.78 },
        { role: 'F',  x: 0.50, y: 0.82 },
        { role: 'F',  x: 0.80, y: 0.78 },
      ]},
      { name: '4-2-3-1', positions: [
        { role: 'MV', x: 0.50, y: 0.05 },
        { role: 'B',  x: 0.18, y: 0.22 },
        { role: 'B',  x: 0.40, y: 0.20 },
        { role: 'B',  x: 0.60, y: 0.20 },
        { role: 'B',  x: 0.82, y: 0.22 },
        { role: 'M',  x: 0.38, y: 0.40 },
        { role: 'M',  x: 0.62, y: 0.40 },
        { role: 'M',  x: 0.20, y: 0.65 },
        { role: 'M',  x: 0.50, y: 0.62 },
        { role: 'M',  x: 0.80, y: 0.65 },
        { role: 'F',  x: 0.50, y: 0.85 },
      ]},
      { name: '3-5-2', positions: [
        { role: 'MV', x: 0.50, y: 0.05 },
        { role: 'B',  x: 0.25, y: 0.22 },
        { role: 'B',  x: 0.50, y: 0.20 },
        { role: 'B',  x: 0.75, y: 0.22 },
        { role: 'M',  x: 0.10, y: 0.50 },
        { role: 'M',  x: 0.32, y: 0.50 },
        { role: 'M',  x: 0.50, y: 0.50 },
        { role: 'M',  x: 0.68, y: 0.50 },
        { role: 'M',  x: 0.90, y: 0.50 },
        { role: 'F',  x: 0.38, y: 0.80 },
        { role: 'F',  x: 0.62, y: 0.80 },
      ]},
    ],
  },
};

// ===================================================================
// HELPERS
// ===================================================================

const uid = () => Math.random().toString(36).slice(2, 10);

const formatClock = (seconds) => {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatMin = (seconds) => `${Math.floor((seconds || 0) / 60)}'`;

const initials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
};

function makeNewGame(format, roster = []) {
  const def = FORMATS[format];
  const sorted = [...roster].sort((a, b) => Number(a.number || 0) - Number(b.number || 0));
  const lineup = Array(def.playerCount).fill(null);
  for (let i = 0; i < Math.min(def.playerCount, sorted.length); i++) {
    lineup[i] = sorted[i].id;
  }
  const bench = sorted.slice(def.playerCount).map(p => p.id);
  return {
    format,
    formationName: def.formations[0].name,
    lineup,
    bench,
    homeScore: 0,
    awayScore: 0,
    half: 1,
    halfMinutes: def.halfMinutes,
    clockSeconds: 0,
    clockRunning: false,
    events: [],
    playingTime: {},
    startedAt: Date.now(),
  };
}

function getFormation(format, name) {
  const def = FORMATS[format];
  return def.formations.find(f => f.name === name) || def.formations[0];
}

// ===================================================================
// MAIN COMPONENT
// ===================================================================

export default function FootballCoachApp() {
  const [view, setView] = useState('match');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [roster, setRoster] = useState([]);
  const [game, setGame] = useState(() => makeNewGame('7v7', []));
  const [loaded, setLoaded] = useState(false);

  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [formatPickerOpen, setFormatPickerOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(null); // 'home' | 'away'
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // ----- Fonts -----
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch (e) {} };
  }, []);

  // ----- Load -----
  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined' || !window.storage) { setLoaded(true); return; }
      try {
        const s = await window.storage.get(STORAGE_KEYS.settings).catch(() => null);
        if (s?.value) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s.value) });
      } catch (e) {}
      let loadedRoster = [];
      try {
        const r = await window.storage.get(STORAGE_KEYS.roster).catch(() => null);
        if (r?.value) { loadedRoster = JSON.parse(r.value); setRoster(loadedRoster); }
      } catch (e) {}
      try {
        const g = await window.storage.get(STORAGE_KEYS.game).catch(() => null);
        if (g?.value) {
          const loaded = JSON.parse(g.value);
          setGame({ ...loaded, clockRunning: false });
        } else if (loadedRoster.length) {
          setGame(makeNewGame('7v7', loadedRoster));
        }
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  // ----- Save -----
  useEffect(() => {
    if (!loaded || !window.storage) return;
    window.storage.set(STORAGE_KEYS.settings, JSON.stringify(settings)).catch(() => {});
  }, [settings, loaded]);
  useEffect(() => {
    if (!loaded || !window.storage) return;
    window.storage.set(STORAGE_KEYS.roster, JSON.stringify(roster)).catch(() => {});
  }, [roster, loaded]);
  useEffect(() => {
    if (!loaded || !window.storage) return;
    // Save snapshot but freeze clock to avoid odd resume state
    window.storage.set(STORAGE_KEYS.game, JSON.stringify({ ...game, clockRunning: false })).catch(() => {});
  }, [game.events, game.lineup, game.bench, game.homeScore, game.awayScore, game.half, game.format, game.formationName, loaded]);

  // ----- Clock tick -----
  useEffect(() => {
    if (!game.clockRunning) return;
    const interval = setInterval(() => {
      setGame(g => {
        const newPT = { ...g.playingTime };
        g.lineup.forEach(pid => {
          if (pid) newPT[pid] = (newPT[pid] || 0) + 1;
        });
        return { ...g, clockSeconds: g.clockSeconds + 1, playingTime: newPT };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [game.clockRunning]);

  // ----- Sync roster ↔ game (auto-add new roster players to bench, remove deleted) -----
  useEffect(() => {
    if (!loaded) return;
    const rosterIds = new Set(roster.map(p => p.id));
    const inLineup = new Set(game.lineup.filter(Boolean));
    const inBench = new Set(game.bench);
    // Add new roster players to bench
    const additions = roster.filter(p => !inLineup.has(p.id) && !inBench.has(p.id)).map(p => p.id);
    // Remove deleted players
    const newLineup = game.lineup.map(pid => (pid && !rosterIds.has(pid)) ? null : pid);
    const newBench = [...game.bench.filter(pid => rosterIds.has(pid)), ...additions];
    if (additions.length || newLineup.some((p, i) => p !== game.lineup[i]) || newBench.length !== game.bench.length) {
      setGame(g => ({ ...g, lineup: newLineup, bench: newBench }));
    }
  }, [roster, loaded]);

  // ============== ACTIONS ==============

  const toggleClock = () => setGame(g => ({ ...g, clockRunning: !g.clockRunning }));

  const adjustClock = (delta) => setGame(g => ({
    ...g, clockSeconds: Math.max(0, g.clockSeconds + delta),
  }));

  const goNextHalf = () => setGame(g => ({
    ...g, half: g.half + 1, clockSeconds: 0, clockRunning: false,
  }));

  const setFormat = (newFormat) => {
    const def = FORMATS[newFormat];
    setGame(g => {
      // Preserve current players: keep field players in lineup, push to bench if too many
      const allInPlay = [...g.lineup.filter(Boolean), ...g.bench];
      const newLineup = Array(def.playerCount).fill(null);
      for (let i = 0; i < Math.min(def.playerCount, allInPlay.length); i++) {
        newLineup[i] = allInPlay[i];
      }
      const newBench = allInPlay.slice(def.playerCount);
      return {
        ...g,
        format: newFormat,
        formationName: def.formations[0].name,
        halfMinutes: def.halfMinutes,
        lineup: newLineup,
        bench: newBench,
      };
    });
    setSelectedPlayerId(null);
  };

  const setFormation = (formationName) => {
    setGame(g => ({ ...g, formationName }));
    setSelectedPlayerId(null);
  };

  const tapPlayer = (playerId) => {
    if (!selectedPlayerId) {
      setSelectedPlayerId(playerId);
      return;
    }
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
      return;
    }
    swapPlayers(selectedPlayerId, playerId);
    setSelectedPlayerId(null);
  };

  const tapEmptyPosition = (positionIndex) => {
    if (!selectedPlayerId) return;
    setGame(g => {
      const newLineup = [...g.lineup];
      const newBench = [...g.bench];
      // Remove from lineup if there
      const fromLineupIdx = newLineup.indexOf(selectedPlayerId);
      if (fromLineupIdx !== -1) {
        newLineup[fromLineupIdx] = null;
      } else {
        const benchIdx = newBench.indexOf(selectedPlayerId);
        if (benchIdx !== -1) newBench.splice(benchIdx, 1);
      }
      newLineup[positionIndex] = selectedPlayerId;
      return { ...g, lineup: newLineup, bench: newBench };
    });
    setSelectedPlayerId(null);
  };

  const swapPlayers = (id1, id2) => {
    setGame(g => {
      const newLineup = [...g.lineup];
      const newBench = [...g.bench];
      const i1 = newLineup.indexOf(id1);
      const i2 = newLineup.indexOf(id2);
      const onField1 = i1 !== -1, onField2 = i2 !== -1;

      if (onField1 && onField2) {
        // both on field — swap positions
        newLineup[i1] = id2;
        newLineup[i2] = id1;
        return { ...g, lineup: newLineup, bench: newBench };
      }
      if (!onField1 && !onField2) {
        // both on bench — no-op
        return g;
      }
      // one on field, one on bench → substitution
      const fieldId = onField1 ? id1 : id2;
      const benchId = onField1 ? id2 : id1;
      const fieldPos = onField1 ? i1 : i2;
      newLineup[fieldPos] = benchId;
      const benchIdx = newBench.indexOf(benchId);
      if (benchIdx !== -1) newBench.splice(benchIdx, 1);
      newBench.push(fieldId);
      const newEvent = {
        id: uid(), type: 'sub', time: g.clockSeconds, half: g.half,
        outId: fieldId, inId: benchId, ts: Date.now(),
      };
      return { ...g, lineup: newLineup, bench: newBench, events: [newEvent, ...g.events] };
    });
  };

  const removeFromField = (positionIndex) => {
    setGame(g => {
      const playerId = g.lineup[positionIndex];
      if (!playerId) return g;
      const newLineup = [...g.lineup];
      newLineup[positionIndex] = null;
      const newBench = [...g.bench, playerId];
      return { ...g, lineup: newLineup, bench: newBench };
    });
    setSelectedPlayerId(null);
  };

  const recordGoal = (team, scorerId, assistId) => {
    setGame(g => ({
      ...g,
      [team === 'home' ? 'homeScore' : 'awayScore']: g[team === 'home' ? 'homeScore' : 'awayScore'] + 1,
      events: [{
        id: uid(), type: 'goal', team, scorerId, assistId,
        time: g.clockSeconds, half: g.half, ts: Date.now(),
      }, ...g.events],
    }));
    setGoalModalOpen(null);
  };

  const recordCard = (playerId, cardType) => {
    setGame(g => ({
      ...g,
      events: [{
        id: uid(), type: 'card', playerId, cardType,
        time: g.clockSeconds, half: g.half, ts: Date.now(),
      }, ...g.events],
    }));
    setCardModalOpen(false);
  };

  const undoLastEvent = () => {
    setGame(g => {
      if (g.events.length === 0) return g;
      const [latest, ...rest] = g.events;
      const updates = { ...g, events: rest };
      if (latest.type === 'goal') {
        updates[latest.team === 'home' ? 'homeScore' : 'awayScore'] = Math.max(
          0, g[latest.team === 'home' ? 'homeScore' : 'awayScore'] - 1
        );
      }
      // Note: 'sub' events are not auto-reversed (would be confusing — players have moved)
      return updates;
    });
  };

  const startNewMatch = () => {
    setGame(makeNewGame(game.format, roster));
    setConfirmReset(false);
    setSelectedPlayerId(null);
  };

  // Roster ops
  const addPlayer = (player) => setRoster(r => [...r, { id: uid(), ...player }]);
  const updatePlayer = (id, updates) => setRoster(r => r.map(p => p.id === id ? { ...p, ...updates } : p));
  const removePlayer = (id) => setRoster(r => r.filter(p => p.id !== id));

  // Player lookup
  const playerById = useMemo(() => {
    const m = new Map();
    roster.forEach(p => m.set(p.id, p));
    return m;
  }, [roster]);

  // Stats — goals/assists/cards per player
  const playerStats = useMemo(() => {
    const s = {};
    roster.forEach(p => { s[p.id] = { goals: 0, assists: 0, yellow: 0, red: 0 }; });
    game.events.forEach(e => {
      if (e.type === 'goal' && e.team === 'home') {
        if (e.scorerId && s[e.scorerId]) s[e.scorerId].goals++;
        if (e.assistId && s[e.assistId]) s[e.assistId].assists++;
      }
      if (e.type === 'card' && e.playerId && s[e.playerId]) {
        if (e.cardType === 'yellow') s[e.playerId].yellow++;
        if (e.cardType === 'red') s[e.playerId].red++;
      }
    });
    return s;
  }, [game.events, roster]);

  // ============== RENDER ==============

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4ede0', color: '#1a1814', fontFamily: 'system-ui' }}>
        <div className="text-sm opacity-60">Laddar…</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        background: '#f4ede0',
        color: '#1a1814',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <style>{`
        :root {
          --bg: #f4ede0;
          --surface: #fbf6eb;
          --ink: #1a1814;
          --ink-muted: #6b6357;
          --ink-faint: #a39c8d;
          --border: #e3d8c1;
          --border-strong: #c9bda0;
          --pitch-green: #2e6e3f;
          --pitch-green-dark: #245a32;
          --pitch-line: rgba(255,255,255,0.55);
          --accent: #d8501a;
          --accent-soft: rgba(216, 80, 26, 0.12);
          --accent-strong: #b13d10;
          --warn: #c97c0b;
        }
        html, body { background: var(--bg); }
        .display { font-family: 'Bricolage Grotesque', sans-serif; letter-spacing: -0.01em; }
        .tabular { font-variant-numeric: tabular-nums; }
        button { transition: transform 60ms ease, background-color 120ms ease, border-color 120ms ease, opacity 120ms; touch-action: manipulation; }
        button:active:not(:disabled) { transform: scale(0.97); }
        @keyframes spin-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(216, 80, 26, 0.6); }
          50% { box-shadow: 0 0 0 6px rgba(216, 80, 26, 0); }
        }
        .selected-ring { animation: spin-pulse 1.4s ease-in-out infinite; }
        .scrollbar-thin::-webkit-scrollbar { width: 5px; height: 5px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }
      `}</style>

      <div className="max-w-md mx-auto">
        {view === 'match' && (
          <MatchView
            settings={settings}
            game={game}
            roster={roster}
            playerById={playerById}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={tapPlayer}
            onTapEmpty={tapEmptyPosition}
            onRemoveFromField={removeFromField}
            onToggleClock={toggleClock}
            onAdjustClock={adjustClock}
            onNextHalf={goNextHalf}
            onOpenFormatPicker={() => setFormatPickerOpen(true)}
            onOpenGoal={(t) => setGoalModalOpen(t)}
            onOpenCard={() => setCardModalOpen(true)}
            onUndo={undoLastEvent}
            onAskReset={() => setConfirmReset(true)}
          />
        )}
        {view === 'time' && (
          <TimeView game={game} roster={roster} playerById={playerById} />
        )}
        {view === 'stats' && (
          <StatsView game={game} roster={roster} settings={settings} playerStats={playerStats} playerById={playerById} />
        )}
        {view === 'roster' && (
          <RosterView roster={roster} onAdd={addPlayer} onUpdate={updatePlayer} onRemove={removePlayer} />
        )}
        {view === 'settings' && (
          <SettingsView settings={settings} onChange={setSettings} onAskReset={() => setConfirmReset(true)} />
        )}
      </div>

      <BottomNav view={view} setView={setView} />

      {formatPickerOpen && (
        <FormatPickerModal
          format={game.format}
          formationName={game.formationName}
          onSetFormat={setFormat}
          onSetFormation={setFormation}
          onClose={() => setFormatPickerOpen(false)}
        />
      )}
      {goalModalOpen && (
        <GoalModal
          team={goalModalOpen}
          settings={settings}
          game={game}
          playerById={playerById}
          onClose={() => setGoalModalOpen(null)}
          onSave={(scorerId, assistId) => recordGoal(goalModalOpen, scorerId, assistId)}
        />
      )}
      {cardModalOpen && (
        <CardModal
          game={game}
          roster={roster}
          onClose={() => setCardModalOpen(false)}
          onSave={recordCard}
        />
      )}
      {confirmReset && (
        <ConfirmModal
          title="Ny match?"
          message="Allt utom truppen återställs (klocka, mål, speltid, byten)."
          confirmLabel="Ja, ny match"
          onConfirm={startNewMatch}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

// ===================================================================
// MATCH VIEW (the main screen)
// ===================================================================

function MatchView({
  settings, game, roster, playerById, selectedPlayerId,
  onSelectPlayer, onTapEmpty, onRemoveFromField,
  onToggleClock, onAdjustClock, onNextHalf,
  onOpenFormatPicker, onOpenGoal, onOpenCard, onUndo, onAskReset,
}) {
  const formatDef = FORMATS[game.format];
  const formation = getFormation(game.format, game.formationName);
  const halfTotal = game.halfMinutes * 60;
  const overtime = game.clockSeconds > halfTotal;
  const lastEvent = game.events[0];

  return (
    <div className="px-4 pt-5">
      {/* Top bar: format + halftime status + actions */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onOpenFormatPicker}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--ink)' }}
        >
          <span>{formatDef.label}</span>
          <span className="opacity-50">·</span>
          <span>{game.formationName}</span>
          <ChevronDown size={12} className="opacity-60" />
        </button>
        <div className="flex-1" />
        <button
          onClick={onUndo}
          disabled={game.events.length === 0}
          className="p-2 rounded-lg disabled:opacity-30"
          style={{ color: 'var(--ink-muted)' }}
          aria-label="Ångra"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Score + clock card */}
      <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between gap-3">
          {/* Home */}
          <div className="flex-1 min-w-0 text-center">
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>
              {settings.homeTeam}
            </div>
            <div className="display tabular text-5xl font-bold" style={{ color: 'var(--ink)' }}>{game.homeScore}</div>
          </div>

          {/* Clock center */}
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-widest mb-1 display font-bold" style={{ color: overtime ? 'var(--accent)' : 'var(--ink-muted)' }}>
              Halvlek {game.half}
            </div>
            <div className={`display tabular text-2xl font-bold ${game.clockRunning ? '' : 'opacity-70'}`} style={{ color: overtime ? 'var(--accent)' : 'var(--ink)' }}>
              {formatClock(game.clockSeconds)}
            </div>
            <div className="text-[9px] mt-0.5 tabular" style={{ color: 'var(--ink-faint)' }}>
              / {game.halfMinutes}:00
            </div>
          </div>

          {/* Away */}
          <div className="flex-1 min-w-0 text-center">
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>
              {settings.awayTeam}
            </div>
            <div className="display tabular text-5xl font-bold" style={{ color: 'var(--ink)' }}>{game.awayScore}</div>
          </div>
        </div>

        {/* Clock controls row */}
        <div className="grid grid-cols-5 gap-1.5 mt-3">
          <button
            onClick={() => onAdjustClock(-30)}
            className="py-2 rounded-lg text-[11px] font-semibold tabular"
            style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--ink-muted)' }}
          >
            −30s
          </button>
          <button
            onClick={onToggleClock}
            className="col-span-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
            style={{
              background: game.clockRunning ? 'var(--ink)' : 'var(--accent)',
              color: game.clockRunning ? 'var(--bg)' : 'white',
            }}
          >
            {game.clockRunning ? <><Pause size={14} /> Paus</> : <><Play size={14} /> Start</>}
          </button>
          <button
            onClick={() => onAdjustClock(30)}
            className="py-2 rounded-lg text-[11px] font-semibold tabular"
            style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--ink-muted)' }}
          >
            +30s
          </button>
        </div>
        <button
          onClick={onNextHalf}
          className="w-full mt-1.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider"
          style={{ background: 'transparent', border: '1px dashed var(--border-strong)', color: 'var(--ink-muted)' }}
        >
          Nästa halvlek →
        </button>
      </div>

      {/* The pitch */}
      <Pitch
        formation={formation}
        lineup={game.lineup}
        playerById={playerById}
        playingTime={game.playingTime}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={onSelectPlayer}
        onTapEmpty={onTapEmpty}
      />

      {/* Bench */}
      <Bench
        bench={game.bench}
        playerById={playerById}
        playingTime={game.playingTime}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={onSelectPlayer}
        rosterCount={roster.length}
      />

      {/* Selection hint */}
      {selectedPlayerId && (
        <div className="rounded-xl px-3 py-2 mb-3 text-xs flex items-center gap-2"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)', border: '1px solid rgba(216,80,26,0.25)' }}>
          <ArrowLeftRight size={14} />
          <span>
            <strong>{playerById.get(selectedPlayerId)?.name || 'Spelare'}</strong> vald — knacka annan spelare för byte
          </span>
          <button onClick={() => onSelectPlayer(selectedPlayerId)} className="ml-auto opacity-70">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2 mt-1">
        <ActionBtn onClick={() => onOpenGoal('home')} icon={<GoalIcon size={14} />} label="Mål oss" tone="accent" />
        <ActionBtn onClick={() => onOpenGoal('away')} icon={<GoalIcon size={14} />} label="Mål dem" tone="muted" />
        <ActionBtn onClick={onOpenCard} icon={<Square size={12} fill="currentColor" />} label="Kort" tone="warn" />
      </div>

      {/* Recent events */}
      {game.events.length > 0 && (
        <div className="mt-5 mb-2">
          <div className="text-[10px] uppercase tracking-[0.2em] mb-2 px-1" style={{ color: 'var(--ink-faint)' }}>
            Senaste händelser
          </div>
          <div className="space-y-1.5">
            {game.events.slice(0, 5).map(e => (
              <EventRow key={e.id} event={e} playerById={playerById} settings={settings} />
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onAskReset}
          className="text-xs underline"
          style={{ color: 'var(--ink-faint)' }}
        >
          Ny match
        </button>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, icon, label, tone }) {
  const tones = {
    accent: { bg: 'var(--accent)', color: 'white', border: 'var(--accent)' },
    muted: { bg: 'transparent', color: 'var(--ink)', border: 'var(--border-strong)' },
    warn: { bg: 'transparent', color: 'var(--warn)', border: 'rgba(201, 124, 11, 0.4)' },
  }[tone];
  return (
    <button
      onClick={onClick}
      className="py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
      style={{ background: tones.bg, color: tones.color, border: `1px solid ${tones.border}` }}
    >
      {icon}
      {label}
    </button>
  );
}

// ===================================================================
// PITCH
// ===================================================================

function Pitch({ formation, lineup, playerById, playingTime, selectedPlayerId, onSelectPlayer, onTapEmpty }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden mb-3 select-none"
      style={{
        aspectRatio: '0.75 / 1',
        background: 'linear-gradient(180deg, var(--pitch-green) 0%, var(--pitch-green-dark) 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25), 0 8px 24px -16px rgba(46, 110, 63, 0.6)',
      }}
    >
      {/* Pitch markings */}
      <PitchMarkings />

      {/* Subtle grass stripes */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(180deg, transparent 0, transparent 11.1%, rgba(255,255,255,0.025) 11.1%, rgba(255,255,255,0.025) 22.2%)',
      }} />

      {/* Players */}
      {formation.positions.map((pos, i) => {
        const playerId = lineup[i];
        const player = playerId ? playerById.get(playerId) : null;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {player ? (
              <PitchChip
                player={player}
                role={pos.role}
                seconds={playingTime[player.id] || 0}
                selected={selectedPlayerId === player.id}
                onTap={() => onSelectPlayer(player.id)}
              />
            ) : (
              <EmptySlot
                role={pos.role}
                onTap={() => onTapEmpty(i)}
                canPlace={!!selectedPlayerId}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PitchMarkings() {
  return (
    <svg viewBox="0 0 100 133" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
      <g fill="none" stroke="var(--pitch-line)" strokeWidth="0.4">
        {/* Outer */}
        <rect x="2" y="2" width="96" height="129" />
        {/* Halfway line */}
        <line x1="2" y1="66.5" x2="98" y2="66.5" />
        {/* Center circle + spot */}
        <circle cx="50" cy="66.5" r="9" />
        <circle cx="50" cy="66.5" r="0.8" fill="var(--pitch-line)" />
        {/* Bottom (own) penalty area */}
        <rect x="22" y="113" width="56" height="18" />
        <rect x="36" y="125" width="28" height="6" />
        {/* Bottom penalty arc + spot */}
        <path d="M 41,113 A 9 9 0 0 0 59 113" />
        <circle cx="50" cy="121" r="0.8" fill="var(--pitch-line)" />
        {/* Top (opponent) penalty area */}
        <rect x="22" y="2" width="56" height="18" />
        <rect x="36" y="2" width="28" height="6" />
        <path d="M 41,20 A 9 9 0 0 1 59 20" />
        <circle cx="50" cy="12" r="0.8" fill="var(--pitch-line)" />
        {/* Corner arcs */}
        <path d="M 2,4 A 2 2 0 0 0 4 2" />
        <path d="M 96,2 A 2 2 0 0 0 98 4" />
        <path d="M 2,129 A 2 2 0 0 1 4 131" />
        <path d="M 98,129 A 2 2 0 0 1 96 131" />
      </g>
    </svg>
  );
}

function PitchChip({ player, role, seconds, selected, onTap }) {
  const tint = ROLES[role]?.tint || '#3b82f6';
  return (
    <button
      onClick={onTap}
      className={`relative flex flex-col items-center gap-0.5 ${selected ? 'selected-ring' : ''}`}
      style={{ outline: 'none' }}
    >
      <div
        className="rounded-full flex items-center justify-center display tabular font-bold leading-none"
        style={{
          width: 38, height: 38,
          background: 'white',
          color: 'var(--ink)',
          border: `2px solid ${selected ? 'var(--accent)' : tint}`,
          boxShadow: selected
            ? '0 4px 14px rgba(216, 80, 26, 0.45), 0 1px 2px rgba(0,0,0,0.2)'
            : '0 2px 6px rgba(0,0,0,0.25)',
          fontSize: 15,
        }}
      >
        {player.number || initials(player.name)}
      </div>
      <div
        className="px-1.5 py-px rounded text-[9px] font-bold tabular"
        style={{
          background: 'rgba(0,0,0,0.45)',
          color: 'white',
          backdropFilter: 'blur(4px)',
          minWidth: 26,
          textAlign: 'center',
        }}
      >
        {formatMin(seconds)}
      </div>
    </button>
  );
}

function EmptySlot({ role, onTap, canPlace }) {
  return (
    <button
      onClick={onTap}
      className="rounded-full flex items-center justify-center display text-[10px] font-bold tracking-widest"
      style={{
        width: 38, height: 38,
        background: canPlace ? 'rgba(216, 80, 26, 0.25)' : 'rgba(255,255,255,0.08)',
        color: canPlace ? 'white' : 'rgba(255,255,255,0.6)',
        border: `2px dashed ${canPlace ? 'rgba(216,80,26,0.9)' : 'rgba(255,255,255,0.4)'}`,
      }}
    >
      {role}
    </button>
  );
}

// ===================================================================
// BENCH
// ===================================================================

function Bench({ bench, playerById, playingTime, selectedPlayerId, onSelectPlayer, rosterCount }) {
  const sorted = useMemo(() => {
    return [...bench]
      .map(id => ({ id, time: playingTime[id] || 0, player: playerById.get(id) }))
      .filter(x => x.player)
      .sort((a, b) => a.time - b.time); // least played first
  }, [bench, playerById, playingTime]);

  if (rosterCount === 0) {
    return (
      <div className="rounded-xl p-4 mb-3 text-center text-xs"
        style={{ background: 'var(--surface)', border: '1px dashed var(--border-strong)', color: 'var(--ink-muted)' }}>
        Truppen är tom — lägg till spelare under "Trupp" först.
      </div>
    );
  }

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--ink-faint)' }}>
          Avbytarbänk
        </div>
        <div className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>
          {sorted.length} • sorterad efter speltid
        </div>
      </div>
      {sorted.length === 0 ? (
        <div className="rounded-xl p-3 text-center text-xs" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
          Inga avbytare
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin -mx-4 px-4" style={{ scrollSnapType: 'x mandatory' }}>
          {sorted.map(({ id, time, player }) => (
            <BenchChip
              key={id}
              player={player}
              seconds={time}
              selected={selectedPlayerId === id}
              onTap={() => onSelectPlayer(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BenchChip({ player, seconds, selected, onTap }) {
  return (
    <button
      onClick={onTap}
      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl shrink-0 ${selected ? 'selected-ring' : ''}`}
      style={{
        background: selected ? 'var(--accent-soft)' : 'var(--surface)',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        minWidth: 64,
        scrollSnapAlign: 'start',
      }}
    >
      <div
        className="rounded-full flex items-center justify-center display tabular font-bold"
        style={{
          width: 32, height: 32,
          background: selected ? 'var(--accent)' : 'var(--ink)',
          color: selected ? 'white' : 'var(--bg)',
          fontSize: 14,
        }}
      >
        {player.number || initials(player.name)}
      </div>
      <div className="text-[10px] font-semibold leading-tight max-w-[60px] truncate" style={{ color: 'var(--ink)' }}>
        {player.name.split(' ')[0]}
      </div>
      <div className="text-[9px] tabular font-bold" style={{ color: selected ? 'var(--accent-strong)' : 'var(--ink-muted)' }}>
        {formatMin(seconds)}
      </div>
    </button>
  );
}

// ===================================================================
// EVENT ROW
// ===================================================================

function EventRow({ event, playerById, settings }) {
  let icon, body;
  if (event.type === 'goal') {
    const isHome = event.team === 'home';
    icon = <GoalIcon size={13} style={{ color: isHome ? 'var(--accent)' : 'var(--ink-muted)' }} />;
    const scorer = playerById.get(event.scorerId);
    const assist = playerById.get(event.assistId);
    if (isHome && scorer) {
      body = <span><strong>Mål</strong> · #{scorer.number} {scorer.name}{assist ? <span style={{ color: 'var(--ink-faint)' }}> (ass: #{assist.number} {assist.name})</span> : ''}</span>;
    } else {
      body = <span><strong>Mål</strong> · {isHome ? settings.homeTeam : settings.awayTeam}</span>;
    }
  } else if (event.type === 'card') {
    const c = CARD_TYPES.find(c => c.value === event.cardType);
    icon = <Square size={11} fill={c?.color} style={{ color: c?.color }} />;
    const p = playerById.get(event.playerId);
    body = <span><strong>{c?.label}</strong>{p ? ` · #${p.number} ${p.name}` : ''}</span>;
  } else if (event.type === 'sub') {
    icon = <ArrowLeftRight size={13} style={{ color: 'var(--ink-muted)' }} />;
    const out = playerById.get(event.outId);
    const inP = playerById.get(event.inId);
    body = <span><strong>Byte</strong> · {out ? `#${out.number} ${out.name}` : '—'} ut, {inP ? `#${inP.number} ${inP.name}` : '—'} in</span>;
  }
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px]"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="display tabular text-[10px] font-bold tracking-wider w-12 shrink-0" style={{ color: 'var(--ink-faint)' }}>
        H{event.half} · {formatClock(event.time)}
      </div>
      <div className="shrink-0">{icon}</div>
      <div className="truncate flex-1" style={{ color: 'var(--ink)' }}>{body}</div>
    </div>
  );
}

// ===================================================================
// TIME VIEW
// ===================================================================

function TimeView({ game, roster, playerById }) {
  const onField = new Set(game.lineup.filter(Boolean));
  const playerData = useMemo(() => {
    return roster.map(p => ({
      ...p,
      seconds: game.playingTime[p.id] || 0,
      onField: onField.has(p.id),
    })).sort((a, b) => b.seconds - a.seconds);
  }, [roster, game.playingTime, game.lineup]);

  const totals = useMemo(() => {
    const list = playerData.map(p => p.seconds);
    if (list.length === 0) return { max: 0, min: 0, avg: 0 };
    return {
      max: Math.max(...list),
      min: Math.min(...list),
      avg: list.reduce((s, x) => s + x, 0) / list.length,
    };
  }, [playerData]);

  return (
    <div className="px-4 pt-5">
      <h1 className="display text-3xl font-bold mb-1">Speltid</h1>
      <div className="text-xs mb-4" style={{ color: 'var(--ink-muted)' }}>
        Hur mycket varje spelare har spelat i den här matchen
      </div>

      {playerData.length === 0 ? (
        <div className="rounded-xl p-6 text-center text-sm" style={{ background: 'var(--surface)', border: '1px dashed var(--border-strong)', color: 'var(--ink-muted)' }}>
          Lägg till spelare under "Trupp"
        </div>
      ) : (
        <div className="space-y-1.5">
          {playerData.map(p => {
            const pct = totals.max ? (p.seconds / totals.max) * 100 : 0;
            return (
              <div key={p.id}
                className="relative overflow-hidden rounded-xl p-3 flex items-center gap-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {/* Bar */}
                <div className="absolute inset-y-0 left-0 transition-all" style={{
                  width: `${pct}%`,
                  background: p.onField ? 'rgba(216, 80, 26, 0.10)' : 'rgba(0,0,0,0.04)',
                }} />
                <div className="relative flex items-center gap-3 flex-1 min-w-0">
                  <div className="display tabular font-bold w-7 text-center" style={{ color: 'var(--ink-muted)', fontSize: 14 }}>
                    #{p.number || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{p.name}</div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: p.onField ? 'var(--accent)' : 'var(--ink-faint)' }}>
                      {p.onField ? '● På plan' : 'Bänken'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="display tabular font-bold text-lg" style={{ color: 'var(--ink)' }}>
                      {formatMin(p.seconds)}
                    </div>
                    <div className="text-[9px] tabular" style={{ color: 'var(--ink-faint)' }}>
                      {Math.floor((p.seconds || 0) / 60)} min {String((p.seconds || 0) % 60).padStart(2, '0')}s
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {playerData.length > 1 && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Mest" value={formatMin(totals.max)} />
          <Stat label="Snitt" value={formatMin(totals.avg)} />
          <Stat label="Minst" value={formatMin(totals.min)} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--ink-faint)' }}>{label}</div>
      <div className="display tabular text-xl font-bold" style={{ color: 'var(--ink)' }}>{value}</div>
    </div>
  );
}

// ===================================================================
// STATS VIEW
// ===================================================================

function StatsView({ game, roster, settings, playerStats, playerById }) {
  const sortedPlayers = useMemo(() =>
    [...roster].sort((a, b) => {
      const sa = playerStats[a.id] || {}; const sb = playerStats[b.id] || {};
      return (sb.goals + sb.assists * 0.5) - (sa.goals + sa.assists * 0.5);
    }), [roster, playerStats]);

  const homeGoals = game.events.filter(e => e.type === 'goal' && e.team === 'home').length;
  const awayGoals = game.events.filter(e => e.type === 'goal' && e.team === 'away').length;
  const cards = game.events.filter(e => e.type === 'card').length;
  const subs = game.events.filter(e => e.type === 'sub').length;

  return (
    <div className="px-4 pt-5">
      <h1 className="display text-3xl font-bold mb-1">Statistik</h1>
      <div className="text-xs mb-4" style={{ color: 'var(--ink-muted)' }}>
        {settings.homeTeam} vs {settings.awayTeam}
      </div>

      {/* Score summary */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-around">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Hemma</div>
            <div className="display tabular text-5xl font-bold">{game.homeScore}</div>
          </div>
          <div className="text-center px-3" style={{ color: 'var(--ink-faint)' }}>
            <div className="text-xs">Halvlek {game.half}</div>
            <div className="display tabular text-sm font-bold mt-1">{formatClock(game.clockSeconds)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Borta</div>
            <div className="display tabular text-5xl font-bold">{game.awayScore}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <MiniStat label="Mål oss" value={homeGoals} />
          <MiniStat label="Kort" value={cards} />
          <MiniStat label="Byten" value={subs} />
        </div>
      </div>

      {/* Player stats */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3" style={{ color: 'var(--ink-faint)' }}>
          Spelarstatistik · {settings.homeTeam}
        </div>
        {roster.length === 0 ? (
          <div className="text-xs text-center py-4" style={{ color: 'var(--ink-muted)' }}>
            Lägg till spelare under "Trupp"
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 text-[10px] uppercase tracking-wider px-1 pb-2" style={{ color: 'var(--ink-faint)', borderBottom: '1px solid var(--border)' }}>
              <div className="col-span-7">Spelare</div>
              <div className="col-span-1 text-center">M</div>
              <div className="col-span-2 text-center">A</div>
              <div className="col-span-2 text-center">Kort</div>
            </div>
            {sortedPlayers.map(p => {
              const s = playerStats[p.id] || { goals: 0, assists: 0, yellow: 0, red: 0 };
              return (
                <div key={p.id} className="grid grid-cols-12 items-center py-2 px-1 text-sm" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="col-span-7 flex items-center gap-2 min-w-0">
                    <span className="display tabular font-bold w-6 text-center text-xs" style={{ color: 'var(--ink-faint)' }}>#{p.number || '?'}</span>
                    <span className="truncate font-medium">{p.name}</span>
                  </div>
                  <div className="col-span-1 text-center tabular font-bold">{s.goals || ''}</div>
                  <div className="col-span-2 text-center tabular">{s.assists || ''}</div>
                  <div className="col-span-2 text-center text-xs flex justify-center gap-1">
                    {s.yellow > 0 && <span style={{ color: '#a07300' }}>{s.yellow}🟨</span>}
                    {s.red > 0 && <span style={{ color: '#a01010' }}>{s.red}🟥</span>}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="text-center">
      <div className="display tabular text-2xl font-bold" style={{ color: 'var(--ink)' }}>{value}</div>
      <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--ink-faint)' }}>{label}</div>
    </div>
  );
}

// ===================================================================
// ROSTER VIEW
// ===================================================================

function RosterView({ roster, onAdd, onUpdate, onRemove }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const sorted = [...roster].sort((a, b) => Number(a.number || 0) - Number(b.number || 0));

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="display text-3xl font-bold">Trupp</h1>
          <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{roster.length} spelare</div>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <Plus size={16} /> Lägg till
        </button>
      </div>

      {roster.length === 0 && !adding && (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface)', border: '1px dashed var(--border-strong)' }}>
          <Users size={28} className="mx-auto mb-3" style={{ color: 'var(--ink-faint)' }} />
          <div className="text-sm font-semibold mb-1">Truppen är tom</div>
          <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Lägg till spelare för att kunna sätta laget och tracka speltid
          </div>
        </div>
      )}

      {adding && (
        <PlayerForm onCancel={() => setAdding(false)} onSave={(p) => { onAdd(p); setAdding(false); }} />
      )}

      <div className="space-y-2 mt-3">
        {sorted.map(p => (
          editingId === p.id ? (
            <PlayerForm
              key={p.id} initial={p}
              onCancel={() => setEditingId(null)}
              onSave={(updates) => { onUpdate(p.id, updates); setEditingId(null); }}
              onRemove={() => { onRemove(p.id); setEditingId(null); }}
            />
          ) : (
            <div key={p.id} className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="display tabular text-2xl font-bold w-12 text-center" style={{ color: 'var(--ink)' }}>
                {p.number ? `#${p.number}` : '–'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{p.name}</div>
                {p.preferredRole && (
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-faint)' }}>
                    Helst {ROLES[p.preferredRole]?.label}
                  </div>
                )}
              </div>
              <button onClick={() => setEditingId(p.id)} className="p-2" style={{ color: 'var(--ink-muted)' }} aria-label="Redigera">
                <Edit2 size={14} />
              </button>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function PlayerForm({ initial, onSave, onCancel, onRemove }) {
  const [number, setNumber] = useState(initial?.number || '');
  const [name, setName] = useState(initial?.name || '');
  const [preferredRole, setPreferredRole] = useState(initial?.preferredRole || '');
  const canSave = name.trim().length > 0;

  return (
    <div className="rounded-2xl p-4 mb-2" style={{ background: 'var(--surface)', border: '1.5px solid var(--accent)' }}>
      <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3" style={{ color: 'var(--accent)' }}>
        {initial ? 'Redigera spelare' : 'Ny spelare'}
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        <input
          type="text" inputMode="numeric" value={number}
          onChange={e => setNumber(e.target.value)}
          placeholder="#"
          className="col-span-1 px-3 py-2.5 rounded-lg display text-lg tabular text-center font-bold outline-none"
          style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}
        />
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Namn"
          className="col-span-3 px-3 py-2.5 rounded-lg outline-none"
          style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}
        />
      </div>
      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--ink-faint)' }}>Position (valfritt)</div>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {Object.entries(ROLES).map(([k, r]) => (
          <button
            key={k}
            onClick={() => setPreferredRole(preferredRole === k ? '' : k)}
            className="py-2 rounded-lg text-xs font-semibold"
            style={{
              background: preferredRole === k ? 'var(--ink)' : 'transparent',
              color: preferredRole === k ? 'var(--bg)' : 'var(--ink-muted)',
              border: `1px solid ${preferredRole === k ? 'var(--ink)' : 'var(--border-strong)'}`,
            }}
          >
            {r.short}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
          style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-muted)' }}>
          Avbryt
        </button>
        {onRemove && (
          <button onClick={onRemove} className="px-3 py-2.5 rounded-lg" style={{ border: '1px solid rgba(220, 38, 38, 0.4)', color: '#dc2626' }} aria-label="Ta bort">
            <Trash2 size={14} />
          </button>
        )}
        <button
          disabled={!canSave}
          onClick={() => onSave({ number, name: name.trim(), preferredRole })}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold disabled:opacity-30"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          Spara
        </button>
      </div>
    </div>
  );
}

// ===================================================================
// SETTINGS VIEW
// ===================================================================

function SettingsView({ settings, onChange, onAskReset }) {
  const set = (k, v) => onChange({ ...settings, [k]: v });
  return (
    <div className="px-4 pt-5">
      <h1 className="display text-3xl font-bold mb-5">Inställningar</h1>

      <div className="rounded-2xl p-4 mb-4 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-2" style={{ color: 'var(--ink-faint)' }}>Hemmalag</label>
          <input
            value={settings.homeTeam}
            onChange={e => set('homeTeam', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg outline-none"
            style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-2" style={{ color: 'var(--ink-faint)' }}>Bortalag</label>
          <input
            value={settings.awayTeam}
            onChange={e => set('awayTeam', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg outline-none"
            style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}
          />
        </div>
      </div>

      <button
        onClick={onAskReset}
        className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{ border: '1px solid rgba(220, 38, 38, 0.4)', color: '#b91c1c' }}
      >
        <RotateCcw size={14} /> Återställ pågående match
      </button>

      <div className="text-center text-[10px] mt-8 leading-relaxed" style={{ color: 'var(--ink-faint)' }}>
        Knatte Coach · v0.1<br/>
        Prototyp för iteration
      </div>
    </div>
  );
}

// ===================================================================
// BOTTOM NAV
// ===================================================================

function BottomNav({ view, setView }) {
  const items = [
    { id: 'match', icon: Activity, label: 'Match' },
    { id: 'time', icon: Clock, label: 'Speltid' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
    { id: 'roster', icon: Users, label: 'Trupp' },
    { id: 'settings', icon: SettingsIcon, label: 'Inst.' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      <div className="max-w-md mx-auto px-3 pb-3 pt-1">
        <div className="grid grid-cols-5 gap-0.5 rounded-2xl p-1.5"
          style={{
            background: 'rgba(251, 246, 235, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border)',
            boxShadow: '0 -8px 32px -16px rgba(26, 24, 20, 0.15)',
          }}>
          {items.map(it => {
            const Icon = it.icon;
            const active = view === it.id;
            return (
              <button
                key={it.id}
                onClick={() => setView(it.id)}
                className="flex flex-col items-center justify-center py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider gap-0.5"
                style={{
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--bg)' : 'var(--ink-muted)',
                }}
              >
                <Icon size={16} />
                {it.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// MODALS
// ===================================================================

function ModalShell({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(26, 24, 20, 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto scrollbar-thin"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="display text-xl font-bold">{title}</div>
          <button onClick={onClose} className="p-2 -mr-2" style={{ color: 'var(--ink-muted)' }} aria-label="Stäng">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormatPickerModal({ format, formationName, onSetFormat, onSetFormation, onClose }) {
  const def = FORMATS[format];
  return (
    <ModalShell title="Spelform & uppställning" onClose={onClose}>
      <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: 'var(--ink-faint)' }}>Spelform</div>
      <div className="grid grid-cols-5 gap-1.5 mb-5">
        {Object.entries(FORMATS).map(([k, f]) => (
          <button
            key={k}
            onClick={() => onSetFormat(k)}
            className="py-3 rounded-lg text-xs font-bold"
            style={{
              background: format === k ? 'var(--ink)' : 'transparent',
              color: format === k ? 'var(--bg)' : 'var(--ink)',
              border: `1px solid ${format === k ? 'var(--ink)' : 'var(--border-strong)'}`,
            }}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: 'var(--ink-faint)' }}>
        Uppställning ({def.label})
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {def.formations.map(f => (
          <button
            key={f.name}
            onClick={() => onSetFormation(f.name)}
            className="rounded-xl overflow-hidden text-left"
            style={{
              border: `1.5px solid ${formationName === f.name ? 'var(--accent)' : 'var(--border)'}`,
              background: formationName === f.name ? 'var(--accent-soft)' : 'white',
            }}
          >
            <div className="relative w-full" style={{ aspectRatio: '1 / 1.1', background: 'var(--pitch-green)' }}>
              <PitchMarkings />
              {f.positions.map((pos, i) => (
                <div key={i} className="absolute rounded-full"
                  style={{
                    width: 10, height: 10,
                    left: `${pos.x * 100}%`, top: `${pos.y * 100}%`,
                    background: 'white',
                    transform: 'translate(-50%, -50%)',
                    border: '1px solid rgba(0,0,0,0.2)',
                  }} />
              ))}
            </div>
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: 'var(--ink)' }}>{f.name}</span>
              {formationName === f.name && <Check size={14} style={{ color: 'var(--accent)' }} />}
            </div>
          </button>
        ))}
      </div>

      <div className="text-[11px] mt-2" style={{ color: 'var(--ink-faint)' }}>
        Tip: byt mitt under match — spelarna behåller sin ordning men får nya positioner.
      </div>
    </ModalShell>
  );
}

function GoalModal({ team, settings, game, playerById, onClose, onSave }) {
  const [scorerId, setScorerId] = useState(null);
  const [assistId, setAssistId] = useState(null);

  if (team === 'away') {
    return (
      <ModalShell title="Mål för motståndare" onClose={onClose}>
        <div className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>
          Lägg till mål för {settings.awayTeam}? Bortalagets spelarstatistik registreras inte.
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-muted)' }}>Avbryt</button>
          <button onClick={() => onSave(null, null)} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
            Bekräfta
          </button>
        </div>
      </ModalShell>
    );
  }

  // Home goal — pick scorer + assist from current lineup
  const onFieldPlayers = game.lineup.filter(Boolean).map(id => playerById.get(id)).filter(Boolean);
  const allRosterPlayers = [
    ...onFieldPlayers,
    ...game.bench.map(id => playerById.get(id)).filter(Boolean),
  ];

  return (
    <ModalShell title="Mål för oss" onClose={onClose}>
      <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: 'var(--ink-faint)' }}>Målskytt</div>
      {allRosterPlayers.length === 0 ? (
        <div className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>
          Inga spelare i truppen.
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {allRosterPlayers.map(p => (
            <PlayerPickButton key={p.id} player={p} selected={scorerId === p.id} disabled={assistId === p.id} onClick={() => setScorerId(scorerId === p.id ? null : p.id)} />
          ))}
        </div>
      )}

      <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: 'var(--ink-faint)' }}>Assist (valfritt)</div>
      <div className="grid grid-cols-4 gap-1.5 mb-5">
        {allRosterPlayers.map(p => (
          <PlayerPickButton key={p.id} player={p} selected={assistId === p.id} disabled={scorerId === p.id} onClick={() => setAssistId(assistId === p.id ? null : p.id)} />
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-muted)' }}>
          Avbryt
        </button>
        <button
          onClick={() => onSave(scorerId, assistId)}
          className="flex-1 py-3 rounded-xl text-sm font-bold"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          {scorerId ? 'Bekräfta mål' : 'Mål utan målskytt'}
        </button>
      </div>
    </ModalShell>
  );
}

function CardModal({ game, roster, onClose, onSave }) {
  const [cardType, setCardType] = useState('yellow');
  const [playerId, setPlayerId] = useState(null);
  const sorted = [...roster].sort((a, b) => Number(a.number || 0) - Number(b.number || 0));

  return (
    <ModalShell title="Kort" onClose={onClose}>
      <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: 'var(--ink-faint)' }}>Typ</div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {CARD_TYPES.map(c => (
          <button
            key={c.value}
            onClick={() => setCardType(c.value)}
            className="py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
            style={{
              background: cardType === c.value ? c.color : 'transparent',
              color: cardType === c.value ? 'white' : 'var(--ink)',
              border: `1.5px solid ${cardType === c.value ? c.color : 'var(--border-strong)'}`,
            }}
          >
            <Square size={12} fill={cardType === c.value ? 'white' : c.color} style={{ color: c.color }} />
            {c.label}
          </button>
        ))}
      </div>

      <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: 'var(--ink-faint)' }}>Spelare (valfritt)</div>
      {sorted.length === 0 ? (
        <div className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>Inga spelare i truppen.</div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5 mb-5">
          {sorted.map(p => (
            <PlayerPickButton key={p.id} player={p} selected={playerId === p.id} onClick={() => setPlayerId(playerId === p.id ? null : p.id)} />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-muted)' }}>
          Avbryt
        </button>
        <button
          onClick={() => onSave(playerId, cardType)}
          className="flex-1 py-3 rounded-xl text-sm font-bold"
          style={{ background: 'var(--ink)', color: 'var(--bg)' }}
        >
          Bekräfta
        </button>
      </div>
    </ModalShell>
  );
}

function PlayerPickButton({ player, selected, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-lg flex flex-col items-center gap-0.5 disabled:opacity-30"
      style={{
        background: selected ? 'var(--accent-soft)' : 'white',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        color: 'var(--ink)',
      }}
    >
      <span className="display tabular text-base font-bold leading-none">
        {player.number ? `#${player.number}` : initials(player.name)}
      </span>
      <span className="text-[10px] truncate max-w-full leading-tight">{player.name.split(' ')[0]}</span>
    </button>
  );
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <ModalShell title={title} onClose={onCancel}>
      <div className="text-sm mb-5" style={{ color: 'var(--ink)' }}>{message}</div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-muted)' }}>
          Avbryt
        </button>
        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl text-sm font-bold"
          style={{ background: '#dc2626', color: 'white' }}>
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
