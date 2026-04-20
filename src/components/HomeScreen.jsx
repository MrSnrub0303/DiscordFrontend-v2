import React, { useState } from 'react';
import '../styles/HomeScreen.css';
import { VolumeControl } from './VolumeControl';

// Set to true when an event is running, false to lock the button between events
const EVENT_ACTIVE = true;

import backgroundImg from '../assets/background-spinner.png';
import marbleBg from '../assets/marblebg2.png';
import playGameButton from '../assets/PlayGameHomeButtonNew.png';
import civAndMapButton from '../assets/CivAndMapHomeButtonNew.png';
import eventsButton from '../assets/EventsHomeButtonNew.png';
import lockIcon from '../assets/lock_icon.png';
import aoe3Logo from '../assets/aoe3_de_logo.png';
import discordAppText from '../assets/DiscordAppTextNew.png';
import loadingSpinner from '../assets/loadingspinner.png';
import goldDivider from '../assets/GoldDivider.png';
import buttonRedAvailable from '../assets/ButtonRedAvailable.png';
import buttonRedClicked from '../assets/ButtonRedClicked.png';

export function HomeScreen({
  onGameClick,
  onSpinnerClick,
  onEventsClick,
  onMonitorClick,
  isMonitorAuthorized,
  onButtonHover,
  onButtonClick,
  musicEnabled,
  onToggleMusic,
  musicVolume,
  onVolumeChange,
  isLoading,
  loadingTarget,
}) {
  const [monitorPressed, setMonitorPressed] = useState(false);

  const isEventsLoading = EVENT_ACTIVE && loadingTarget === 'EVENTS';
  const isSpinnerLoading = loadingTarget === 'SPINNER';
  const isAnyLoading = isLoading || !!loadingTarget;

  return (
    <div className="home-screen-container">
      {/* Background */}
      <div
        className="home-screen-background"
        style={{ backgroundImage: `url(${backgroundImg})` }}
      />

      {/* Smoke layer - pure CSS background-image scroll, seamless repeat-x */}
      <div className="home-smoke-layer" />

      {/* Volume control - top right */}
      <VolumeControl
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
        volume={musicVolume}
        onVolumeChange={onVolumeChange}
      />

      {/* Left sidebar panel */}
      <div className="home-panel">
        {/* Marble bg at 50% opacity */}
        <div
          className="home-panel-marble"
          style={{ backgroundImage: `url(${marbleBg})` }}
        />

        {/* Gold border lines */}
        <div className="home-panel-border-left" />
        <div className="home-panel-border-right" />

        {/* Panel content */}
        <div className="home-panel-content">
          {/* AoE3 Logo */}
          <img
            src={aoe3Logo}
            alt="Age of Empires III DE"
            className="home-panel-logo"
          />

          {/* Gold divider */}
          <img src={goldDivider} alt="" className="home-gold-divider" />

          {/* Game buttons */}
          <div className="home-panel-buttons">
            <button
              className={`home-panel-btn${isLoading ? ' loading' : ''}`}
              onClick={onButtonClick ? () => onButtonClick(onGameClick) : onGameClick}
              onMouseEnter={onButtonHover}
              disabled={isAnyLoading}
              style={{ backgroundImage: `url(${playGameButton})` }}
              aria-label="Play game"
              title="Play Game"
            >
              {isLoading && (
                <img src={loadingSpinner} alt="Loading" className="home-btn-spinner" />
              )}
            </button>

            <button
              className={`home-panel-btn${isSpinnerLoading ? ' loading' : ''}`}
              onClick={onButtonClick ? () => onButtonClick(onSpinnerClick) : onSpinnerClick}
              onMouseEnter={onButtonHover}
              disabled={isAnyLoading}
              style={{ backgroundImage: `url(${civAndMapButton})` }}
              aria-label="Civ and map randomiser"
              title="Civ & Map"
            >
              {isSpinnerLoading && (
                <img src={loadingSpinner} alt="Loading" className="home-btn-spinner" />
              )}
            </button>

            <button
              className={`home-panel-btn${EVENT_ACTIVE ? (isEventsLoading ? ' loading' : '') : ' events-btn--locked'}`}
              onClick={EVENT_ACTIVE ? (onButtonClick ? () => onButtonClick(onEventsClick) : onEventsClick) : undefined}
              onMouseEnter={EVENT_ACTIVE ? onButtonHover : undefined}
              disabled={EVENT_ACTIVE ? isAnyLoading : true}
              style={{ backgroundImage: `url(${eventsButton})` }}
              aria-label={EVENT_ACTIVE ? 'Events' : 'Events (locked)'}
              title={EVENT_ACTIVE ? 'Events' : 'Events - Coming Soon'}
            >
              {EVENT_ACTIVE
                ? (isEventsLoading && (
                    <img src={loadingSpinner} alt="Loading" className="home-btn-spinner" />
                  ))
                : <img src={lockIcon} alt="Locked" className="events-lock-icon" />
              }
            </button>
          </div>

          {/* Gold divider */}
          <img src={goldDivider} alt="" className="home-gold-divider" />

          {/* Monitor button */}
          <button
            className={`home-monitor-btn${!isMonitorAuthorized ? ' home-monitor-btn--locked' : ''}`}
            onClick={isMonitorAuthorized ? onMonitorClick : undefined}
            onMouseDown={() => isMonitorAuthorized && setMonitorPressed(true)}
            onMouseUp={() => setMonitorPressed(false)}
            onMouseLeave={() => setMonitorPressed(false)}
            disabled={!isMonitorAuthorized}
            style={{
              backgroundImage: `url(${monitorPressed ? buttonRedClicked : buttonRedAvailable})`,
            }}
            aria-label={isMonitorAuthorized ? 'Open Monitor' : 'Monitor (locked)'}
            title={isMonitorAuthorized ? 'ESOC Monitor' : 'Monitor — not authorized'}
          >
            {!isMonitorAuthorized && (
              <img src={lockIcon} alt="" className="monitor-lock-icon" />
            )}
            Monitor
          </button>
        </div>
      </div>

      {/* Discord App text - right area */}
      <div className="home-discord-text-area">
        <img
          src={discordAppText}
          alt="Discord App!"
          className="home-discord-text"
          draggable={false}
        />
      </div>
    </div>
  );
}
