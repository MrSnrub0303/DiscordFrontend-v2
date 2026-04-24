import React from 'react';
import '../styles/SpinnerScreen.css';
import { BackButton } from './BackButton';
import { VolumeControl } from './VolumeControl';
import topBarBg from '../assets/marblebg2.png';
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
      <VolumeControl
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
        volume={musicVolume}
        onVolumeChange={onVolumeChange}
        isMobile={isMobile}
      />

      <div
        className={`spinner-screen-header${isMobile ? ' spinner-screen-header--mobile' : ''}`}
        style={{ backgroundImage: `url(${topBarBg})` }}
      >
        <BackButton
          onClick={onBackPress ? () => onBackPress(onBackClick) : onBackClick}
          onMouseEnter={onBackHover}
          style={isMobile ? { position: 'fixed', top: 62, left: 12, zIndex: 1001 } : {}}
        />
        {!isMobile && <h1 className="spinner-title">Civilization Spinner</h1>}
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
