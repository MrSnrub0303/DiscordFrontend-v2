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
import leaderboardBg from '../assets/event_leaderboard.png';

// GGplz Challenge – Spring Rabbit Hunt (Apr 14 2026 → May 1 2026 10:00 PM PST)
const TOURNAMENT_END = new Date(1777701600 * 1000); // 2026-05-02 06:00 UTC

function useEventCountdown(endDate) {
  const [remaining, setRemaining] = useState(() => {
    const diff = endDate - Date.now();
    if (diff <= 0) return null;
    return {
      days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours:   Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  });
  useEffect(() => {
    const id = setInterval(() => {
      const diff = endDate - Date.now();
      if (diff <= 0) { setRemaining(null); return; }
      setRemaining({
        days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(id);
  }, [endDate]);
  return remaining;
}

export function EventsScreen({ onBackClick, onBackHover, onBackPress, musicEnabled, onToggleMusic, initialPlayers = [] }) {
  const [players, setPlayers] = useState(initialPlayers);
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const countdown = useEventCountdown(TOURNAMENT_END);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const resp = await fetch('/api/events/leaderboard', { cache: 'no-store' });
      if (!resp.ok) return [];
      const data = await resp.json();
      if (data.success) {
        setPlayers(data.players);
        return data.players;
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const current = await fetchLeaderboard();
      if (!current.length) return;
      setIsRefreshing(true);
      await fetch('/api/events/refresh-all', { method: 'POST' }).catch(() => {});
      await fetchLeaderboard();
      setIsRefreshing(false);
    };
    init();
  }, [fetchLeaderboard]);

  const handleRegister = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    setIsRegistering(true);
    setRegisterError('');
    setRegisterSuccess('');

    try {
      const resp = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      });

      const rawText = await resp.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server error (${resp.status}) — please try again.`);
      }

      if (!resp.ok || !data.success) {
        setRegisterError(data?.error || 'Registration failed.');
        return;
      }

      const { player } = data;
      setRegisterSuccess(
        `${player.name} registered — best streak: ${player.wins}!`
      );
      setUsername('');
      await fetchLeaderboard();
    } catch (err) {
      setRegisterError(err.message || 'Could not connect to server.');
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
        <h1 className="events-title">GGplz Challenge – Spring Rabbit Hunt</h1>
      </div>

      {/* Bottom-left: countdown timer stacked above AoE3 logo */}
      <div style={{ position: 'fixed', bottom: 16, left: 16, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, pointerEvents: 'none' }}>
        {countdown && (
          <div className="events-countdown-corner">
            <span className="events-countdown-unit">
              <span className="events-countdown-value">{String(countdown.days).padStart(2, '0')}</span>
              <span className="events-countdown-unit-label">d</span>
            </span>
            <span className="events-countdown-sep">:</span>
            <span className="events-countdown-unit">
              <span className="events-countdown-value">{String(countdown.hours).padStart(2, '0')}</span>
              <span className="events-countdown-unit-label">h</span>
            </span>
            <span className="events-countdown-sep">:</span>
            <span className="events-countdown-unit">
              <span className="events-countdown-value">{String(countdown.minutes).padStart(2, '0')}</span>
              <span className="events-countdown-unit-label">m</span>
            </span>
            <span className="events-countdown-sep">:</span>
            <span className="events-countdown-unit">
              <span className="events-countdown-value">{String(countdown.seconds).padStart(2, '0')}</span>
              <span className="events-countdown-unit-label">s</span>
            </span>
          </div>
        )}
        <img
          src={aoe3Logo}
          alt="Age of Empires III DE"
          style={{ width: '16vw', height: 'auto' }}
        />
      </div>

      {/* Main content */}
      <div className="events-screen-content">
        <div className="events-center-column">

          {/* ── Leaderboard ── */}
          <div
            className="events-leaderboard"
            style={{ backgroundImage: `url(${leaderboardBg})` }}
          >
            <div className="events-leaderboard-header">
              <span className="events-lb-col-rank">#</span>
              <span className="events-lb-col-name">Player</span>
              {isRefreshing && <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '0.7rem', fontStyle: 'italic' }}>Refreshing scores...</span>}
              <span className="events-lb-col-wins">Best Streak</span>
            </div>
            <div className="events-leaderboard-body">
              {players.length === 0 ? (
                <div className="events-lb-empty">No players registered yet.</div>
              ) : (
                players.map((p, i) => (
                  <div
                    key={p.playerId}
                    className={`events-lb-row${
                      i === 0 ? ' events-lb-row--gold'
                      : i === 1 ? ' events-lb-row--silver'
                      : i === 2 ? ' events-lb-row--bronze'
                      : ''
                    }`}
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
            {(registerSuccess || registerError) && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                textAlign: 'center',
                paddingTop: 2,
                pointerEvents: 'none',
              }}>
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
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
