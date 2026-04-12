import React from 'react';
import '../styles/HomeScreen.css';

// Set to true when an event is running, false to lock the button between events
const EVENT_ACTIVE = false;
import backgroundSpinner from '../assets/background-spinner.png';
import playGameButton from '../assets/PlayGameHomeButton.png';
import civAndMapButton from '../assets/CivAndMapHomeButton.png';
import eventsButton from '../assets/EventsHomeButton.png';
import lockIcon from '../assets/lock_icon.png';
import aoe3Logo from '../assets/aoe3_de_logo.png';
import discordAppText from '../assets/DiscordAppText.png';
import soundOnIcon from '../assets/notification_sound_on.png';
import soundOffIcon from '../assets/notification_sound_off.png';
import loadingSpinner from '../assets/loadingspinner.png';
import esocButton from '../assets/ESOCButton.png';

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
  isLoading,
  loadingTarget,
}) {
  const isEventsLoading = EVENT_ACTIVE && loadingTarget === "EVENTS";
  const isSpinnerLoading = loadingTarget === "SPINNER";
  const isAnyLoading = isLoading || !!loadingTarget;

  return (
    <div className="home-screen-container">
      <div
        className="home-screen-background"
        style={{
          backgroundImage: `url(${backgroundSpinner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* ── ESOC Monitor button (top-left) ── */}
      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 999 }}>
        <button
          onClick={isMonitorAuthorized ? onMonitorClick : undefined}
          style={{
            width: 100,
            height: 100,
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: isMonitorAuthorized ? "pointer" : "not-allowed",
            position: "relative",
          }}
          aria-label={isMonitorAuthorized ? "Open Monitor" : "Monitor (locked)"}
          title={isMonitorAuthorized ? "ESOC Monitor" : "Monitor — not authorized"}
        >
          <img
            src={esocButton}
            alt="ESOC Monitor"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: isMonitorAuthorized ? "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5))" : "grayscale(100%) drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5))",
            }}
          />
          {!isMonitorAuthorized && (
            <img
              src={lockIcon}
              alt="Locked"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 20,
                height: 20,
                objectFit: "contain",
                pointerEvents: "none",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
              }}
            />
          )}
        </button>
      </div>

      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 999 }}>
        <button
          onClick={onToggleMusic}
          style={{
            width: 44,
            height: 44,
            padding: 6,
            borderRadius: 8,
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
          aria-label={musicEnabled ? "Turn music off" : "Turn music on"}
          title={
            musicEnabled
              ? "Music On (click to mute)"
              : "Music Off (click to enable)"
          }
        >
          <img
            src={musicEnabled ? soundOnIcon : soundOffIcon}
            alt={musicEnabled ? "music on" : "music off"}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </button>
      </div>

      <div className="home-screen-content">
        <div className="home-screen-header">
          <img src={aoe3Logo} alt="Age of Empires III DE" className="home-screen-logo" />
          <img src={discordAppText} alt="Discord App" className="home-screen-discord-text" />
        </div>

        <div className="home-screen-buttons">
          <button 
            className={`home-screen-button game-button ${isLoading ? 'loading' : ''}`}
            onMouseEnter={onButtonHover}
            onClick={onButtonClick ? () => onButtonClick(onGameClick) : onGameClick}
            disabled={isAnyLoading}
            style={{ backgroundImage: `url(${playGameButton})` }}
            aria-label="Play game"
            title="Play Game"
          >
            {isLoading && <img src={loadingSpinner} alt="Loading" className="button-spinner" />}
          </button>

          <button 
            className={`home-screen-button spinner-button ${isSpinnerLoading ? 'loading' : ''}`}
            onMouseEnter={onButtonHover}
            onClick={onButtonClick ? () => onButtonClick(onSpinnerClick) : onSpinnerClick}
            disabled={isAnyLoading}
            style={{ backgroundImage: `url(${civAndMapButton})` }}
            aria-label="Civ and map randomiser"
            title="Civ & Map"
          >
            {isSpinnerLoading && <img src={loadingSpinner} alt="Loading" className="button-spinner" />}
          </button>

          <button
            className={`home-screen-button events-button ${EVENT_ACTIVE ? (isEventsLoading ? 'loading' : '') : 'events-button--locked'}`}
            onMouseEnter={EVENT_ACTIVE ? onButtonHover : undefined}
            onClick={EVENT_ACTIVE ? (onButtonClick ? () => onButtonClick(onEventsClick) : onEventsClick) : undefined}
            disabled={EVENT_ACTIVE ? isAnyLoading : true}
            style={{ backgroundImage: `url(${eventsButton})` }}
            aria-label={EVENT_ACTIVE ? "Events" : "Events (locked)"}
            title={EVENT_ACTIVE ? "Events" : "Events - Coming Soon"}
          >
            {EVENT_ACTIVE
              ? (isEventsLoading && <img src={loadingSpinner} alt="Loading" className="button-spinner" />)
              : <img src={lockIcon} alt="Locked" className="events-lock-icon" />
            }
          </button>
        </div>

        <div className="home-screen-footer">
          <p className="home-screen-info">Select an option</p>
        </div>
      </div>
    </div>
  );
}
