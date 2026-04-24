import React, { useState, useEffect, useCallback } from 'react';
import '../styles/EventsScreen.css';
import { BackButton } from './BackButton';
import { VolumeControl } from './VolumeControl';
import topBarBg from '../assets/marblebg2.png';
import marbleBg from '../assets/marblebg2.png';
import aoe3Logo from '../assets/aoe3_de_logo.png';
import eventsDuration from '../assets/EventsDuration.png';
import eventsPrizepool from '../assets/EventsPrizepool.png';
import backgroundSpinner from '../assets/background-spinner.png';
import registerPanel from '../assets/RegisterHerePanel.png';
import nicknameBg from '../assets/uiskirmishnickname_textentry.png';
import btnNormal from '../assets/combobox_button_normal.png';

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

export function EventsScreen({
  onBackClick,
  onBackHover,
  onBackPress,
  musicEnabled,
  onToggleMusic,
  musicVolume,
  onVolumeChange,
  initialPlayers = [],
  isMobile,
}) {
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
      {/* Volume control */}
      <VolumeControl
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
        volume={musicVolume}
        onVolumeChange={onVolumeChange}
        isMobile={isMobile}
      />

      {/* Marble top bar */}
      <div
        className={`events-screen-header${isMobile ? ' events-screen-header--mobile' : ''}`}
        style={{ backgroundImage: `url(${topBarBg})` }}
      >
        <BackButton
          onClick={onBackPress ? () => onBackPress(onBackClick) : onBackClick}
          onMouseEnter={onBackHover}
          style={isMobile ? { position: 'fixed', top: 52, left: 12, zIndex: 1001 } : {}}
        />
        {!isMobile && <h1 className="events-title">GGplz Challenge – Spring Rabbit Hunt</h1>}
      </div>

      {/* Top-left: EventsDuration + EventsPrizepool widgets — hidden on mobile */}
      {!isMobile && (
        <div className="events-topleft-widgets">
          <div className="events-widget-asset">
            <img src={eventsDuration} alt="" className="events-widget-img" draggable={false} />
            {countdown && (
              <span className="events-widget-text">
                {String(countdown.days).padStart(2, '0')}d : {String(countdown.hours).padStart(2, '0')}h : {String(countdown.minutes).padStart(2, '0')}m : {String(countdown.seconds).padStart(2, '0')}s
              </span>
            )}
          </div>
          <div className="events-widget-asset">
            <img src={eventsPrizepool} alt="" className="events-widget-img" draggable={false} />
            <span className="events-widget-text">$250</span>
          </div>
        </div>
      )}

      {/* Bottom-left: AoE3 logo */}
      <div style={{ position: 'fixed', bottom: 16, left: 16, zIndex: 999, pointerEvents: 'none', width: '16vw' }}>
        <img src={aoe3Logo} alt="Age of Empires III DE" className="events-aoe3-logo" />
      </div>

      {/* Main content */}
      <div className="events-screen-content">
        <div className="events-center-column">

          {/* ── Leaderboard ── */}
          <div className="events-leaderboard">
            {/* Marble background overlay */}
            <div
              className="events-lb-marble"
              style={{ backgroundImage: `url(${marbleBg})` }}
            />
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
