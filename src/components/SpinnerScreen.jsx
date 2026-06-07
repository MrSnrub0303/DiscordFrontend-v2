import React from 'react';
import '../styles/SpinnerScreen.css';
import { EmberCanvas } from './EmberCanvas';
import { BackButton } from './BackButton';
import { VolumeControl } from './VolumeControl';
import aoe3Logo from '../assets/aoe3_de_logo.png';

export function SpinnerScreen({
  onBackClick,
  onBackHover,
  onBackPress,
  musicEnabled,
  onToggleMusic,
  musicVolume,
  onVolumeChange,
  iframeLoaded,
  onIframeLoad,
  isMobile,
}) {
  return (
    <div className="spinner-screen-container">
      {/* Ember particles */}
      <EmberCanvas />

      <VolumeControl
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
        volume={musicVolume}
        onVolumeChange={onVolumeChange}
        isMobile={isMobile}
      />

      <div style={{ position: 'fixed', top: isMobile ? 62 : 12, left: 12, zIndex: 1001 }}>
        <BackButton
          onClick={onBackPress ? () => onBackPress(onBackClick) : onBackClick}
          onMouseEnter={onBackHover}
        />
      </div>

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
