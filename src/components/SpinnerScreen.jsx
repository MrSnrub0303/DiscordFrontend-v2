import React from 'react';
import '../styles/SpinnerScreen.css';
import btnNormal from '../assets/combobox_button_normal.png';
import topBarBg from '../assets/marblebg2.png';
import soundOnIcon from '../assets/notification_sound_on.png';
import soundOffIcon from '../assets/notification_sound_off.png';
import aoe3Logo from '../assets/aoe3_de_logo.png';

export function SpinnerScreen({ onBackClick, onBackHover, onBackPress, musicEnabled, onToggleMusic, iframeLoaded, onIframeLoad }) {
  return (
    <div className="spinner-screen-container">
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

      <div
        className="spinner-screen-header"
        style={{ backgroundImage: `url(${topBarBg})` }}
      >
        <button 
          className="spinner-back-button"
          onClick={onBackPress ? () => onBackPress(onBackClick) : onBackClick}
          onMouseEnter={onBackHover}
          aria-label="Back to home"
          style={{ backgroundImage: `url(${btnNormal})` }}
        >
          <span className="back-arrow">←</span>
          Back
        </button>
        <h1 className="spinner-title">Civilization Spinner</h1>
      </div>

      <img
        src={aoe3Logo}
        alt="Age of Empires III DE"
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          width: "16vw",
          height: "auto",
          zIndex: 999,
          pointerEvents: "none",
        }}
      />

      <div className="spinner-screen-content">
        {!iframeLoaded && (
          <div className="spinner-screen-loading-overlay">
            <span>Loading spinner...</span>
          </div>
        )}
        <iframe
          src="/civ-spinner/civ_spinner.html"
          className="spinner-iframe"
          title="Civilization Spinner"
          style={{ background: '#000' }}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          onLoad={onIframeLoad}
        />
      </div>
    </div>
  );
}
