import React, { useState, useRef, useEffect } from 'react';
import '../styles/HomeScreen.css';
import { EmberCanvas } from './EmberCanvas';
import { VolumeControl } from './VolumeControl';
import backgroundImg from '../assets/background-spinner.png';
import marbleBg from '../assets/marblebg2.png';
import playGameButton from '../assets/PlayGameHomeButtonNew.png';
import civAndMapButton from '../assets/CivAndMapHomeButtonNew.png';
import coOpButton from '../assets/CoOpButtonNew.png';
import eventsButton from '../assets/EventsHomeButtonNew.png';
import lockIcon from '../assets/lock_icon.png';
import aoe3Logo from '../assets/aoe3_de_logo.png';
import discordAppText from '../assets/DiscordAppTextNew.png';
import loadingSpinner from '../assets/loadingspinner.png';
import goldDivider from '../assets/GoldDivider.png';
import buttonRedAvailable from '../assets/ButtonRedAvailable.png';
import buttonRedClicked from '../assets/ButtonRedClicked.png';
import buttonBackNormal from '../assets/button_back_normal.png';

// Set to true when an event is running, false to lock the button between events
const EVENT_ACTIVE = false;

// Set to true when Co-Op mode is available
const CO_OP_ACTIVE = true;

// RANKED_ACTIVE controls whether the button exists — access is controlled per-user via isRankedAuthorized prop
const RANKED_ACTIVE = true;

const BTN_ASPECT = 467 / 820; // height / width ratio of button images
const BTN_GAP    = 8;         // matches CSS gap inside .home-panel-buttons

