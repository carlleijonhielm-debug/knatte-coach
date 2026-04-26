import React, { useState, useEffect, useMemo } from 'react';
import {
  Play, Pause, Plus, X, Trash2, Edit2, Settings as SettingsIcon,
  Users, BarChart3, Activity, RotateCcw, ArrowLeftRight, Award,
  AlertTriangle, ChevronDown, Square, Save, Goal as GoalIcon,
  Clock, Hash, Check, ListChecks, Calendar, Copy, ChevronRight, ArrowLeft
} from 'lucide-react';

// ===================================================================
// CONSTANTS
// ===================================================================

const STORAGE_KEYS = {
  settings: 'app:settings',
  roster: 'app:roster',
  coaches: 'app:coaches',
  matches: 'app:matches',
  activeMatchId: 'app:activeMatchId',
  // Old key, only read for migration
  legacyGame: 'app:currentGame',
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

const FORMATS = {
  '3v3': {
    label: '3 mot 3', playerCount: 3, halfMinutes: 15,
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
    label: '5 mot 5', playerCount: 5, halfMinutes: 20,
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
    label: '7 mot 7', playerCount: 7, halfMinutes: 25,
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
    label: '9 mot 9', playerCount: 9, halfMinutes: 30,
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
    label: '11 mot 11', playerCount: 11, halfMinutes: 45,
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

const firstName = (name) => {
  if (!name) return '?';
  return name.trim().split(/\s+/)[0];
};

// Format ISO datetime string for display: "lör 27 apr · 14:30"
function formatKickoff(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const days = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const day = days[d.getDay()];
  const date = d.getDate();
  const month = months[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${date} ${month} · ${hours}:${mins}`;
}

// Format kickoff for HTML datetime-local input ("YYYY-MM-DDTHH:MM")
function formatKickoffForInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Parse datetime-local input value back to ISO
function parseKickoffFromInput(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function makeNewMatch({ format = '7v7', name, opponent = '', squad = [], coaches = [], kickoffAt = null, venue = '', existingNames = [] } = {}) {
  const def = FORMATS[format];
  // Auto-generate name like "Match 1", "Match 2" if not provided
  let resolvedName = name;
  if (!resolvedName) {
    const usedNumbers = existingNames
      .map(n => /^Match (\d+)$/.exec(n))
      .filter(Boolean)
      .map(m => Number(m[1]));
    const next = usedNumbers.length ? Math.max(...usedNumbers) + 1 : 1;
    resolvedName = `Match ${next}`;
  }
  // Distribute squad into lineup + bench
  const lineup = Array(def.playerCount).fill(null);
  for (let i = 0; i < Math.min(def.playerCount, squad.length); i++) {
    lineup[i] = squad[i];
  }
  const bench = squad.slice(def.playerCount);

  return {
    id: uid(),
    name: resolvedName,
    opponent,
    kickoffAt,        // ISO string or null
    venue,            // free text
    format,
    formationName: def.formations[0].name,
    halfMinutes: def.halfMinutes,
    squad: [...squad],
    coaches: [...coaches],
    lineup,
    bench,
    homeScore: 0,
    awayScore: 0,
    half: 1,
    clockSeconds: 0,
    clockRunning: false,
    clockEpochAt: null,
    events: [],
    playingTime: {},
    createdAt: Date.now(),
    startedAt: null,
  };
}

function getFormation(format, formationName) {
  const def = FORMATS[format];
  return def.formations.find(f => f.name === formationName) || def.formations[0];
}

// ===================================================================
// CLOCK HELPERS — wall-clock based timing that survives backgrounding
// ===================================================================

// Live match clock (seconds): base + elapsed since current epoch if running.
function getLiveClockSeconds(match) {
  if (!match) return 0;
  const base = match.clockSeconds || 0;
  if (!match.clockRunning || !match.clockEpochAt) return base;
  const elapsed = Math.floor((Date.now() - match.clockEpochAt) / 1000);
  return base + Math.max(0, elapsed);
}

// Live playing time (seconds) for one player: only on-field players accrue.
function getLivePlayerSeconds(match, playerId) {
  if (!match) return 0;
  const base = (match.playingTime && match.playingTime[playerId]) || 0;
  if (!match.clockRunning || !match.clockEpochAt) return base;
  if (!match.lineup.includes(playerId)) return base;
  const elapsed = Math.floor((Date.now() - match.clockEpochAt) / 1000);
  return base + Math.max(0, elapsed);
}

// Compute a fresh "playingTime" map containing live values for every player.
function getLivePlayingTime(match) {
  if (!match) return {};
  const result = { ...(match.playingTime || {}) };
  if (match.clockRunning && match.clockEpochAt) {
    const elapsed = Math.floor((Date.now() - match.clockEpochAt) / 1000);
    if (elapsed > 0) {
      match.lineup.forEach(id => {
        if (id) result[id] = (result[id] || 0) + elapsed;
      });
    }
  }
  return result;
}

// Roll any pending elapsed time into base values, return updated match.
// Use before pausing, substituting, going to next half, etc.
function consolidateClock(match) {
  if (!match.clockRunning || !match.clockEpochAt) return match;
  const now = Date.now();
  const elapsed = Math.floor((now - match.clockEpochAt) / 1000);
  if (elapsed <= 0) return { ...match, clockEpochAt: now };
  const newPlayingTime = { ...(match.playingTime || {}) };
  match.lineup.forEach(id => {
    if (id) newPlayingTime[id] = (newPlayingTime[id] || 0) + elapsed;
  });
  return {
    ...match,
    clockSeconds: (match.clockSeconds || 0) + elapsed,
    playingTime: newPlayingTime,
    clockEpochAt: now, // reset epoch so we don't double-count
  };
}

// ===================================================================
// MAIN COMPONENT
// ===================================================================

export default function FootballCoachApp() {
  const [view, setView] = useState('match');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [roster, setRoster] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // UI / modal state
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [formatPickerOpen, setFormatPickerOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState(null); // null | 'new' | matchId
  const [confirmDeleteMatchId, setConfirmDeleteMatchId] = useState(null);

  const activeMatch = useMemo(
    () => matches.find(m => m.id === activeMatchId) || null,
    [matches, activeMatchId]
  );

  // ----- Fonts -----
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch (e) {} };
  }, []);

  // ----- Load (with migration from old single-game format) -----
  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined' || !window.storage) { setLoaded(true); return; }
      // Settings
      try {
        const s = await window.storage.get(STORAGE_KEYS.settings).catch(() => null);
        if (s?.value) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s.value) });
      } catch (e) {}
      // Roster
      let loadedRoster = [];
      try {
        const r = await window.storage.get(STORAGE_KEYS.roster).catch(() => null);
        if (r?.value) { loadedRoster = JSON.parse(r.value); setRoster(loadedRoster); }
      } catch (e) {}
      // Coaches
      try {
        const c = await window.storage.get(STORAGE_KEYS.coaches).catch(() => null);
        if (c?.value) setCoaches(JSON.parse(c.value));
      } catch (e) {}
      // Matches — try new format first
      let loadedMatches = null;
      try {
        const m = await window.storage.get(STORAGE_KEYS.matches).catch(() => null);
        if (m?.value) loadedMatches = JSON.parse(m.value);
      } catch (e) {}
      // Migrate from old single-game format
      if (!loadedMatches) {
        try {
          const old = await window.storage.get(STORAGE_KEYS.legacyGame).catch(() => null);
          if (old?.value) {
            const oldGame = JSON.parse(old.value);
            const allPlayers = [
              ...(oldGame.lineup || []).filter(Boolean),
              ...(oldGame.bench || []),
            ];
            loadedMatches = [{
              id: uid(),
              name: 'Match 1',
              opponent: '',
              format: oldGame.format || '7v7',
              formationName: oldGame.formationName || FORMATS[oldGame.format || '7v7'].formations[0].name,
              halfMinutes: oldGame.halfMinutes || FORMATS[oldGame.format || '7v7'].halfMinutes,
              squad: allPlayers,
              lineup: oldGame.lineup || Array(FORMATS[oldGame.format || '7v7'].playerCount).fill(null),
              bench: oldGame.bench || [],
              homeScore: oldGame.homeScore || 0,
              awayScore: oldGame.awayScore || 0,
              half: oldGame.half || 1,
              clockSeconds: oldGame.clockSeconds || 0,
              clockRunning: false,
              clockEpochAt: null,
              events: oldGame.events || [],
              playingTime: oldGame.playingTime || {},
              createdAt: oldGame.startedAt || Date.now(),
              startedAt: oldGame.startedAt || null,
            }];
          }
        } catch (e) {}
      }
      // Default: empty matches list — first match is created on demand
      if (!loadedMatches) loadedMatches = [];
      // Normalize: clock always paused on load, epoch reset, ensure new fields exist
      loadedMatches = loadedMatches.map(m => ({
        ...m,
        clockRunning: false,
        clockEpochAt: null,
        coaches: m.coaches || [],
        kickoffAt: m.kickoffAt || null,
        venue: m.venue || '',
      }));
      setMatches(loadedMatches);
      // Active match id
      try {
        const a = await window.storage.get(STORAGE_KEYS.activeMatchId).catch(() => null);
        if (a?.value && loadedMatches.find(m => m.id === a.value)) {
          setActiveMatchId(a.value);
        } else if (loadedMatches.length > 0) {
          setActiveMatchId(loadedMatches[0].id);
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
    window.storage.set(STORAGE_KEYS.coaches, JSON.stringify(coaches)).catch(() => {});
  }, [coaches, loaded]);
  useEffect(() => {
    if (!loaded || !window.storage) return;
    // Pause clocks when serializing
    const toSave = matches.map(m => ({ ...m, clockRunning: false }));
    window.storage.set(STORAGE_KEYS.matches, JSON.stringify(toSave)).catch(() => {});
  }, [matches, loaded]);
  useEffect(() => {
    if (!loaded || !window.storage) return;
    window.storage.set(STORAGE_KEYS.activeMatchId, activeMatchId || '').catch(() => {});
  }, [activeMatchId, loaded]);

  // ----- Re-render trigger so the clock display updates every second -----
  // The actual time math is wall-clock based via clockEpochAt, so this only
  // forces React to re-read Date.now(); it never increments any value itself.
  // This means iOS pausing the timer in background causes no time loss.
  const [, setTickCounter] = useState(0);
  useEffect(() => {
    if (!activeMatch?.clockRunning) return;
    const tick = () => setTickCounter(c => (c + 1) & 0xffff);
    const interval = setInterval(tick, 1000);
    const onVisibility = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [activeMatch?.clockRunning, activeMatchId]);

  // ----- Wake Lock: keep the screen awake while the clock is running -----
  // iOS releases the lock automatically when the app goes to background.
  // We re-acquire on visibilitychange so it kicks back in when you return.
  useEffect(() => {
    if (!activeMatch?.clockRunning) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let released = false;
    let lock = null;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
        lock.addEventListener?.('release', () => { lock = null; });
      } catch (e) { /* user interaction may be required, ignore */ }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !released && !lock) {
        acquire();
      }
    };
    acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (lock) { try { lock.release(); } catch (e) {} lock = null; }
    };
  }, [activeMatch?.clockRunning, activeMatchId]);

  // ----- Sync roster ↔ active match's squad -----
  // If a player is removed from the master roster, also remove from any match's squad/lineup/bench.
  useEffect(() => {
    if (!loaded) return;
    const rosterIds = new Set(roster.map(p => p.id));
    setMatches(ms => ms.map(m => {
      const squad = m.squad.filter(id => rosterIds.has(id));
      const lineup = m.lineup.map(id => (id && rosterIds.has(id)) ? id : null);
      const bench = m.bench.filter(id => rosterIds.has(id));
      if (squad.length === m.squad.length && bench.length === m.bench.length &&
          lineup.every((id, i) => id === m.lineup[i])) {
        return m;
      }
      return { ...m, squad, lineup, bench };
    }));
  }, [roster, loaded]);

  // ----- Sync coaches ↔ matches' coach lists -----
  useEffect(() => {
    if (!loaded) return;
    const coachIds = new Set(coaches.map(c => c.id));
    setMatches(ms => ms.map(m => {
      const matchCoaches = (m.coaches || []).filter(id => coachIds.has(id));
      if (matchCoaches.length === (m.coaches || []).length) return m;
      return { ...m, coaches: matchCoaches };
    }));
  }, [coaches, loaded]);

  // ============== HELPERS TO MUTATE ACTIVE MATCH ==============

  const updateActiveMatch = (updater) => {
    if (!activeMatchId) return;
    setMatches(ms => ms.map(m => m.id === activeMatchId ? updater(m) : m));
  };

  // ============== MATCH-LEVEL ACTIONS ==============

  const createMatch = (config) => {
    const existingNames = matches.map(m => m.name);
    // Default squad to all current roster
    const defaultSquad = roster.map(p => p.id);
    const newMatch = makeNewMatch({
      format: config?.format || activeMatch?.format || '7v7',
      name: config?.name,
      opponent: config?.opponent || '',
      kickoffAt: config?.kickoffAt ?? null,
      venue: config?.venue || '',
      squad: config?.squad ?? defaultSquad,
      coaches: config?.coaches ?? [],
      existingNames,
    });
    setMatches(ms => [...ms, newMatch]);
    setActiveMatchId(newMatch.id);
    return newMatch.id;
  };

  const updateMatch = (matchId, updates) => {
    setMatches(ms => ms.map(m => {
      if (m.id !== matchId) return m;
      const updated = { ...m, ...updates };
      // If format changed, reset formation/halfMinutes and re-distribute squad
      if (updates.format && updates.format !== m.format) {
        const def = FORMATS[updates.format];
        updated.formationName = def.formations[0].name;
        updated.halfMinutes = def.halfMinutes;
      }
      // If squad changed, redistribute to lineup/bench preserving on-field positions when possible
      if (updates.squad) {
        const newSquadSet = new Set(updates.squad);
        const def = FORMATS[updated.format];
        // Keep current on-field players that are still in squad
        const newLineup = m.lineup.map(id => (id && newSquadSet.has(id)) ? id : null);
        // Resize lineup to match format
        if (newLineup.length < def.playerCount) {
          while (newLineup.length < def.playerCount) newLineup.push(null);
        } else if (newLineup.length > def.playerCount) {
          newLineup.length = def.playerCount;
        }
        // Bench = squad members not on field
        const onFieldSet = new Set(newLineup.filter(Boolean));
        let bench = updates.squad.filter(id => !onFieldSet.has(id));
        // Fill empty lineup slots from bench
        for (let i = 0; i < newLineup.length; i++) {
          if (!newLineup[i] && bench.length > 0) {
            newLineup[i] = bench.shift();
          }
        }
        updated.lineup = newLineup;
        updated.bench = bench;
      } else if (updates.format && updates.format !== m.format) {
        // Format changed but squad didn't — re-fit
        const def = FORMATS[updates.format];
        const all = [...m.lineup.filter(Boolean), ...m.bench];
        const newLineup = Array(def.playerCount).fill(null);
        for (let i = 0; i < Math.min(def.playerCount, all.length); i++) newLineup[i] = all[i];
        updated.lineup = newLineup;
        updated.bench = all.slice(def.playerCount);
      }
      return updated;
    }));
  };

  const deleteMatch = (matchId) => {
    setMatches(ms => ms.filter(m => m.id !== matchId));
    if (activeMatchId === matchId) {
      setMatches(ms => {
        const remaining = ms.filter(m => m.id !== matchId);
        setActiveMatchId(remaining.length ? remaining[0].id : null);
        return remaining;
      });
    }
    setConfirmDeleteMatchId(null);
  };

  const duplicateMatch = (matchId) => {
    const original = matches.find(m => m.id === matchId);
    if (!original) return;
    const def = FORMATS[original.format];
    const lineup = Array(def.playerCount).fill(null);
    for (let i = 0; i < Math.min(def.playerCount, original.squad.length); i++) {
      lineup[i] = original.squad[i];
    }
    const copy = {
      ...original,
      id: uid(),
      name: original.name + ' (kopia)',
      lineup,
      bench: original.squad.slice(def.playerCount),
      homeScore: 0,
      awayScore: 0,
      half: 1,
      clockSeconds: 0,
      clockRunning: false,
      clockEpochAt: null,
      events: [],
      playingTime: {},
      createdAt: Date.now(),
      startedAt: null,
    };
    setMatches(ms => [...ms, copy]);
    setActiveMatchId(copy.id);
  };

  const switchActiveMatch = (matchId) => {
    // Pause + consolidate any currently running match before switching away.
    setMatches(ms => ms.map(m => {
      if (!m.clockRunning) return m;
      const consolidated = consolidateClock(m);
      return { ...consolidated, clockRunning: false, clockEpochAt: null };
    }));
    setActiveMatchId(matchId);
    setSelectedPlayerId(null);
    setView('match');
  };

  const resetActiveMatch = () => {
    if (!activeMatch) return;
    const def = FORMATS[activeMatch.format];
    const lineup = Array(def.playerCount).fill(null);
    for (let i = 0; i < Math.min(def.playerCount, activeMatch.squad.length); i++) {
      lineup[i] = activeMatch.squad[i];
    }
    updateActiveMatch(m => ({
      ...m,
      lineup,
      bench: m.squad.slice(def.playerCount),
      homeScore: 0,
      awayScore: 0,
      half: 1,
      clockSeconds: 0,
      clockRunning: false,
      clockEpochAt: null,
      events: [],
      playingTime: {},
      startedAt: null,
    }));
    setConfirmReset(false);
    setSelectedPlayerId(null);
  };

  // ============== ACTIVE MATCH ACTIONS ==============

  const toggleClock = () => updateActiveMatch(m => {
    if (m.clockRunning) {
      // Pause: roll elapsed time into base, drop epoch.
      const consolidated = consolidateClock(m);
      return { ...consolidated, clockRunning: false, clockEpochAt: null };
    }
    // Start: mark wall-clock starting point, no base change.
    return {
      ...m,
      clockRunning: true,
      clockEpochAt: Date.now(),
      startedAt: m.startedAt || Date.now(),
    };
  });

  const adjustClock = (delta) => updateActiveMatch(m => {
    // Consolidate first so we never lose pending elapsed time, then nudge.
    const consolidated = consolidateClock(m);
    return {
      ...consolidated,
      clockSeconds: Math.max(0, (consolidated.clockSeconds || 0) + delta),
    };
  });

  const goNextHalf = () => updateActiveMatch(m => {
    // Consolidate so the half's playing time is preserved before resetting clock.
    const consolidated = consolidateClock(m);
    return {
      ...consolidated,
      half: m.half + 1,
      clockSeconds: 0,
      clockRunning: false,
      clockEpochAt: null,
    };
  });

  const setFormation = (formationName) => {
    updateActiveMatch(m => ({ ...m, formationName }));
    setSelectedPlayerId(null);
  };

  const tapPlayer = (playerId) => {
    if (!selectedPlayerId) { setSelectedPlayerId(playerId); return; }
    if (selectedPlayerId === playerId) { setSelectedPlayerId(null); return; }
    swapPlayers(selectedPlayerId, playerId);
    setSelectedPlayerId(null);
  };

  const tapEmptyPosition = (positionIndex) => {
    if (!selectedPlayerId) return;
    updateActiveMatch(m => {
      // Capture any pending elapsed time before changing the lineup.
      const m2 = consolidateClock(m);
      const newLineup = [...m2.lineup];
      const newBench = [...m2.bench];
      const fromLineupIdx = newLineup.indexOf(selectedPlayerId);
      if (fromLineupIdx !== -1) {
        newLineup[fromLineupIdx] = null;
      } else {
        const benchIdx = newBench.indexOf(selectedPlayerId);
        if (benchIdx !== -1) newBench.splice(benchIdx, 1);
      }
      newLineup[positionIndex] = selectedPlayerId;
      return { ...m2, lineup: newLineup, bench: newBench };
    });
    setSelectedPlayerId(null);
  };

  const swapPlayers = (id1, id2) => {
    updateActiveMatch(m => {
      // Consolidate first so on-field time up to this moment is preserved.
      const m2 = consolidateClock(m);
      const newLineup = [...m2.lineup];
      const newBench = [...m2.bench];
      const i1 = newLineup.indexOf(id1);
      const i2 = newLineup.indexOf(id2);
      const onField1 = i1 !== -1, onField2 = i2 !== -1;

      if (onField1 && onField2) {
        newLineup[i1] = id2; newLineup[i2] = id1;
        return { ...m2, lineup: newLineup, bench: newBench };
      }
      if (!onField1 && !onField2) return m2;
      const fieldId = onField1 ? id1 : id2;
      const benchId = onField1 ? id2 : id1;
      const fieldPos = onField1 ? i1 : i2;
      newLineup[fieldPos] = benchId;
      const benchIdx = newBench.indexOf(benchId);
      if (benchIdx !== -1) newBench.splice(benchIdx, 1);
      newBench.push(fieldId);
      const newEvent = {
        id: uid(), type: 'sub', time: getLiveClockSeconds(m2), half: m2.half,
        outId: fieldId, inId: benchId, ts: Date.now(),
      };
      return { ...m2, lineup: newLineup, bench: newBench, events: [newEvent, ...m2.events] };
    });
  };

  const recordGoal = (team, scorerId, assistId) => {
    updateActiveMatch(m => ({
      ...m,
      [team === 'home' ? 'homeScore' : 'awayScore']: m[team === 'home' ? 'homeScore' : 'awayScore'] + 1,
      events: [{
        id: uid(), type: 'goal', team, scorerId, assistId,
        time: getLiveClockSeconds(m), half: m.half, ts: Date.now(),
      }, ...m.events],
    }));
    setGoalModalOpen(null);
  };

  const recordCard = (playerId, cardType) => {
    updateActiveMatch(m => ({
      ...m,
      events: [{
        id: uid(), type: 'card', playerId, cardType,
        time: getLiveClockSeconds(m), half: m.half, ts: Date.now(),
      }, ...m.events],
    }));
    setCardModalOpen(false);
  };

  const undoLastEvent = () => {
    updateActiveMatch(m => {
      if (m.events.length === 0) return m;
      const [latest, ...rest] = m.events;
      const updates = { ...m, events: rest };
      if (latest.type === 'goal') {
        updates[latest.team === 'home' ? 'homeScore' : 'awayScore'] = Math.max(
          0, m[latest.team === 'home' ? 'homeScore' : 'awayScore'] - 1
        );
      }
      return updates;
    });
  };

  // Roster ops
  const addPlayer = (player) => setRoster(r => [...r, { id: uid(), ...player }]);
  const updatePlayer = (id, updates) => setRoster(r => r.map(p => p.id === id ? { ...p, ...updates } : p));
  const removePlayer = (id) => setRoster(r => r.filter(p => p.id !== id));

  // Coach ops
  const addCoach = (coach) => setCoaches(c => [...c, { id: uid(), ...coach }]);
  const updateCoach = (id, updates) => setCoaches(c => c.map(x => x.id === id ? { ...x, ...updates } : x));
  const removeCoach = (id) => setCoaches(c => c.filter(x => x.id !== id));

  const playerById = useMemo(() => {
    const map = new Map();
    roster.forEach(p => map.set(p.id, p));
    return map;
  }, [roster]);

  const coachById = useMemo(() => {
    const map = new Map();
    coaches.forEach(c => map.set(c.id, c));
    return map;
  }, [coaches]);

  const playerStats = useMemo(() => {
    const s = {};
    roster.forEach(p => { s[p.id] = { goals: 0, assists: 0, yellow: 0, red: 0 }; });
    if (!activeMatch) return s;
    activeMatch.events.forEach(e => {
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
  }, [activeMatch, roster]);

  // ============== RENDER ==============

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4ede0', color: '#1a1814', fontFamily: 'system-ui' }}>
        <div className="text-sm opacity-60">Laddar…</div>
      </div>
    );
  }

  // Match setup view (overlays everything when active)
  if (editingMatchId !== null) {
    const editingMatch = editingMatchId === 'new' ? null : matches.find(m => m.id === editingMatchId);
    return (
      <div className="min-h-screen pb-8" style={{ background: '#f4ede0', color: '#1a1814', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
        <GlobalStyles />
        <div className="max-w-md mx-auto">
          <MatchSetupView
            match={editingMatch}
            roster={roster}
            coaches={coaches}
            existingNames={matches.filter(m => m.id !== editingMatch?.id).map(m => m.name)}
            onCancel={() => setEditingMatchId(null)}
            onSave={(config) => {
              if (editingMatchId === 'new') {
                createMatch(config);
              } else {
                updateMatch(editingMatchId, config);
              }
              setEditingMatchId(null);
              setView('match');
            }}
            onDelete={editingMatch ? () => setConfirmDeleteMatchId(editingMatch.id) : null}
          />
        </div>
        {confirmDeleteMatchId && (
          <ConfirmModal
            title="Ta bort match?"
            message="Matchens data försvinner permanent. Truppen påverkas inte."
            confirmLabel="Ta bort"
            onConfirm={() => {
              deleteMatch(confirmDeleteMatchId);
              setEditingMatchId(null);
            }}
            onCancel={() => setConfirmDeleteMatchId(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: '#f4ede0', color: '#1a1814', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', WebkitTapHighlightColor: 'transparent' }}
    >
      <GlobalStyles />

      <div className="max-w-md mx-auto">
        {view === 'matches' && (
          <MatchesListView
            matches={matches}
            activeMatchId={activeMatchId}
            settings={settings}
            roster={roster}
            coachById={coachById}
            onOpen={(id) => switchActiveMatch(id)}
            onEdit={(id) => setEditingMatchId(id)}
            onCreate={() => setEditingMatchId('new')}
            onDuplicate={duplicateMatch}
          />
        )}
        {view === 'match' && (
          activeMatch ? (
            <MatchView
              settings={settings}
              match={activeMatch}
              roster={roster}
              playerById={playerById}
              coachById={coachById}
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={tapPlayer}
              onTapEmpty={tapEmptyPosition}
              onToggleClock={toggleClock}
              onAdjustClock={adjustClock}
              onNextHalf={goNextHalf}
              onOpenFormatPicker={() => setFormatPickerOpen(true)}
              onOpenGoal={(t) => setGoalModalOpen(t)}
              onOpenCard={() => setCardModalOpen(true)}
              onUndo={undoLastEvent}
              onAskReset={() => setConfirmReset(true)}
              onEditMatch={() => setEditingMatchId(activeMatchId)}
              onGoToMatches={() => setView('matches')}
            />
          ) : (
            <NoMatchEmptyState onCreate={() => setEditingMatchId('new')} hasRoster={roster.length > 0} />
          )
        )}
        {view === 'stats' && (
          <StatsView match={activeMatch} roster={roster} settings={settings} playerStats={playerStats} playerById={playerById} />
        )}
        {view === 'roster' && (
          <RosterView
            roster={roster}
            coaches={coaches}
            onAdd={addPlayer}
            onUpdate={updatePlayer}
            onRemove={removePlayer}
            onAddCoach={addCoach}
            onUpdateCoach={updateCoach}
            onRemoveCoach={removeCoach}
          />
        )}
        {view === 'settings' && (
          <SettingsView settings={settings} onChange={setSettings} onAskReset={() => setConfirmReset(true)} hasActiveMatch={!!activeMatch} />
        )}
      </div>

      <BottomNav view={view} setView={setView} />

      {formatPickerOpen && activeMatch && (
        <FormatPickerModal
          format={activeMatch.format}
          formationName={activeMatch.formationName}
          onSetFormat={(f) => updateMatch(activeMatchId, { format: f })}
          onSetFormation={setFormation}
          onClose={() => setFormatPickerOpen(false)}
        />
      )}
      {goalModalOpen && activeMatch && (
        <GoalModal
          team={goalModalOpen}
          settings={settings}
          match={activeMatch}
          playerById={playerById}
          onClose={() => setGoalModalOpen(null)}
          onSave={(scorerId, assistId) => recordGoal(goalModalOpen, scorerId, assistId)}
        />
      )}
      {cardModalOpen && activeMatch && (
        <CardModal
          match={activeMatch}
          playerById={playerById}
          onClose={() => setCardModalOpen(false)}
          onSave={recordCard}
        />
      )}
      {confirmReset && (
        <ConfirmModal
          title="Återställ matchen?"
          message="Klocka, mål och speltid nollställs. Truppen behålls."
          confirmLabel="Ja, återställ"
          onConfirm={resetActiveMatch}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

// ===================================================================
// GLOBAL STYLES
// ===================================================================

function GlobalStyles() {
  return (
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
  );
}

// ===================================================================
// EMPTY STATE (no active match)
// ===================================================================

function NoMatchEmptyState({ onCreate, hasRoster }) {
  return (
    <div className="px-4 pt-12 text-center">
      <div className="rounded-2xl p-8" style={{ background: 'var(--surface)', border: '1px dashed var(--border-strong)' }}>
        <Calendar size={32} className="mx-auto mb-3" style={{ color: 'var(--ink-faint)' }} />
        <div className="display text-2xl font-bold mb-2">Ingen match igång</div>
        <div className="text-sm mb-5" style={{ color: 'var(--ink-muted)' }}>
          {hasRoster
            ? 'Skapa en match för att sätta lag och starta klockan.'
            : 'Lägg först till spelare under "Trupp", skapa sen en match.'}
        </div>
        <button
          onClick={onCreate}
          className="px-5 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <Plus size={16} /> Skapa första matchen
        </button>
      </div>
    </div>
  );
}

// ===================================================================
// MATCHES LIST VIEW
// ===================================================================

function MatchesListView({ matches, activeMatchId, settings, roster, coachById, onOpen, onEdit, onCreate, onDuplicate }) {
  // Sort: matches with kickoff time first (chronological); matches without time last (by createdAt desc)
  const sorted = useMemo(() => {
    const withTime = matches.filter(m => m.kickoffAt);
    const withoutTime = matches.filter(m => !m.kickoffAt);
    withTime.sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
    withoutTime.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return [...withTime, ...withoutTime];
  }, [matches]);

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="display text-3xl font-bold">Matcher</h1>
          <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            {matches.length} match{matches.length === 1 ? '' : 'er'}
          </div>
        </div>
        <button
          onClick={onCreate}
          className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <Plus size={16} /> Ny match
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface)', border: '1px dashed var(--border-strong)' }}>
          <Calendar size={28} className="mx-auto mb-3" style={{ color: 'var(--ink-faint)' }} />
          <div className="text-sm font-semibold mb-1">Inga matcher ännu</div>
          <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Skapa en match för att kunna sätta lag och starta klockan
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              isActive={m.id === activeMatchId}
              settings={settings}
              roster={roster}
              coachById={coachById}
              onOpen={() => onOpen(m.id)}
              onEdit={() => onEdit(m.id)}
              onDuplicate={() => onDuplicate(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, isActive, settings, roster, coachById, onOpen, onEdit, onDuplicate }) {
  const fmt = FORMATS[match.format];
  // Live clock — for the active running match this updates each render.
  const liveClock = getLiveClockSeconds(match);
  const isStarted = match.events.length > 0 || liveClock > 0 || match.homeScore > 0 || match.awayScore > 0;
  const opponentLabel = match.opponent || settings.awayTeam;
  const kickoff = formatKickoff(match.kickoffAt);
  const matchCoaches = (match.coaches || [])
    .map(id => coachById?.get(id))
    .filter(Boolean);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: isActive ? 'var(--accent-soft)' : 'var(--surface)',
        border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      <button onClick={onOpen} className="w-full text-left p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {isActive && (
              <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-px rounded"
                style={{ background: 'var(--accent)', color: 'white' }}>
                Aktiv
              </span>
            )}
            <div className="text-base font-bold truncate" style={{ color: 'var(--ink)' }}>
              {match.name}
            </div>
          </div>
          {(kickoff || match.venue) && (
            <div className="flex items-center gap-1.5 mb-0.5 text-[11px] font-semibold" style={{ color: 'var(--ink)' }}>
              {kickoff && <><Clock size={11} style={{ color: 'var(--ink-muted)' }} /><span>{kickoff}</span></>}
              {kickoff && match.venue && <span style={{ color: 'var(--ink-faint)' }}>·</span>}
              {match.venue && <span className="truncate">{match.venue}</span>}
            </div>
          )}
          <div className="text-xs truncate" style={{ color: 'var(--ink-muted)' }}>
            vs {opponentLabel} · {fmt.label} · {match.formationName} · {match.squad.length} i trupp
          </div>
          {matchCoaches.length > 0 && (
            <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--ink-faint)' }}>
              {matchCoaches.length === 1 ? 'Tränare' : 'Tränare'}: {matchCoaches.map(c => c.name).join(', ')}
            </div>
          )}
          {isStarted ? (
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <span className="display tabular font-bold" style={{ color: 'var(--ink)' }}>
                {match.homeScore}–{match.awayScore}
              </span>
              <span style={{ color: 'var(--ink-faint)' }}>
                · halvlek {match.half} · {formatClock(liveClock)}
              </span>
            </div>
          ) : (
            <div className="text-[11px] mt-1" style={{ color: 'var(--ink-faint)' }}>
              Ej startad
            </div>
          )}
        </div>
        <ChevronRight size={18} style={{ color: 'var(--ink-faint)' }} />
      </button>
      <div className="flex border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onEdit}
          className="flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
          style={{ color: 'var(--ink-muted)' }}
        >
          <Edit2 size={12} /> Redigera
        </button>
        <button
          onClick={onDuplicate}
          className="flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-l"
          style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
        >
          <Copy size={12} /> Duplicera
        </button>
      </div>
    </div>
  );
}

// ===================================================================
// MATCH SETUP VIEW (create / edit)
// ===================================================================

function MatchSetupView({ match, roster, coaches, existingNames, onCancel, onSave, onDelete }) {
  const isNew = !match;
  const [name, setName] = useState(match?.name || '');
  const [opponent, setOpponent] = useState(match?.opponent || '');
  const [kickoffInput, setKickoffInput] = useState(formatKickoffForInput(match?.kickoffAt));
  const [venue, setVenue] = useState(match?.venue || '');
  const [format, setFormat] = useState(match?.format || '7v7');
  const [formationName, setFormationName] = useState(match?.formationName || FORMATS[match?.format || '7v7'].formations[0].name);
  const [halfMinutes, setHalfMinutes] = useState(match?.halfMinutes || FORMATS[match?.format || '7v7'].halfMinutes);
  const [squad, setSquad] = useState(() => {
    if (match) return match.squad;
    // For new match: include the entire roster by default
    return roster.map(p => p.id);
  });
  const [matchCoaches, setMatchCoaches] = useState(() => {
    if (match) return match.coaches || [];
    // For new match: include all current coaches by default
    return coaches.map(c => c.id);
  });

  // When format changes, sync formation/halfMinutes to that format's defaults
  useEffect(() => {
    const def = FORMATS[format];
    if (!def.formations.find(f => f.name === formationName)) {
      setFormationName(def.formations[0].name);
    }
  }, [format]); // eslint-disable-line

  const formatDef = FORMATS[format];
  const sortedRoster = [...roster].sort((a, b) => Number(a.number || 0) - Number(b.number || 0));
  const squadSet = new Set(squad);
  const togglePlayer = (id) => {
    setSquad(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };
  const selectAll = () => setSquad(roster.map(p => p.id));
  const clearAll = () => setSquad([]);

  const sortedCoaches = [...coaches].sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  const coachSet = new Set(matchCoaches);
  const toggleCoach = (id) => {
    setMatchCoaches(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  // Generate placeholder name for new match
  const placeholderName = useMemo(() => {
    const usedNumbers = existingNames
      .map(n => /^Match (\d+)$/.exec(n))
      .filter(Boolean)
      .map(m => Number(m[1]));
    const next = usedNumbers.length ? Math.max(...usedNumbers) + 1 : 1;
    return `Match ${next}`;
  }, [existingNames]);

  const canSave = squad.length > 0 || isNew;

  return (
    <div className="px-4 pt-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={onCancel} className="p-2 -ml-2" style={{ color: 'var(--ink-muted)' }} aria-label="Tillbaka">
          <ArrowLeft size={18} />
        </button>
        <h1 className="display text-2xl font-bold flex-1">
          {isNew ? 'Ny match' : 'Redigera match'}
        </h1>
      </div>

      {/* Name + opponent */}
      <div className="rounded-2xl p-4 mb-3 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-1.5" style={{ color: 'var(--ink-faint)' }}>Namn</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={placeholderName}
            className="w-full px-3 py-2.5 rounded-lg outline-none"
            style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-1.5" style={{ color: 'var(--ink-faint)' }}>Motståndare (valfritt)</label>
          <input
            value={opponent}
            onChange={e => setOpponent(e.target.value)}
            placeholder="t.ex. Hammarby"
            className="w-full px-3 py-2.5 rounded-lg outline-none"
            style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}
          />
        </div>
      </div>

      {/* Kickoff time + venue */}
      <div className="rounded-2xl p-4 mb-3 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-1.5" style={{ color: 'var(--ink-faint)' }}>Datum & avspark (valfritt)</label>
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={kickoffInput}
              onChange={e => setKickoffInput(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg outline-none"
              style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}
            />
            {kickoffInput && (
              <button
                onClick={() => setKickoffInput('')}
                className="px-3 py-2.5 rounded-lg text-xs font-semibold"
                style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-muted)' }}
                aria-label="Rensa tid"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {kickoffInput && (
            <div className="text-[11px] mt-1" style={{ color: 'var(--ink-faint)' }}>
              {formatKickoff(parseKickoffFromInput(kickoffInput)) || ''}
            </div>
          )}
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-1.5" style={{ color: 'var(--ink-faint)' }}>Plan / arena (valfritt)</label>
          <input
            value={venue}
            onChange={e => setVenue(e.target.value)}
            placeholder="t.ex. Plan 3, Hovet IP"
            className="w-full px-3 py-2.5 rounded-lg outline-none"
            style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}
          />
        </div>
      </div>

      {/* Format */}
      <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-2" style={{ color: 'var(--ink-faint)' }}>Spelform</label>
        <div className="grid grid-cols-5 gap-1.5">
          {Object.keys(FORMATS).map(k => (
            <button
              key={k}
              onClick={() => setFormat(k)}
              className="py-2.5 rounded-lg text-xs font-bold"
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
      </div>

      {/* Formation */}
      <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-2" style={{ color: 'var(--ink-faint)' }}>Uppställning</label>
        <div className="grid grid-cols-2 gap-2">
          {formatDef.formations.map(f => (
            <button
              key={f.name}
              onClick={() => setFormationName(f.name)}
              className="rounded-xl overflow-hidden text-left"
              style={{
                border: `1.5px solid ${formationName === f.name ? 'var(--accent)' : 'var(--border)'}`,
                background: formationName === f.name ? 'var(--accent-soft)' : 'white',
              }}
            >
              <div className="relative w-full" style={{ aspectRatio: '1 / 1.1', background: 'var(--pitch-green)' }}>
                <PitchMarkings />
                {f.positions.map((pos, i) => (
                  <div key={i} className="absolute rounded-full" style={{
                    width: 10, height: 10,
                    left: `${pos.x * 100}%`, top: `${pos.y * 100}%`,
                    background: 'white', transform: 'translate(-50%, -50%)', border: '1px solid rgba(0,0,0,0.2)',
                  }} />
                ))}
              </div>
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: 'var(--ink)' }}>{f.name}</span>
                {formationName === f.name && <Check size={12} style={{ color: 'var(--accent)' }} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Half length */}
      <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-2" style={{ color: 'var(--ink-faint)' }}>Halvlekstid</label>
        <div className="grid grid-cols-5 gap-1.5">
          {[15, 20, 25, 30, 45].map(min => (
            <button
              key={min}
              onClick={() => setHalfMinutes(min)}
              className="py-2.5 rounded-lg text-xs font-bold tabular"
              style={{
                background: halfMinutes === min ? 'var(--ink)' : 'transparent',
                color: halfMinutes === min ? 'var(--bg)' : 'var(--ink)',
                border: `1px solid ${halfMinutes === min ? 'var(--ink)' : 'var(--border-strong)'}`,
              }}
            >
              {min}'
            </button>
          ))}
        </div>
      </div>

      {/* Squad picker */}
      <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: 'var(--ink-faint)' }}>
            Trupp ({squad.length}/{roster.length})
          </label>
          <div className="flex gap-1">
            <button onClick={selectAll} className="text-[11px] font-semibold px-2 py-1 rounded" style={{ color: 'var(--ink-muted)' }}>
              Alla
            </button>
            <button onClick={clearAll} className="text-[11px] font-semibold px-2 py-1 rounded" style={{ color: 'var(--ink-muted)' }}>
              Rensa
            </button>
          </div>
        </div>

        {squad.length < formatDef.playerCount && squad.length > 0 && (
          <div className="text-[11px] mb-2 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(201, 124, 11, 0.1)', color: 'var(--warn)' }}>
            Endast {squad.length} spelare valda — {formatDef.label} kräver minst {formatDef.playerCount} på plan.
          </div>
        )}

        {sortedRoster.length === 0 ? (
          <div className="text-xs text-center py-4" style={{ color: 'var(--ink-muted)' }}>
            Lägg till spelare under "Trupp" först
          </div>
        ) : (
          <div className="space-y-1">
            {sortedRoster.map(p => {
              const inSquad = squadSet.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlayer(p.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left"
                  style={{
                    background: inSquad ? 'var(--accent-soft)' : 'white',
                    border: `1.5px solid ${inSquad ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-center justify-center rounded shrink-0" style={{
                    width: 22, height: 22,
                    background: inSquad ? 'var(--accent)' : 'transparent',
                    border: inSquad ? 'none' : '1.5px solid var(--border-strong)',
                  }}>
                    {inSquad && <Check size={14} style={{ color: 'white' }} />}
                  </div>
                  <span className="display tabular text-sm font-bold w-7" style={{ color: 'var(--ink-muted)' }}>
                    {p.number ? `#${p.number}` : '–'}
                  </span>
                  <span className="text-sm font-semibold flex-1 truncate" style={{ color: 'var(--ink)' }}>
                    {p.name}
                  </span>
                  {p.preferredRole && (
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-faint)' }}>
                      {ROLES[p.preferredRole]?.short}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Coach picker */}
      <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: 'var(--ink-faint)' }}>
            Tränare ({matchCoaches.length}/{coaches.length})
          </label>
          {coaches.length > 0 && (
            <div className="flex gap-1">
              <button onClick={() => setMatchCoaches(coaches.map(c => c.id))} className="text-[11px] font-semibold px-2 py-1 rounded" style={{ color: 'var(--ink-muted)' }}>
                Alla
              </button>
              <button onClick={() => setMatchCoaches([])} className="text-[11px] font-semibold px-2 py-1 rounded" style={{ color: 'var(--ink-muted)' }}>
                Rensa
              </button>
            </div>
          )}
        </div>

        {sortedCoaches.length === 0 ? (
          <div className="text-xs text-center py-4" style={{ color: 'var(--ink-muted)' }}>
            Lägg till tränare under "Trupp" först
          </div>
        ) : (
          <div className="space-y-1">
            {sortedCoaches.map(c => {
              const inMatch = coachSet.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCoach(c.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left"
                  style={{
                    background: inMatch ? 'var(--accent-soft)' : 'white',
                    border: `1.5px solid ${inMatch ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-center justify-center rounded shrink-0" style={{
                    width: 22, height: 22,
                    background: inMatch ? 'var(--accent)' : 'transparent',
                    border: inMatch ? 'none' : '1.5px solid var(--border-strong)',
                  }}>
                    {inMatch && <Check size={14} style={{ color: 'white' }} />}
                  </div>
                  <span className="text-sm font-semibold flex-1 truncate" style={{ color: 'var(--ink)' }}>
                    {c.name}
                  </span>
                  {c.role && (
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-faint)' }}>
                      {c.role}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-5">
        {onDelete && (
          <button
            onClick={onDelete}
            className="px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ border: '1px solid rgba(220, 38, 38, 0.4)', color: '#dc2626' }}
          >
            <Trash2 size={14} />
          </button>
        )}
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-muted)' }}
        >
          Avbryt
        </button>
        <button
          disabled={!canSave}
          onClick={() => onSave({
            name: name.trim() || placeholderName,
            opponent: opponent.trim(),
            kickoffAt: parseKickoffFromInput(kickoffInput),
            venue: venue.trim(),
            format,
            formationName,
            halfMinutes,
            squad,
            coaches: matchCoaches,
          })}
          className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-30"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          {isNew ? 'Skapa match' : 'Spara'}
        </button>
      </div>
    </div>
  );
}

// ===================================================================
// MATCH VIEW (live game)
// ===================================================================

function MatchView({
  settings, match, roster, playerById, coachById, selectedPlayerId,
  onSelectPlayer, onTapEmpty,
  onToggleClock, onAdjustClock, onNextHalf,
  onOpenFormatPicker, onOpenGoal, onOpenCard, onUndo, onAskReset,
  onEditMatch, onGoToMatches,
}) {
  const formatDef = FORMATS[match.format];
  const formation = getFormation(match.format, match.formationName);
  const halfTotal = match.halfMinutes * 60;
  // Live values — recomputed on every render (the parent forces re-render every second).
  const liveClock = getLiveClockSeconds(match);
  const livePlayingTime = getLivePlayingTime(match);
  const overtime = liveClock > halfTotal;
  const opponentLabel = match.opponent || settings.awayTeam;
  const kickoff = formatKickoff(match.kickoffAt);
  const matchCoaches = (match.coaches || [])
    .map(id => coachById?.get(id))
    .filter(Boolean);

  return (
    <div className="px-4 pt-5">
      {/* Match header — name + switch */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onGoToMatches}
          className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-xl text-left"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <ListChecks size={14} style={{ color: 'var(--ink-muted)' }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate" style={{ color: 'var(--ink)' }}>{match.name}</div>
            <div className="text-[11px] truncate" style={{ color: 'var(--ink-muted)' }}>vs {opponentLabel}</div>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--ink-faint)' }} />
        </button>
        <button onClick={onEditMatch} className="p-2.5 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }} aria-label="Redigera match">
          <Edit2 size={14} />
        </button>
      </div>

      {/* Match info: kickoff, venue, coaches */}
      {(kickoff || match.venue || matchCoaches.length > 0) && (
        <div className="rounded-xl px-3 py-2 mb-3 space-y-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {(kickoff || match.venue) && (
            <div className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>
              {kickoff && <><Clock size={12} style={{ color: 'var(--ink-muted)' }} /><span>{kickoff}</span></>}
              {kickoff && match.venue && <span style={{ color: 'var(--ink-faint)' }}>·</span>}
              {match.venue && <span className="truncate">{match.venue}</span>}
            </div>
          )}
          {matchCoaches.length > 0 && (
            <div className="text-[11px] truncate" style={{ color: 'var(--ink-muted)' }}>
              <span style={{ color: 'var(--ink-faint)' }}>Tränare:</span> {matchCoaches.map(c => c.name).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Top row: format + undo */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onOpenFormatPicker}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--ink)' }}
        >
          <span>{formatDef.label}</span>
          <span className="opacity-50">·</span>
          <span>{match.formationName}</span>
          <ChevronDown size={12} className="opacity-60" />
        </button>
        <div className="flex-1" />
        <button
          onClick={onUndo}
          disabled={match.events.length === 0}
          className="p-2 rounded-lg disabled:opacity-30"
          style={{ color: 'var(--ink-muted)' }}
          aria-label="Ångra"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Score + clock */}
      <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 text-center">
            <div className="text-[10px] uppercase tracking-widest mb-1 truncate" style={{ color: 'var(--ink-muted)' }}>
              {settings.homeTeam}
            </div>
            <div className="display tabular text-5xl font-bold" style={{ color: 'var(--ink)' }}>{match.homeScore}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-widest mb-1 display font-bold" style={{ color: overtime ? 'var(--accent)' : 'var(--ink-muted)' }}>
              Halvlek {match.half}
            </div>
            <div className={`display tabular text-2xl font-bold ${match.clockRunning ? '' : 'opacity-70'}`} style={{ color: overtime ? 'var(--accent)' : 'var(--ink)' }}>
              {formatClock(liveClock)}
            </div>
            <div className="text-[9px] mt-0.5 tabular" style={{ color: 'var(--ink-faint)' }}>
              / {match.halfMinutes}:00
            </div>
          </div>
          <div className="flex-1 min-w-0 text-center">
            <div className="text-[10px] uppercase tracking-widest mb-1 truncate" style={{ color: 'var(--ink-muted)' }}>
              {opponentLabel}
            </div>
            <div className="display tabular text-5xl font-bold" style={{ color: 'var(--ink)' }}>{match.awayScore}</div>
          </div>
        </div>

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
            style={{ background: match.clockRunning ? 'var(--ink)' : 'var(--accent)', color: match.clockRunning ? 'var(--bg)' : 'white' }}
          >
            {match.clockRunning ? <><Pause size={14} /> Paus</> : <><Play size={14} /> Start</>}
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

      {/* Pitch */}
      <Pitch
        formation={formation}
        lineup={match.lineup}
        playerById={playerById}
        playingTime={livePlayingTime}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={onSelectPlayer}
        onTapEmpty={onTapEmpty}
      />

      {/* Bench */}
      <Bench
        bench={match.bench}
        playerById={playerById}
        playingTime={livePlayingTime}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={onSelectPlayer}
        squadSize={match.squad.length}
      />

      {/* Selection hint */}
      {selectedPlayerId && playerById.get(selectedPlayerId) && (
        <div className="rounded-xl px-3 py-2 mb-3 text-xs flex items-center gap-2"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)', border: '1px solid rgba(216,80,26,0.25)' }}>
          <ArrowLeftRight size={14} />
          <span>
            <strong>{playerById.get(selectedPlayerId).name}</strong> vald — knacka annan spelare för byte
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
      {match.events.length > 0 && (
        <div className="mt-5 mb-2">
          <div className="text-[10px] uppercase tracking-[0.2em] mb-2 px-1" style={{ color: 'var(--ink-faint)' }}>
            Senaste händelser
          </div>
          <div className="space-y-1.5">
            {match.events.slice(0, 5).map(e => (
              <EventRow key={e.id} event={e} playerById={playerById} settings={settings} opponentLabel={opponentLabel} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <button onClick={onAskReset} className="text-xs underline" style={{ color: 'var(--ink-faint)' }}>
          Återställ matchen
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
      <PitchMarkings />
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(180deg, transparent 0, transparent 11.1%, rgba(255,255,255,0.025) 11.1%, rgba(255,255,255,0.025) 22.2%)',
      }} />
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
        <rect x="2" y="2" width="96" height="129" />
        <line x1="2" y1="66.5" x2="98" y2="66.5" />
        <circle cx="50" cy="66.5" r="9" />
        <circle cx="50" cy="66.5" r="0.8" fill="var(--pitch-line)" />
        <rect x="22" y="113" width="56" height="18" />
        <rect x="36" y="125" width="28" height="6" />
        <path d="M 41,113 A 9 9 0 0 0 59 113" />
        <circle cx="50" cy="121" r="0.8" fill="var(--pitch-line)" />
        <rect x="22" y="2" width="56" height="18" />
        <rect x="36" y="2" width="28" height="6" />
        <path d="M 41,20 A 9 9 0 0 1 59 20" />
        <circle cx="50" cy="12" r="0.8" fill="var(--pitch-line)" />
        <path d="M 2,4 A 2 2 0 0 0 4 2" />
        <path d="M 96,2 A 2 2 0 0 0 98 4" />
        <path d="M 2,129 A 2 2 0 0 1 4 131" />
        <path d="M 98,129 A 2 2 0 0 1 96 131" />
      </g>
    </svg>
  );
}

// Pitch chip — shows player FIRST NAME (instead of number) on a wider pill.
function PitchChip({ player, role, seconds, selected, onTap }) {
  const tint = ROLES[role]?.tint || '#3b82f6';
  return (
    <button
      onClick={onTap}
      className={`relative flex flex-col items-center gap-0.5 ${selected ? 'selected-ring' : ''}`}
      style={{ outline: 'none', borderRadius: 999 }}
    >
      <div
        className="rounded-full flex items-center justify-center display font-bold leading-none px-2"
        style={{
          minWidth: 52,
          maxWidth: 78,
          height: 28,
          background: 'white',
          color: 'var(--ink)',
          border: `2px solid ${selected ? 'var(--accent)' : tint}`,
          boxShadow: selected
            ? '0 4px 14px rgba(216, 80, 26, 0.45), 0 1px 2px rgba(0,0,0,0.2)'
            : '0 2px 6px rgba(0,0,0,0.25)',
          fontSize: 12,
          letterSpacing: '-0.01em',
        }}
      >
        <span className="truncate">{firstName(player.name)}</span>
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

function Bench({ bench, playerById, playingTime, selectedPlayerId, onSelectPlayer, squadSize }) {
  const sorted = useMemo(() => {
    return [...bench]
      .map(id => ({ id, time: playingTime[id] || 0, player: playerById.get(id) }))
      .filter(x => x.player)
      .sort((a, b) => a.time - b.time);
  }, [bench, playerById, playingTime]);

  if (squadSize === 0) {
    return (
      <div className="rounded-xl p-4 mb-3 text-center text-xs"
        style={{ background: 'var(--surface)', border: '1px dashed var(--border-strong)', color: 'var(--ink-muted)' }}>
        Ingen trupp för matchen — redigera matchen för att lägga till spelare.
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

// Bench chip — shows player FIRST NAME prominently on a pill (matches pitch chip style).
function BenchChip({ player, seconds, selected, onTap }) {
  return (
    <button
      onClick={onTap}
      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl shrink-0 ${selected ? 'selected-ring' : ''}`}
      style={{
        background: selected ? 'var(--accent-soft)' : 'var(--surface)',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        minWidth: 76,
        scrollSnapAlign: 'start',
      }}
    >
      <div
        className="rounded-full flex items-center justify-center display font-bold px-2"
        style={{
          minWidth: 60,
          maxWidth: 72,
          height: 28,
          background: selected ? 'var(--accent)' : 'var(--ink)',
          color: selected ? 'white' : 'var(--bg)',
          fontSize: 12,
          letterSpacing: '-0.01em',
        }}
      >
        <span className="truncate">{firstName(player.name)}</span>
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

function EventRow({ event, playerById, settings, opponentLabel }) {
  let icon, body;
  if (event.type === 'goal') {
    const isHome = event.team === 'home';
    icon = <GoalIcon size={13} style={{ color: isHome ? 'var(--accent)' : 'var(--ink-muted)' }} />;
    const scorer = playerById.get(event.scorerId);
    const assist = playerById.get(event.assistId);
    if (isHome && scorer) {
      body = <span><strong>Mål</strong> · {scorer.name}{assist ? <span style={{ color: 'var(--ink-faint)' }}> (ass: {assist.name})</span> : ''}</span>;
    } else {
      body = <span><strong>Mål</strong> · {isHome ? settings.homeTeam : (opponentLabel || settings.awayTeam)}</span>;
    }
  } else if (event.type === 'card') {
    const c = CARD_TYPES.find(c => c.value === event.cardType);
    icon = <Square size={11} fill={c?.color} style={{ color: c?.color }} />;
    const p = playerById.get(event.playerId);
    body = <span><strong>{c?.label}</strong>{p ? ` · ${p.name}` : ''}</span>;
  } else if (event.type === 'sub') {
    icon = <ArrowLeftRight size={13} style={{ color: 'var(--ink-muted)' }} />;
    const out = playerById.get(event.outId);
    const inP = playerById.get(event.inId);
    body = <span><strong>Byte</strong> · {out ? out.name : '—'} ut, {inP ? inP.name : '—'} in</span>;
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
// STATS VIEW (combines playing time + per-player stats)
// ===================================================================

function StatsView({ match, roster, settings, playerStats, playerById }) {
  if (!match) {
    return (
      <div className="px-4 pt-12 text-center">
        <div className="text-sm" style={{ color: 'var(--ink-muted)' }}>Ingen aktiv match.</div>
      </div>
    );
  }

  const onField = new Set(match.lineup.filter(Boolean));
  const squadSet = new Set(match.squad);
  // Only include players in the squad for this match's stats
  const squadPlayers = roster.filter(p => squadSet.has(p.id));

  // Live values — match clock + per-player playing time accruing in real-time.
  const liveClock = getLiveClockSeconds(match);
  const livePlayingTime = getLivePlayingTime(match);

  const playerData = useMemo(() => {
    return squadPlayers.map(p => ({
      ...p,
      seconds: livePlayingTime[p.id] || 0,
      onField: onField.has(p.id),
    })).sort((a, b) => b.seconds - a.seconds);
  }, [squadPlayers, livePlayingTime, match.lineup]);

  const totals = useMemo(() => {
    const list = playerData.map(p => p.seconds);
    if (list.length === 0) return { max: 0, min: 0, avg: 0 };
    return {
      max: Math.max(...list),
      min: Math.min(...list),
      avg: list.reduce((s, x) => s + x, 0) / list.length,
    };
  }, [playerData]);

  const opponentLabel = match.opponent || settings.awayTeam;
  const sortedByPoints = [...squadPlayers].sort((a, b) => {
    const sa = playerStats[a.id] || {}; const sb = playerStats[b.id] || {};
    return (sb.goals + sb.assists * 0.5) - (sa.goals + sa.assists * 0.5);
  });

  const homeGoals = match.events.filter(e => e.type === 'goal' && e.team === 'home').length;
  const cards = match.events.filter(e => e.type === 'card').length;
  const subs = match.events.filter(e => e.type === 'sub').length;

  return (
    <div className="px-4 pt-5">
      <h1 className="display text-3xl font-bold mb-1">Statistik</h1>
      <div className="text-xs mb-4" style={{ color: 'var(--ink-muted)' }}>
        {match.name} · {settings.homeTeam} vs {opponentLabel}
      </div>

      {/* Score summary */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-around">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Hemma</div>
            <div className="display tabular text-5xl font-bold">{match.homeScore}</div>
          </div>
          <div className="text-center px-3" style={{ color: 'var(--ink-faint)' }}>
            <div className="text-xs">Halvlek {match.half}</div>
            <div className="display tabular text-sm font-bold mt-1">{formatClock(liveClock)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Borta</div>
            <div className="display tabular text-5xl font-bold">{match.awayScore}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <MiniStat label="Mål oss" value={homeGoals} />
          <MiniStat label="Kort" value={cards} />
          <MiniStat label="Byten" value={subs} />
        </div>
      </div>

      {/* Playing time */}
      <div className="mb-1 flex items-center justify-between px-1">
        <h2 className="display text-lg font-bold">Speltid</h2>
        <div className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>
          per spelare
        </div>
      </div>
      {playerData.length === 0 ? (
        <div className="rounded-xl p-6 text-center text-sm mb-4" style={{ background: 'var(--surface)', border: '1px dashed var(--border-strong)', color: 'var(--ink-muted)' }}>
          Ingen trupp i denna match
        </div>
      ) : (
        <>
          <div className="space-y-1.5 mb-3">
            {playerData.map(p => {
              const pct = totals.max ? (p.seconds / totals.max) * 100 : 0;
              return (
                <div key={p.id}
                  className="relative overflow-hidden rounded-xl p-2.5 flex items-center gap-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="absolute inset-y-0 left-0" style={{
                    width: `${pct}%`,
                    background: p.onField ? 'rgba(216, 80, 26, 0.10)' : 'rgba(0,0,0,0.04)',
                  }} />
                  <div className="relative flex items-center gap-3 flex-1 min-w-0">
                    <div className="display tabular font-bold w-7 text-center" style={{ color: 'var(--ink-muted)', fontSize: 13 }}>
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
          <div className="grid grid-cols-3 gap-2 text-center mb-5">
            <Stat label="Mest" value={formatMin(totals.max)} />
            <Stat label="Snitt" value={formatMin(totals.avg)} />
            <Stat label="Minst" value={formatMin(totals.min)} />
          </div>
        </>
      )}

      {/* Per-player goals/cards */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3" style={{ color: 'var(--ink-faint)' }}>
          Mål · assist · kort
        </div>
        {squadPlayers.length === 0 ? (
          <div className="text-xs text-center py-2" style={{ color: 'var(--ink-muted)' }}>
            Ingen trupp
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 text-[10px] uppercase tracking-wider px-1 pb-2" style={{ color: 'var(--ink-faint)', borderBottom: '1px solid var(--border)' }}>
              <div className="col-span-7">Spelare</div>
              <div className="col-span-1 text-center">M</div>
              <div className="col-span-2 text-center">A</div>
              <div className="col-span-2 text-center">Kort</div>
            </div>
            {sortedByPoints.map(p => {
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

function Stat({ label, value }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--ink-faint)' }}>{label}</div>
      <div className="display tabular text-xl font-bold" style={{ color: 'var(--ink)' }}>{value}</div>
    </div>
  );
}

// ===================================================================
// ROSTER VIEW
// ===================================================================

function RosterView({ roster, coaches, onAdd, onUpdate, onRemove, onAddCoach, onUpdateCoach, onRemoveCoach }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addingCoach, setAddingCoach] = useState(false);
  const [editingCoachId, setEditingCoachId] = useState(null);
  const sorted = [...roster].sort((a, b) => Number(a.number || 0) - Number(b.number || 0));
  const sortedCoaches = [...coaches].sort((a, b) => a.name.localeCompare(b.name, 'sv'));

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="display text-3xl font-bold">Trupp & stab</h1>
          <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            {roster.length} spelare · {coaches.length} tränare
          </div>
        </div>
      </div>

      <div className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--surface)', color: 'var(--ink-muted)', border: '1px solid var(--border)' }}>
        Här är hela laguppställningen. Välj <strong>vilka som är med varje match</strong> under "Matcher".
      </div>

      {/* Players section */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: 'var(--ink-faint)' }}>
          Spelare ({roster.length})
        </div>
        <button
          onClick={() => setAdding(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <Plus size={12} /> Spelare
        </button>
      </div>

      {roster.length === 0 && !adding && (
        <div className="rounded-2xl p-6 text-center mb-4" style={{ background: 'var(--surface)', border: '1px dashed var(--border-strong)' }}>
          <Users size={24} className="mx-auto mb-2" style={{ color: 'var(--ink-faint)' }} />
          <div className="text-sm font-semibold mb-1">Inga spelare ännu</div>
          <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Lägg till spelare innan du sätter ihop en match
          </div>
        </div>
      )}

      {adding && (
        <PlayerForm onCancel={() => setAdding(false)} onSave={(p) => { onAdd(p); setAdding(false); }} />
      )}

      <div className="space-y-2 mb-6">
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

      {/* Coaches section */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: 'var(--ink-faint)' }}>
          Tränare & stab ({coaches.length})
        </div>
        <button
          onClick={() => setAddingCoach(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <Plus size={12} /> Tränare
        </button>
      </div>

      {coaches.length === 0 && !addingCoach && (
        <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px dashed var(--border-strong)' }}>
          <Users size={24} className="mx-auto mb-2" style={{ color: 'var(--ink-faint)' }} />
          <div className="text-sm font-semibold mb-1">Inga tränare ännu</div>
          <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Lägg till dig själv och eventuella assisterande
          </div>
        </div>
      )}

      {addingCoach && (
        <CoachForm onCancel={() => setAddingCoach(false)} onSave={(c) => { onAddCoach(c); setAddingCoach(false); }} />
      )}

      <div className="space-y-2">
        {sortedCoaches.map(c => (
          editingCoachId === c.id ? (
            <CoachForm
              key={c.id} initial={c}
              onCancel={() => setEditingCoachId(null)}
              onSave={(updates) => { onUpdateCoach(c.id, updates); setEditingCoachId(null); }}
              onRemove={() => { onRemoveCoach(c.id); setEditingCoachId(null); }}
            />
          ) : (
            <div key={c.id} className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="rounded-full flex items-center justify-center display font-bold shrink-0" style={{
                width: 36, height: 36, background: 'var(--ink)', color: 'var(--bg)', fontSize: 14,
              }}>
                {initials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{c.name}</div>
                {c.role && (
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-faint)' }}>
                    {c.role}
                  </div>
                )}
              </div>
              <button onClick={() => setEditingCoachId(c.id)} className="p-2" style={{ color: 'var(--ink-muted)' }} aria-label="Redigera">
                <Edit2 size={14} />
              </button>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function CoachForm({ initial, onSave, onCancel, onRemove }) {
  const [name, setName] = useState(initial?.name || '');
  const [role, setRole] = useState(initial?.role || '');
  const canSave = name.trim().length > 0;

  return (
    <div className="rounded-2xl p-4 mb-2" style={{ background: 'var(--surface)', border: '1.5px solid var(--accent)' }}>
      <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3" style={{ color: 'var(--accent)' }}>
        {initial ? 'Redigera tränare' : 'Ny tränare'}
      </div>
      <div className="space-y-2 mb-3">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Namn"
          className="w-full px-3 py-2.5 rounded-lg outline-none"
          style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}
        />
        <input
          value={role}
          onChange={e => setRole(e.target.value)}
          placeholder="Roll (valfritt) — t.ex. Huvudtränare"
          className="w-full px-3 py-2.5 rounded-lg outline-none"
          style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}
        />
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
          onClick={() => onSave({ name: name.trim(), role: role.trim() })}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold disabled:opacity-30"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          Spara
        </button>
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

function SettingsView({ settings, onChange, onAskReset, hasActiveMatch }) {
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
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-2" style={{ color: 'var(--ink-faint)' }}>Standard motståndare</label>
          <input
            value={settings.awayTeam}
            onChange={e => set('awayTeam', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg outline-none"
            style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}
          />
          <div className="text-[11px] mt-1" style={{ color: 'var(--ink-faint)' }}>
            Används om matchen inte har en egen motståndare angiven.
          </div>
        </div>
      </div>

      {hasActiveMatch && (
        <button
          onClick={onAskReset}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ border: '1px solid rgba(220, 38, 38, 0.4)', color: '#b91c1c' }}
        >
          <RotateCcw size={14} /> Återställ aktuell match
        </button>
      )}

      <div className="text-center text-[10px] mt-8 leading-relaxed" style={{ color: 'var(--ink-faint)' }}>
        Knatte Coach · v0.4<br/>
        Tränare, matchtid och plan
      </div>
    </div>
  );
}

// ===================================================================
// BOTTOM NAV
// ===================================================================

function BottomNav({ view, setView }) {
  const items = [
    { id: 'matches', icon: Calendar, label: 'Matcher' },
    { id: 'match', icon: Activity, label: 'Live' },
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
                style={{ background: active ? 'var(--ink)' : 'transparent', color: active ? 'var(--bg)' : 'var(--ink-muted)' }}
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
                <div key={i} className="absolute rounded-full" style={{
                  width: 10, height: 10,
                  left: `${pos.x * 100}%`, top: `${pos.y * 100}%`,
                  background: 'white', transform: 'translate(-50%, -50%)', border: '1px solid rgba(0,0,0,0.2)',
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
    </ModalShell>
  );
}

function GoalModal({ team, settings, match, playerById, onClose, onSave }) {
  const [scorerId, setScorerId] = useState(null);
  const [assistId, setAssistId] = useState(null);

  if (team === 'away') {
    return (
      <ModalShell title="Mål för motståndare" onClose={onClose}>
        <div className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>
          Lägg till mål för {match.opponent || settings.awayTeam}? Bortalagets spelarstatistik registreras inte.
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

  // Home goal — pick scorer + assist from this match's squad
  const squadPlayers = match.squad.map(id => playerById.get(id)).filter(Boolean);

  return (
    <ModalShell title="Mål för oss" onClose={onClose}>
      <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: 'var(--ink-faint)' }}>Målskytt</div>
      {squadPlayers.length === 0 ? (
        <div className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>
          Ingen trupp för matchen.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {squadPlayers.map(p => (
            <PlayerPickButton key={p.id} player={p} selected={scorerId === p.id} disabled={assistId === p.id} onClick={() => setScorerId(scorerId === p.id ? null : p.id)} />
          ))}
        </div>
      )}

      <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: 'var(--ink-faint)' }}>Assist (valfritt)</div>
      <div className="grid grid-cols-3 gap-1.5 mb-5">
        {squadPlayers.map(p => (
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

function CardModal({ match, playerById, onClose, onSave }) {
  const [cardType, setCardType] = useState('yellow');
  const [playerId, setPlayerId] = useState(null);
  const squadPlayers = match.squad.map(id => playerById.get(id)).filter(Boolean)
    .sort((a, b) => Number(a.number || 0) - Number(b.number || 0));

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
      {squadPlayers.length === 0 ? (
        <div className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>Ingen trupp för matchen.</div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 mb-5">
          {squadPlayers.map(p => (
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
      <span className="text-sm font-bold leading-tight truncate max-w-full">
        {firstName(player.name)}
      </span>
      <span className="text-[10px] tabular" style={{ color: 'var(--ink-muted)' }}>
        {player.number ? `#${player.number}` : ''}
      </span>
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
