import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BackButton }    from './BackButton';
import { VolumeControl } from './VolumeControl';
import '../styles/RankedScreen.css';

import backgroundSpinner from '../assets/background-spinner.png';
import marbleBg          from '../assets/marblebg2.png';
import onGoingTitle      from '../assets/On-GoingTitle.png';
import inQueueTitle      from '../assets/In-QueueTitle.png';
import registerHereImg   from '../assets/RegisterHereRanked.png';
import nicknameBg        from '../assets/uiskirmishnickname_textentry.png';
import flagRussian       from '../assets/flag_hc_russian.png';
import flagSioux         from '../assets/flag_hc_sioux.png';
import flagSpanish       from '../assets/flag_hc_spanish.png';
import flagSwedish       from '../assets/flag_hc_swedish.png';

const BUNDLED_FLAGS = { russian: flagRussian, sioux: flagSioux, spanish: flagSpanish, swedish: flagSwedish };
import btnNormal         from '../assets/ButtonRedAvailable.png';
import btnClicked        from '../assets/ButtonRedClicked.png';

const POLL_MS        = 30_000;
const POLL_MS_FAST   =  3_000;

const REGION_SHORT = {
  ukwest:             'UK West',
  westeurope:         'W. Europe',
  eastus:             'East US',
  westus3:            'West US',
  southcentralus:     'S. Central US',
  australiasoutheast: 'Australia',
  southeastasia:      'SE Asia',
  koreacentral:       'Korea',
  centralindia:       'India',
  brazilsouth:        'Brazil',
  chilecentral:       'Chile',
  italynorth:         'Italy',
  germanywestcentral: 'Germany',
};
const regionLabel = r => REGION_SHORT[r] ?? r ?? '—';
const queueLabel  = size => size === 1 ? '1v1' : `${size}v${size}`;

// Relic civ ID → { name, flagFile }
const CIV_MAP = {
  0:  { name: 'Random',        flag: 'random' },
  1:  { name: 'Spanish',       flag: 'spanish' },
  2:  { name: 'British',       flag: 'british' },
  3:  { name: 'French',        flag: 'french' },
  4:  { name: 'Portuguese',    flag: 'portuguese' },
  5:  { name: 'Dutch',         flag: 'dutch' },
  6:  { name: 'Russian',       flag: 'russian' },
  7:  { name: 'German',        flag: 'german' },
  8:  { name: 'Ottoman',       flag: 'ottoman' },
  9:  { name: 'Haudenosaunee', flag: 'iroquois' },  // swapped
  10: { name: 'Lakota',        flag: 'sioux' },      // swapped
  11: { name: 'Aztec',         flag: 'aztec' },
  12: { name: 'Japanese',      flag: 'japanese' },
  13: { name: 'Chinese',       flag: 'chinese' },
  14: { name: 'Indian',        flag: 'indian' },
  15: { name: 'Inca',          flag: 'inca' },
  16: { name: 'Swedes',        flag: 'swedish' },
  17: { name: 'American',      flag: 'american' },
  18: { name: 'Ethiopian',     flag: 'ethiopian' },
  19: { name: 'Hausa',         flag: 'hausa' },
  20: { name: 'Mexican',       flag: 'mexican' },
  21: { name: 'Italian',       flag: 'italian' },
  22: { name: 'Maltese',       flag: 'maltese' },
  23: { name: 'Danish',        flag: 'danish' },
  24: { name: 'Polish',        flag: 'polish' },
};

function civInfo(id) {
  return CIV_MAP[id] ?? { name: `Civ ${id}`, flag: null };
}

function CivFlag({ civId }) {
  const { name, flag } = civInfo(civId);
  const [broken, setBroken] = React.useState(false);
  if (!flag || broken) return <span className="ranked-civ-name">{name}</span>;
  const src = BUNDLED_FLAGS[flag] ?? `/civ-spinner/flag_hc_${flag}.png`;
  return (
    <img
      src={src}
      alt={name}
      title={name}
      className="ranked-civ-flag"
      onError={() => setBroken(true)}
    />
  );
}

