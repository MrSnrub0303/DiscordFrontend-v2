import React from 'react';
import '../styles/HomeScreen.css';
import backgroundSpinner from '../assets/background-spinner.png';
import playGameButton from '../assets/PlayGameHomeButton.png';
import civAndMapButton from '../assets/CivAndMapHomeButton.png';
import comingSoonButton from '../assets/ComingSoonHomeButton.png';
import aoe3Logo from '../assets/aoe3_de_logo.png';
import discordAppText from '../assets/DiscordAppText.png';
import soundOnIcon from '../assets/notification_sound_on.png';
import soundOffIcon from '../assets/notification_sound_off.png';
import loadingSpinner from '../assets/loadingspinner.png';

export function HomeScreen({
  onGameClick,
  onSpinnerClick,
  onButtonHover,
  onButtonClick,
  musicEnabled,
  onToggleMusic,
  isLoading,
}) {
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
            disabled={isLoading}
            style={{ backgroundImage: `url(${playGameButton})` }}
            aria-label="Play game"
            title="Play Game"
          >
            {isLoading && <img src={loadingSpinner} alt="Loading" className="button-spinner" />}
          </button>

          <button 
            className="home-screen-button spinner-button"
            onMouseEnter={onButtonHover}
            onClick={onButtonClick ? () => onButtonClick(onSpinnerClick) : onSpinnerClick}
            style={{ backgroundImage: `url(${civAndMapButton})` }}
            aria-label="Civ and map randomiser"
            title="Civ & Map"
          ></button>

          <button
            className="home-screen-button locked-button"
            disabled
            style={{ backgroundImage: `url(${comingSoonButton})` }}
            aria-label="Coming soon"
            title="Coming Soon"
          ></button>
        </div>

        <div className="home-screen-footer">
          <p className="home-screen-info">Select an option</p>
        </div>
      </div>
    </div>
  );
}
