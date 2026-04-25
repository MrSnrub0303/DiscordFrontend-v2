import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BackButton }    from './BackButton';
import { VolumeControl } from './VolumeControl';
import '../styles/RankedScreen.css';

import backgroundSpinner from '../assets/background-spinner.png';
import marbleBg          from '../assets/marblebg2.png';
import onGoingTitle      from '../assets/On-GoingTitle.png';
import inQueueTitle      from '../assets/In-QueueTitle.png';
import registerHereImg   from '../assets/RegisterHereRanked.png';

const POLL_MS        = 30_000;
const POLL_MS_FAST   =  3_000; // poll fast during startup / guard prompt

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

// ─── Ongoing matches panel ────────────────────────────────────────────────────

function OngoingPanel({ matches, loading }) {
  return (
    <div className="ranked-panel">
      <div className="ranked-panel-marble" style={{ backgroundImage: `url(${marbleBg})` }} />
      <img src={onGoingTitle} alt="On-Going" className="ranked-panel-title" />
      {loading && !matches.length && <p className="ranked-empty">Loading…</p>}
      {!loading && !matches.length && <p className="ranked-empty">No ongoing ranked matches</p>}
      <div className="ranked-panel-body">
        {matches.map(m => (
          <div key={m.matchId} className="ranked-match-row">
            <div className="ranked-match-meta">
              <span>{regionLabel(m.region)}</span>
              <span>·</span>
              <span>avg {m.avgElo || '—'}</span>
              {m.spectators > 0 && <><span>·</span><span>👁 {m.spectators}</span></>}
            </div>
            <div className="ranked-match-players">
              {m.players.map((p, i) => (
                <span key={i} className={`ranked-player-chip team-${p.team}`}>
                  {p.name || `#${p.profileId}`}
                  {p.elo ? <span className="ranked-player-elo"> {p.elo}</span> : null}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── In-queue panel ───────────────────────────────────────────────────────────

function InQueuePanel({ parties, loading, status }) {
  const totalPlayers = parties.reduce((s, p) => s + p.partySize, 0);
  return (
    <div className="ranked-panel">
      <div className="ranked-panel-marble" style={{ backgroundImage: `url(${marbleBg})` }} />
      <img src={inQueueTitle} alt="In-Queue" className="ranked-panel-title" />
      {status === 'initializing' && <p className="ranked-empty">Starting up…</p>}
      {status === 'ok' && !parties.length && <p className="ranked-empty">No parties in queue</p>}
      <div className="ranked-panel-body">
        {parties.map(p => (
          <div key={p.lobbyId} className="ranked-queue-row">
            <div className="ranked-queue-meta">
              <span className="ranked-queue-type">{queueLabel(p.partySize)}</span>
              <span>{regionLabel(p.region)}</span>
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
              <div className="ranked-team-elo-badge">Team ELO: {p.teamElo}</div>
            )}
          </div>
        ))}
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
  const [registerName, setRegisterName] = useState('');
  const [guardCode,    setGuardCode]    = useState('');
  const [guardSubmitting, setGuardSubmitting] = useState(false);
  const [guardError,   setGuardError]   = useState('');

  const pollRef = useRef(null);

  const fetchOngoing = useCallback(async () => {
    try {
      const r = await fetch('/api/ranked/ongoing', { cache: 'no-store' });
      if (!r.ok) return;
      const data = await r.json();
      if (data.success) setMatches(data.matches ?? []);
    } catch {}
    setLoadingMatch(false);
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const r = await fetch('/api/ranked/queue', { cache: 'no-store' });
      if (!r.ok) return;
      const data = await r.json();
      setParties(data.parties ?? []);
      setQueueStatus(data.status ?? 'ok');
    } catch {}
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

  const submitGuardCode = async () => {
    if (!guardCode.trim()) return;
    setGuardSubmitting(true);
    setGuardError('');
    try {
      const r = await fetch('/api/ranked/steam-guard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: guardCode.trim() }),
      });
      const data = await r.json();
      if (data.success) {
        setGuardCode('');
        setQueueStatus('initializing');
        setTimeout(fetchQueue, 3000); // re-poll after auth completes
      } else {
        setGuardError(data.error || 'Failed — check code and try again');
      }
    } catch {
      setGuardError('Request failed');
    }
    setGuardSubmitting(false);
  };

  return (
    <div className="ranked-screen">
      <div className="ranked-bg" style={{ backgroundImage: `url(${backgroundSpinner})` }} />

      {/* Steam Guard overlay */}
      {queueStatus === 'needs_guard_code' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(20,15,5,0.97)', border: '1px solid rgba(200,164,32,0.6)', borderRadius: 10, padding: '32px 40px', maxWidth: 380, width: '90%', textAlign: 'center', fontFamily: '"Trajan Pro Bold", serif' }}>
            <p style={{ color: '#ffd700', fontSize: '1.1rem', marginBottom: 8 }}>Steam Guard Required</p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', marginBottom: 20 }}>
              Check your Steam mobile app for a 5-digit code and enter it below.
            </p>
            <input
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', fontSize: '1.1rem', letterSpacing: 6, textAlign: 'center', fontFamily: '"Trajan Pro Bold", serif', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(200,164,32,0.4)', borderRadius: 6, color: '#fff', outline: 'none', marginBottom: 12 }}
              placeholder="XXXXX"
              maxLength={8}
              value={guardCode}
              onChange={e => setGuardCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && submitGuardCode()}
              autoFocus
            />
            {guardError && <p style={{ color: '#ffb3b3', fontSize: '0.8rem', marginBottom: 10 }}>{guardError}</p>}
            <button
              onClick={submitGuardCode}
              disabled={guardSubmitting || !guardCode.trim()}
              style={{ padding: '10px 28px', background: 'rgba(200,164,32,0.2)', border: '1px solid rgba(200,164,32,0.5)', borderRadius: 6, color: '#ffd700', fontFamily: '"Trajan Pro Bold", serif', fontSize: '0.95rem', cursor: 'pointer', opacity: guardSubmitting ? 0.6 : 1 }}
            >
              {guardSubmitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      )}

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
          <OngoingPanel matches={matches} loading={loadingMatch} />
          <InQueuePanel parties={parties} loading={loadingQueue} status={queueStatus} />
        </div>

        {/* Register Here */}
        <div className="ranked-register-panel">
          <img src={registerHereImg} alt="Register Here" className="ranked-register-img" />
          <div className="ranked-register-input-area">
            <input
              className="ranked-register-input"
              placeholder="Enter your in-game name…"
              value={registerName}
              onChange={e => setRegisterName(e.target.value)}
            />
            <button
              className="ranked-register-btn"
              onClick={() => { if (playClickSound) playClickSound(); }}
              onMouseEnter={() => { if (playHoverSound) playHoverSound(); }}
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