function elapsed(startDate) {
  if (!startDate) return '—';
  const secs = Math.floor((Date.now() - new Date(startDate).getTime()) / 1000);
  if (secs < 0) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Ongoing matches panel ────────────────────────────────────────────────────

const avgTeamElo = players => {
  const elos = players.map(p => p.elo).filter(e => e != null);
  return elos.length ? Math.round(elos.reduce((a, b) => a + b, 0) / elos.length) : null;
};

const eloBadgeStyle = gain => ({
  fontFamily: '"Trajan Pro Bold", serif',
  fontSize: '0.68rem',
  color: gain > 16 ? '#f0a8a8' : gain < 16 ? '#a8d8f0' : '#ffd700',
  border: '1px solid rgba(255,215,0,0.3)',
  borderRadius: 3,
  padding: '1px 5px',
});

function OngoingPanel({ matches, loading, registeredUser, eloGain }) {
  // Tick every second so elapsed times update live
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="ranked-panel">
      <div className="ranked-panel-marble" style={{ backgroundImage: `url(${marbleBg})` }} />
      <img src={onGoingTitle} alt="On-Going" className="ranked-panel-title ranked-panel-title--sm" />
      {loading && !matches.length && <p className="ranked-empty">Loading…</p>}
      {!loading && !matches.length && <p className="ranked-empty">No ongoing ranked matches</p>}
      <div className="ranked-panel-body">
        {matches.map(m => {
          const teamA = m.players.filter(p => p.team === 0);
          const teamB = m.players.filter(p => p.team === 1);
          const partySize = Math.max(teamA.length, teamB.length);
          const myElo = registeredUser
            ? (partySize === 1 ? registeredUser.soloElo : registeredUser.teamElo)
            : null;
          const gainVsA = myElo != null ? eloGain(myElo, avgTeamElo(teamA)) : null;
          const gainVsB = myElo != null ? eloGain(myElo, avgTeamElo(teamB)) : null;
          return (
            <div key={m.matchId} className="ranked-match-row">
              <div className="ranked-match-meta">
                <span>{regionLabel(m.region)}</span>
                <span>·</span>
                <span>{elapsed(m.startDate)}</span>
                {m.spectators > 0 && <><span>·</span><span>👁 {m.spectators}</span></>}
                {(gainVsA != null || gainVsB != null) && (
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {gainVsA != null && <span style={eloBadgeStyle(gainVsA)}>+{gainVsA} ELO</span>}
                    {gainVsB != null && <span style={eloBadgeStyle(gainVsB)}>+{gainVsB} ELO</span>}
                  </span>
                )}
              </div>
              <div className="ranked-match-teams">
                {/* Team A — left */}
                <div className="ranked-match-team">
                  {teamA.map((p, i) => (
                    <div key={i} className="ranked-match-player team-0">
                      <CivFlag civId={p.civ} />
                      <span className="ranked-match-player-name">{p.name || `#${p.profileId}`}</span>
                      {p.elo != null && <span className="ranked-player-elo">{p.elo}</span>}
                    </div>
                  ))}
                </div>
                <div className="ranked-match-vs">vs</div>
                {/* Team B — right */}
                <div className="ranked-match-team ranked-match-team--right">
                  {teamB.map((p, i) => (
                    <div key={i} className="ranked-match-player team-1">
                      {p.elo != null && <span className="ranked-player-elo">{p.elo}</span>}
                      <span className="ranked-match-player-name">{p.name || `#${p.profileId}`}</span>
                      <CivFlag civId={p.civ} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── In-queue panel ───────────────────────────────────────────────────────────

function InQueuePanel({ parties, loading, status, onSubmitGuard, registeredUser, eloGain, userTeamTotal }) {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const [guardCode,    setGuardCode]    = React.useState('');
  const [guardBusy,    setGuardBusy]    = React.useState(false);
  const [guardMsg,     setGuardMsg]     = React.useState('');
  const totalPlayers = parties.reduce((s, p) => s + p.partySize, 0);

  const submitGuard = async () => {
    if (!guardCode.trim()) return;
    setGuardBusy(true);
    setGuardMsg('');
    try {
      const r = await fetch('/api/ranked/steam-guard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: guardCode.trim() }),
      });
      // Read raw text first so a non-JSON error page doesn't throw
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch { data = null; }
      if (!r.ok) {
        setGuardMsg(`Server error ${r.status}${data?.error ? ': ' + data.error : ''}`);
      } else if (data?.success) {
        setGuardMsg('✓ Code accepted — queue starting…');
        setGuardCode('');
        if (onSubmitGuard) onSubmitGuard();
      } else {
        setGuardMsg(data?.error || 'Failed — try again');
      }
    } catch (e) {
      setGuardMsg('Network error — check console');
      console.error('[RankedScreen] steam-guard POST failed:', e);
    }
    setGuardBusy(false);
  };

  // Show Guard input when server signals it, or after 8s of initializing (fetch may be failing silently)
  const [initSec, setInitSec] = React.useState(0);
  React.useEffect(() => {
    if (status !== 'initializing') { setInitSec(0); return; }
    const t = setInterval(() => setInitSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);
  const showGuard = status === 'needs_guard_code' || (status === 'initializing' && initSec >= 8);

  return (
    <div className="ranked-panel">
      <div className="ranked-panel-marble" style={{ backgroundImage: `url(${marbleBg})` }} />
      <img src={inQueueTitle} alt="In-Queue" className="ranked-panel-title ranked-panel-title--sm" />

      {/* Steam Guard input — shown inline when server needs the code */}
      {showGuard && (
        <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <p style={{ color: '#ffd700', fontFamily: '"Trajan Pro Bold", serif', fontSize: '0.82rem', margin: 0 }}>Steam Guard Required</p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontFamily: '"Trajan Pro", serif', fontSize: '0.72rem', margin: 0 }}>
            Enter the code from your Steam mobile app:
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              style={{ flex: 1, padding: '7px 10px', fontSize: '1rem', letterSpacing: 4, textAlign: 'center', fontFamily: 'monospace', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(200,164,32,0.4)', borderRadius: 5, color: '#fff', outline: 'none' }}
              placeholder="XXXXX"
              maxLength={8}
              value={guardCode}
              onChange={e => setGuardCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && submitGuard()}
            />
            <button
              onClick={submitGuard}
              disabled={guardBusy || !guardCode.trim()}
              style={{ padding: '7px 14px', background: 'rgba(200,164,32,0.2)', border: '1px solid rgba(200,164,32,0.5)', borderRadius: 5, color: '#ffd700', fontFamily: '"Trajan Pro Bold", serif', fontSize: '0.82rem', cursor: 'pointer', opacity: guardBusy ? 0.6 : 1, whiteSpace: 'nowrap' }}
            >
              {guardBusy ? '…' : 'Submit'}
            </button>
          </div>
          {guardMsg && <p style={{ color: guardMsg.startsWith('✓') ? '#a8f0a8' : '#ffb3b3', fontSize: '0.75rem', fontFamily: '"Trajan Pro", serif', margin: 0 }}>{guardMsg}</p>}
        </div>
      )}

      {!showGuard && status === 'initializing' && <p className="ranked-empty">Starting up…</p>}
      {!showGuard && status === 'ok' && !parties.length && <p className="ranked-empty">No parties in queue</p>}

      <div className="ranked-panel-body">
        {parties.map(p => {
          const myElo   = p.partySize === 1 ? registeredUser?.soloElo : userTeamTotal;
          const oppElo  = p.partySize === 1 ? p.players[0]?.elo : p.teamElo;
          const gain    = registeredUser ? eloGain(myElo, oppElo) : null;
          return (
          <div key={p.lobbyId} className="ranked-queue-row">
            <div className="ranked-queue-meta">
              {/* Left: region · time */}
              <span className="ranked-queue-meta-left">
                {regionLabel(p.region)}{p.firstSeen ? ` · ${elapsed(new Date(p.firstSeen))}` : ''}
              </span>
              {/* Centre: queue type (like "vs" in On-Going) */}
              <span className="ranked-queue-type">{queueLabel(p.partySize)}</span>
              {/* Right: ELO gain badge */}
              <span className="ranked-queue-meta-right">
                {gain !== null && (
                  <span style={{ fontFamily: '"Trajan Pro Bold", serif', fontSize: '0.68rem', color: gain > 16 ? '#f0a8a8' : gain < 16 ? '#a8d8f0' : '#ffd700', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 3, padding: '1px 5px' }}>
                    +{gain} ELO
                  </span>
                )}
              </span>
            </div>
            <div className="ranked-queue-players">
              {p.players.map((pl, i) => (
                <div key={i} className="ranked-queue-player">
                  <span className="ranked-queue-player-name">
                    {pl.alias || `#${pl.profileId}`}
                  </span>
                  {pl.hasElo
                    ? <span className="ranked-queue-player-elo">{pl.elo}</span>
                    : <span className="ranked-queue-player-elo no-elo">
                        No {p.partySize === 1 ? '1v1' : 'team'} ELO
                      </span>
                  }
                </div>
              ))}
            </div>
            {p.partySize > 1 && p.teamElo != null && (
              <div className="ranked-team-elo-badge">Avg ELO: {p.teamElo}</div>
            )}
          </div>
          );
        })}
      </div>
      <div className="ranked-status-tag">
        {loading
          ? 'Updating…'
          : parties.length
            ? `${parties.length} parties · ${totalPlayers} players`
            : ''}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RankedScreen({
  onBack,
  onBackHover,
  musicEnabled,
  onToggleMusic,
  musicVolume,
  onVolumeChange,
  playClickSound,
  playHoverSound,
  isMobile,
}) {
  const [matches,      setMatches]      = useState([]);
  const [parties,      setParties]      = useState([]);
  const [queueStatus,  setQueueStatus]  = useState('initializing');
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [registerName,   setRegisterName]   = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);
  const [registerStatus, setRegisterStatus] = useState('');
  const [registerBusy,   setRegisterBusy]   = useState(false);
  const [regBtnPressed,  setRegBtnPressed]  = useState(false);

  const handleRegister = async () => {
    if (!registerName.trim() || registerBusy) return;
    if (playClickSound) playClickSound();
    setRegisterBusy(true);
    setRegisterStatus('Looking up…');
    try {
      const r = await fetch(`/api/ranked/find-player?alias=${encodeURIComponent(registerName.trim())}`);
      const data = await r.json();
      if (data.found) {
        setRegisteredUser(data);
        setRegisterStatus(`✓ ${data.alias} — Solo: ${data.soloElo ?? 'N/A'}  Team: ${data.teamElo ?? 'N/A'}`);
      } else {
        setRegisterStatus('Player not found — check spelling');
      }
    } catch {
      setRegisterStatus('Lookup failed');
    }
    setRegisterBusy(false);
  };

  // ELO gain formula: (L_elo − W_elo) / 25 + 16, clamped ≥ 0
  // L = loser (opponent), W = winner (us)
  const eloGain = (myElo, oppElo) => {
    if (!myElo || !oppElo) return null;
    return Math.max(0, Math.round((oppElo - myElo) / 25 + 16));
  };

  // For team games: average team ELO — actual queue party takes priority over simulated team
  const userTeamTotal = React.useMemo(() => {
    if (!registeredUser?.teamElo) return null;
    const myParty = parties.find(p =>
      p.partySize > 1 && p.players.some(pl => pl.profileId === registeredUser.profileId)
    );
    if (myParty) {
      const elos = myParty.players.map(pl =>
        pl.profileId === registeredUser.profileId ? (registeredUser.teamElo ?? 0) : (pl.elo ?? 0)
      ).filter(e => e > 0);
      return elos.length ? Math.round(elos.reduce((a, b) => a + b, 0) / elos.length) : registeredUser.teamElo;
    }
    // No actual party found — use registered user's individual team ELO
    return registeredUser.teamElo;
  }, [registeredUser, parties]);

  const pollRef = useRef(null);

  const fetchOngoing = useCallback(async () => {
    try {
      const r = await fetch('/api/ranked/ongoing', { cache: 'no-store' });
      if (!r.ok) return;
      const data = await r.json();
      if (data.success) setMatches(data.matches ?? []);
    } catch (e) { console.warn('[RankedScreen] fetchOngoing:', e.message); }
    setLoadingMatch(false);
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const r = await fetch('/api/ranked/queue', { cache: 'no-store' });
      const text = await r.text();
      if (!r.ok) {
        console.warn('[RankedScreen] /api/ranked/queue returned', r.status, text.slice(0, 200));
        return;
      }
      const data = JSON.parse(text);
      setParties(data.parties ?? []);
      setQueueStatus(data.status ?? 'ok');
    } catch (e) {
      console.warn('[RankedScreen] fetchQueue error:', e.message);
    }
    setLoadingQueue(false);
  }, []);

  // Fast-poll during initializing / guard prompt, normal poll once running
  useEffect(() => {
    const needsFast = queueStatus === 'initializing' || queueStatus === 'needs_guard_code';
    clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchQueue, needsFast ? POLL_MS_FAST : POLL_MS);
  }, [queueStatus, fetchQueue]);

  useEffect(() => {
    fetchOngoing();
    fetchQueue();
    const ongoingInterval = setInterval(fetchOngoing, POLL_MS);
    return () => {
      clearInterval(pollRef.current);
      clearInterval(ongoingInterval);
    };
  }, [fetchOngoing, fetchQueue]);

  return (
    <div className="ranked-screen">
      <div className="ranked-bg" style={{ backgroundImage: `url(${backgroundSpinner})` }} />

      {/* Header row */}
      <div className="ranked-header" style={isMobile ? { paddingTop: 52 } : {}}>
        <BackButton onClick={onBack} onMouseEnter={onBackHover} />
        <VolumeControl
          musicEnabled={musicEnabled}
          onToggleMusic={onToggleMusic}
          volume={musicVolume}
          onVolumeChange={onVolumeChange}
        />
      </div>

      {/* Main panels */}
      <div className="ranked-content">
        <div className="ranked-panels-row">
          <OngoingPanel matches={matches} loading={loadingMatch} registeredUser={registeredUser} eloGain={eloGain} />
          <InQueuePanel
            parties={parties}
            loading={loadingQueue}
            status={queueStatus}
            onSubmitGuard={() => { setQueueStatus('initializing'); setTimeout(fetchQueue, 2000); }}
            registeredUser={registeredUser}
            eloGain={eloGain}
            userTeamTotal={userTeamTotal}
          />
        </div>

        {/* Register Here */}
        <div className="ranked-register-panel">
          <div className="ranked-panel-marble" style={{ backgroundImage: `url(${marbleBg})` }} />
          <img src={registerHereImg} alt="Register Here" className="ranked-register-title" />
          <div className="ranked-register-row">
            <input
              className="events-register-input"
              placeholder="Enter your in-game name…"
              value={registerName}
              onChange={e => { setRegisterName(e.target.value); setRegisterStatus(''); }}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              style={{ backgroundImage: `url(${nicknameBg})` }}
              disabled={registerBusy}
            />
            <button
              className="events-register-button"
              onClick={handleRegister}
              onMouseEnter={() => playHoverSound?.()}
              onMouseDown={() => setRegBtnPressed(true)}
              onMouseUp={() => setRegBtnPressed(false)}
              onMouseLeave={() => setRegBtnPressed(false)}
              disabled={registerBusy}
              style={{ backgroundImage: `url(${regBtnPressed ? btnClicked : btnNormal})`, padding: '0 16px 5px 16px' }}
            >
              {registerBusy ? '…' : 'Register'}
            </button>
          </div>
          {registerStatus && (
            <p style={{ position: 'relative', zIndex: 1, margin: '4px 0 0', fontFamily: '"Trajan Pro", serif', fontSize: '0.75rem', color: registeredUser ? '#a8f0a8' : '#ffb3b3', textAlign: 'center' }}>
              {registerStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
