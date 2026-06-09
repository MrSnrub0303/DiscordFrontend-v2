import React, { useState, useRef, useEffect, useCallback } from 'react';
import soundOnIcon from '../assets/notification_sound_on.png';
import soundOffIcon from '../assets/notification_sound_off.png';
import volumeSliderImg from '../assets/VolumeSlider.png';
import volumeNobImg from '../assets/VolumeNob.png';

export function VolumeControl({ musicEnabled, onToggleMusic, volume = 0.1, onVolumeChange, isMobile }) {
  const [hovered, setHovered] = useState(false);
  const sliderRef = useRef(null);
  const draggingRef = useRef(false);
  const hoveredRef = useRef(false);
  // Remember volume before muting so unmute can restore it
  const preMuteVolumeRef = useRef(volume > 0 ? volume : 0.1);

  const computeVolume = useCallback((clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onVolumeChange?.(ratio);
  }, [onVolumeChange]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    computeVolume(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggingRef.current) computeVolume(e.clientX);
    };
    const handleMouseUp = () => {
      draggingRef.current = false;
      if (!hoveredRef.current) setHovered(false);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [computeVolume]);

  const handleEnter = () => {
    hoveredRef.current = true;
    setHovered(true);
  };

  const handleLeave = () => {
    hoveredRef.current = false;
    if (!draggingRef.current) setHovered(false);
  };

  const handleToggle = () => {
    if (musicEnabled) {
      // About to mute — save current volume, slide to 0
      if (volume > 0) preMuteVolumeRef.current = volume;
      onVolumeChange?.(0);
    } else {
      // About to unmute — restore saved volume
      onVolumeChange?.(preMuteVolumeRef.current);
    }
    onToggleMusic?.();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: isMobile ? 52 : 12,
        right: 12,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {hovered && (
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          style={{
            position: 'relative',
            width: 130,
            height: 30,
            cursor: 'pointer',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          <img
            src={volumeSliderImg}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              pointerEvents: 'none',
            }}
          />
          <img
            src={volumeNobImg}
            alt=""
            style={{
              position: 'absolute',
              top: '50%',
              left: `${volume * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 19,
              height: 19,
              objectFit: 'contain',
              pointerEvents: 'none',
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
            }}
          />
        </div>
      )}
      <button
        onClick={handleToggle}
        style={{
          width: 44,
          height: 44,
          padding: 6,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: 8,
          flexShrink: 0,
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
  );
}
