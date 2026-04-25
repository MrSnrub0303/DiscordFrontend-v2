import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BackButton }    from './BackButton';
import { VolumeControl } from './VolumeControl';
import '../styles/RankedScreen.css';

import backgroundSpinner from '../assets/background-spinner.png';
import marbleBg          from '../assets/marblebg2.png';
import onGoingTitle      from '../assets/On-GoingTitle.png';
import inQueueTitle      from '../assets/In-QueueTitle.png';
import registerHereImg   from '../assets/RegisterHereRanked.png';

const POLL_MS = 30_000;

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

  useEffect(() => {
    fetchOngoing();
    fetchQueue();
    pollRef.current = setInterval(() => {
      fetchOngoing();
      fetchQueue();
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
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
