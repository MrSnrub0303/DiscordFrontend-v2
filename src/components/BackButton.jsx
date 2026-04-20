import React, { useState } from 'react';
import buttonRedAvailable from '../assets/ButtonRedAvailable.png';
import buttonRedClicked from '../assets/ButtonRedClicked.png';
import backNormal from '../assets/button_back_normal.png';
import backHover from '../assets/button_back_hover.png';

export function BackButton({ onClick, onMouseEnter, style = {} }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => { setHovered(true); onMouseEnter?.(); }}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      aria-label="Back to home"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 8,
        backgroundImage: `url(${pressed ? buttonRedClicked : buttonRedAvailable})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: '"Trajan Pro Bold", serif',
        fontSize: '0.85rem',
        color: '#e8d090',
        textShadow: '1px 2px 3px rgba(0,0,0,0.8)',
        letterSpacing: '0.5px',
        filter: 'drop-shadow(0 2px 7px rgba(0,0,0,0.6))',
        transition: 'transform 150ms ease, filter 150ms ease',
        /* ButtonRed aspect ratio 166:37 = 4.49:1. Render at ~200px wide. */
        width: 200,
        height: 45,
        padding: '0 10px',
        lineHeight: '1',
        ...style,
      }}
    >
      <img
        src={hovered ? backHover : backNormal}
        alt=""
        style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0, pointerEvents: 'none' }}
      />
      Back
    </button>
  );
}