export function HomeScreen({
  onGameClick,
  onSpinnerClick,
  onCoOpClick,
  onEventsClick,
  onRankedClick,
  onMonitorClick,
  isMonitorAuthorized,
  isRankedAuthorized,
  onButtonHover,
  onButtonClick,
  musicEnabled,
  onToggleMusic,
  musicVolume,
  onVolumeChange,
  isLoading,
  loadingTarget,
  isMobile,
}) {
  const [monitorPressed,   setMonitorPressed]   = useState(false);
  const [rankedPressed,    setRankedPressed]    = useState(false);
  const [showScrollArrow,  setShowScrollArrow]  = useState(CO_OP_ACTIVE);
  const scrollRef = useRef(null);

  const onButtonsScroll = (e) => {
    const el = e.currentTarget;
    setShowScrollArrow(el.scrollHeight - el.scrollTop > el.clientHeight + 2);
  };

  const isEventsLoading  = EVENT_ACTIVE && loadingTarget === 'EVENTS';
  const isSpinnerLoading = loadingTarget === 'SPINNER';
  const isCoOpLoading    = loadingTarget === 'COOP';
  const isAnyLoading     = isLoading || !!loadingTarget;

  // On desktop: constrain the scrollable area to exactly 3 buttons tall.
  // Derived from the container's actual rendered width + the button aspect ratio
  // so it stays correct at any panel size without hard-coded pixel values.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (isMobile) {
      container.style.maxHeight = '';
      return;
    }

    const update = () => {
      const w = container.getBoundingClientRect().width;
      if (!w) return;
      const btnH = w * BTN_ASPECT;
      container.style.maxHeight = `${3 * btnH + 2 * BTN_GAP}px`;
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, [isMobile]);

  return (
    <div className="home-screen-container">
      {/* Background */}
      <div
        className="home-screen-background"
        style={{ backgroundImage: `url(${backgroundImg})` }}
      />

      {/* Smoke layer */}
      <div className="home-smoke-layer" />

      {/* Ember particles */}
      <EmberCanvas />

      {/* Volume control - top right */}
      <VolumeControl
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
        volume={musicVolume}
        onVolumeChange={onVolumeChange}
        isMobile={isMobile}
      />

      {/* Left sidebar panel */}
      <div className="home-panel">
        <div
          className="home-panel-marble"
          style={{ backgroundImage: `url(${marbleBg})` }}
        />
        <div className="home-panel-border-left" />
        <div className="home-panel-border-right" />

        <div className="home-panel-content">
          {/* AoE3 Logo */}
          <img src={aoe3Logo} alt="Age of Empires III DE" className="home-panel-logo" />

          {/* Top gold divider */}
          <img src={goldDivider} alt="" className="home-gold-divider" />

          {/* Scrollable button area — shows 3 on desktop, all 4 on mobile */}
          <div className="home-buttons-wrap">
          <div className="home-panel-buttons" ref={scrollRef} onScroll={onButtonsScroll}>

            {/* Play Game */}
            <button
              className={`home-panel-btn${!isMobile && isLoading ? ' loading' : ''}${isMobile ? ' events-btn--locked' : ''}`}
              onClick={isMobile ? undefined : (onButtonClick ? () => onButtonClick(onGameClick) : onGameClick)}
              onMouseEnter={isMobile ? undefined : onButtonHover}
              disabled={isMobile ? true : isAnyLoading}
              style={{ backgroundImage: `url(${playGameButton})` }}
              aria-label={isMobile ? 'Play game (desktop only)' : 'Play game'}
              title={isMobile ? 'Play Game — Desktop Only' : 'Play Game'}
            >
              {isMobile
                ? <img src={lockIcon} alt="Locked" className="events-lock-icon" />
                : (isLoading && <img src={loadingSpinner} alt="Loading" className="home-btn-spinner" />)
              }
            </button>

            {/* Civ & Map */}
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

            {/* Events */}
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

            {/* Co-Op */}
            <button
              className={`home-panel-btn${CO_OP_ACTIVE ? (isCoOpLoading ? ' loading' : '') : ' events-btn--locked'}`}
              onClick={CO_OP_ACTIVE ? (onButtonClick ? () => onButtonClick(onCoOpClick) : onCoOpClick) : undefined}
              onMouseEnter={CO_OP_ACTIVE ? onButtonHover : undefined}
              disabled={CO_OP_ACTIVE ? isAnyLoading : true}
              style={{ backgroundImage: `url(${coOpButton})` }}
              aria-label={CO_OP_ACTIVE ? 'Co-Op' : 'Co-Op (coming soon)'}
              title={CO_OP_ACTIVE ? 'Co-Op' : 'Co-Op — Coming Soon'}
            >
              {CO_OP_ACTIVE
                ? (isCoOpLoading && <img src={loadingSpinner} alt="Loading" className="home-btn-spinner" />)
                : <img src={lockIcon} alt="Locked" className="events-lock-icon" />
              }
            </button>

          </div>
          {!isMobile && CO_OP_ACTIVE && (
            <div className="home-scroll-arrow-wrap" style={{ opacity: showScrollArrow ? 1 : 0 }}>
              <img src={buttonBackNormal} className="home-scroll-arrow" alt="" draggable={false} />
            </div>
          )}
          </div>

          {/* Bottom gold divider */}
          <img src={goldDivider} alt="" className="home-gold-divider" />

          {/* Bottom buttons: Ranked + Monitor */}
          <div className="home-bottom-buttons">
            {/* Ranked button */}
            <button
              className={`home-monitor-btn${!isRankedAuthorized ? ' home-monitor-btn--locked' : ''}`}
              onClick={isRankedAuthorized ? (onButtonClick ? () => onButtonClick(onRankedClick) : onRankedClick) : undefined}
              onMouseEnter={isRankedAuthorized ? onButtonHover : undefined}
              onMouseDown={() => isRankedAuthorized && setRankedPressed(true)}
              onMouseUp={() => setRankedPressed(false)}
              onMouseLeave={() => setRankedPressed(false)}
              disabled={!isRankedAuthorized}
              style={{
                backgroundImage: `url(${rankedPressed ? buttonRedClicked : buttonRedAvailable})`,
              }}
              aria-label={isRankedAuthorized ? 'Ranked' : 'Ranked (restricted)'}
              title={isRankedAuthorized ? 'Ranked' : 'Ranked — Access Restricted'}
            >
              {!isRankedAuthorized && <img src={lockIcon} alt="" className="monitor-lock-icon" />}
              Ranked
            </button>

            {/* Monitor button */}
            <button
              className={`home-monitor-btn${!isMonitorAuthorized ? ' home-monitor-btn--locked' : ''}`}
              onClick={isMonitorAuthorized ? (onButtonClick ? () => onButtonClick(onMonitorClick) : onMonitorClick) : undefined}
              onMouseEnter={isMonitorAuthorized ? onButtonHover : undefined}
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
