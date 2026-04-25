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

function InQueuePanel({ parties, loading, status, onSubmitGuard }) {
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
      <img src={inQueueTitle} alt="In-Queue" className="ranked-panel-title" />

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
          <OngoingPanel matches={matches} loading={loadingMatch} />
          <InQueuePanel
            parties={parties}
            loading={loadingQueue}
            status={queueStatus}
            onSubmitGuard={() => { setQueueStatus('initializing'); setTimeout(fetchQueue, 2000); }}
          />
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
