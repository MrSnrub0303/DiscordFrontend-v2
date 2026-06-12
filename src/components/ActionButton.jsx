import React, { useState } from 'react';
import buttonRedAvailable from '../assets/ButtonRedAvailable.png';
import buttonRedClicked from '../assets/ButtonRedClicked.png';

export function ActionButton({ onClick, disabled, children, style = {} }) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        backgroundImage: `url(${pressed && !disabled ? buttonRedClicked : buttonRedAvailable})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: '"Trajan Pro Bold", serif',
        fontSize: '0.9rem',
        color: '#e8d090',
        textShadow: '1px 2px 3px rgba(0,0,0,0.8)',
        letterSpacing: '0.5px',
        filter: 'drop-shadow(0 2px 7px rgba(0,0,0,0.6))',
        transition: 'filter 150ms ease',
        height: 44,
        padding: '0 18px 5px 18px',
        lineHeight: '1',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
