import { BackButton } from './BackButton';
import backgroundSpinner from '../assets/background-spinner.png';
import '../styles/MonitorScreen.css';

export function RankedScreen({ onBack, onBackHover, isMobile }) {
  return (
    <div className="monitor-container">
      <div
        className="monitor-background"
        style={{ backgroundImage: `url(${backgroundSpinner})` }}
      />

      <div style={{ position: 'fixed', top: isMobile ? 52 : 12, left: 12, zIndex: 1100 }}>
        <BackButton onClick={onBack} onMouseEnter={onBackHover} />
      </div>

      <div className="monitor-content" style={isMobile ? { marginTop: 108 } : {}}>
        <h1 className="monitor-title">Ranked</h1>
        {/* Ranked content — to be implemented */}
      </div>
    </div>
  );
}
