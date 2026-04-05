import React, { useState, useEffect, useCallback } from 'react';
import '../styles/EventsScreen.css';
import btnNormal from '../assets/combobox_button_normal.png';
import topBarBg from '../assets/marblebg2.png';
import soundOnIcon from '../assets/notification_sound_on.png';
import soundOffIcon from '../assets/notification_sound_off.png';
import aoe3Logo from '../assets/aoe3_de_logo.png';
import backgroundSpinner from '../assets/background-spinner.png';
import registerPanel from '../assets/RegisterHerePanel.png';
import nicknameBg from '../assets/uiskirmishnickname_textentry.png';

const AOE3_API = 'https://api.aoe3explorer.com';

async function lookupPlayer(username) {
  const url = `${AOE3_API}/players?name=like.*${encodeURIComponent(username)}*&limit=1`;
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) throw new Error(`Player lookup failed (${resp.status})`);
  const data = await resp.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error(`Player "${username}" not found`);
  return data[0]; // { gameId, name, ... }
}

async function fetchPlayerWins(playerId) {
  const url =
    `${AOE3_API}/rpc/get_player_match_history_v2_legacy` +
    `?p_player_id=${playerId}&p_limit=200&p_offset=0` +
    `&type=eq.3vs3%20Supremacy&isRanked=eq.true` +
    `&date=gte.1775174400&date=lt.1775952000`;

  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) throw new Error(`Match history fetch failed (${resp.status})`);
  const matches = await resp.json();
  if (!Array.isArray(matches)) return 0;

  const pid = String(playerId);
  let qualifyingWins = 0;

  for (const match of matches) {
    const winners = match.winnersStats;
    const losers = match.losersStats;
    if (!Array.isArray(winners) || !Array.isArray(losers)) continue;

    const won = winners.some((p) => String(p.playerId) === pid);
    if (!won) continue;

    // Elo Gained = (W_elo - L_elo) × (1/25) + 16
    const wElo = winners.reduce((sum, p) => sum + (p.elo || 0), 0);
    const lElo = losers.reduce((sum, p) => sum + (p.elo || 0), 0);
    const eloGain = (wElo - lElo) * (1 / 25) + 16;

    if (eloGain >= 5) qualifyingWins++;
  }

  return qualifyingWins;
}

export function EventsScreen({ onBackClick, onBackHover, onBackPress, musicEnabled, onToggleMusic }) {
  const [players, setPlayers] = useState([]);
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    try {
      const resp = await fetch('/api/events/leaderboard');
      if (!resp.ok) return;
      const data = await resp.json();
      if (data.success) setPlayers(data.players);
    } catch {
      // server not available — leaderboard stays empty
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleRegister = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    setIsRegistering(true);
    setRegisterError('');
    setRegisterSuccess('');

    try {
      // 1. Look up player directly from AoE3 Explorer
      const player = await lookupPlayer(trimmed);
      const playerId = player.gameId;
      const playerName = player.name ?? trimmed;

      if (!playerId) throw new Error('Could not determine player ID');

      // 2. Calculate qualifying wins directly from AoE3 Explorer
      const wins = await fetchPlayerWins(playerId);

      // 3. Save to server (for shared persistence)
      const resp = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: String(playerId), name: playerName, wins }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          setRegisterSuccess(`${playerName} registered — ${wins} qualifying win${wins !== 1 ? 's' : ''}!`);
          setUsername('');
          await fetchLeaderboard();
          return;
        }
      }

      // Server unavailable — show result without persisting
      setRegisterSuccess(`${playerName} — ${wins} qualifying win${wins !== 1 ? 's' : ''} (server offline, not saved).`);
      setUsername('');
    } catch (err) {
      setRegisterError(err.message || 'Registration failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isRegistering) handleRegister();
  };

  return (
    <div
      className="events-screen-container"
      style={{ backgroundImage: `url(${backgroundSpinner})` }}
    >
      {/* Music toggle */}
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 999 }}>
        <button
          onClick={onToggleMusic}
          style={{
            width: 44,
            height: 44,
            padding: 6,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
          aria-label={musicEnabled ? 'Turn music off' : 'Turn music on'}
          title={musicEnabled ? 'Music On (click to mute)' : 'Music Off (click to enable)'}
        >
          <img
            src={musicEnabled ? soundOnIcon : soundOffIcon}
            alt={musicEnabled ? 'music on' : 'music off'}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </button>
      </div>

      {/* Marble top bar */}
      <div
        className="events-screen-header"
        style={{ backgroundImage: `url(${topBarBg})` }}
      >
        <button
          className="events-back-button"
          onClick={onBackPress ? () => onBackPress(onBackClick) : onBackClick}
          onMouseEnter={onBackHover}
          aria-label="Back to home"
          style={{ backgroundImage: `url(${btnNormal})` }}
        >
          <span className="back-arrow">←</span>
          Back
        </button>
        <h1 className="events-title">Events</h1>
      </div>

      {/* AoE3 logo bottom-left */}
      <img
        src={aoe3Logo}
        alt="Age of Empires III DE"
        style={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          width: '16vw',
          height: 'auto',
          zIndex: 999,
          pointerEvents: 'none',
        }}
      />

      {/* Main content */}
      <div className="events-screen-content">
        <div className="events-center-column">

          {/* ── Leaderboard ── */}
          <div className="events-leaderboard">
            <div className="events-leaderboard-header">
              <span className="events-lb-col-rank">#</span>
              <span className="events-lb-col-name">Player</span>
              <span className="events-lb-col-wins">Qualifying Wins</span>
            </div>
            <div className="events-leaderboard-body">
              {players.length === 0 ? (
                <div className="events-lb-empty">No players registered yet.</div>
              ) : (
                players.map((p, i) => (
                  <div
                    key={p.playerId}
                    className={`events-lb-row${i === 0 ? ' events-lb-row--gold' : i === 1 ? ' events-lb-row--silver' : i === 2 ? ' events-lb-row--bronze' : ''}`}
                  >
                    <span className="events-lb-col-rank">{i + 1}</span>
                    <span className="events-lb-col-name">{p.name}</span>
                    <span className="events-lb-col-wins">{p.wins}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Register Here Panel ── */}
          <div className="events-register-panel">
            <img
              src={registerPanel}
              alt="Register Here"
              className="events-register-panel-img"
              draggable={false}
            />
            <div className="events-register-input-area">
              {registerSuccess && (
                <div className="events-register-feedback events-register-feedback--success">
                  {registerSuccess}
                </div>
              )}
              {registerError && (
                <div className="events-register-feedback events-register-feedback--error">
                  {registerError}
                </div>
              )}
              <div className="events-register-row">
                <input
                  className="events-register-input"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setRegisterError('');
                    setRegisterSuccess('');
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isRegistering}
                  placeholder="Enter in-game username..."
                  style={{ backgroundImage: `url(${nicknameBg})` }}
                />
                <button
                  className="events-register-button"
                  onClick={handleRegister}
                  disabled={isRegistering || !username.trim()}
                  style={{ backgroundImage: `url(${btnNormal})` }}
                >
                  {isRegistering ? 'Registering...' : 'Register'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
