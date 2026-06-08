import React, { useState } from 'react';
import { BackButton }    from './BackButton';
import { VolumeControl } from './VolumeControl';
import { EmberCanvas }   from './EmberCanvas';
import '../styles/CoOpScreen.css';

import backgroundImg    from '../assets/background-spinner.png';
import marbleBg         from '../assets/marblebg2.png';
import goldDivider      from '../assets/GoldDivider.png';
import buttonRedAvail   from '../assets/ButtonRedAvailable.png';
import buttonRedClick   from '../assets/ButtonRedClicked.png';

// Formatting overlays — place in client/src/assets/coop/
// All overlay images are 1120×260px (same dimensions as level images)
import lvlcardGlow      from '../assets/coop/lvlcard_glow.png';
import lvlcardHighlight from '../assets/coop/lvlcard_highlight.png';
import lvlcardMask      from '../assets/coop/lvlcard_mask.png'; // 1120×260 — masks the whole card
import lvlcardShadow    from '../assets/coop/lvlcard_shadow.png';
import titlebg          from '../assets/coop/titlebg.png';       // 1120×90px

// ─── Campaign / Act / Level data ──────────────────────────────────────────────
// Edit names here. Images load from client/public/coop/:
//   {campaignId}act{actId}lvl{levelId}.png
//   e.g.  public/coop/1act2lvl4.png  →  Campaign 1, Act 2, Level 4
const CAMPAIGN_DATA = [
  {
    id: 1,
    name: 'Blood, Ice, & Steel',
    acts: [
      {
        id: 1,
        name: 'Act I: Blood',
        levels: [
          { id: 2, name: 'Breakout' }, { id: 4, name: 'Into the Caves' },
          { id: 7, name: 'PIRATES!' }, { id: 9, name: 'The Ottoman Fort' },
          { id: 11, name: 'Temples of the Aztec' }, { id: 14, name: 'A Pirate\'s Help' },
          { id: 16, name: 'Spanish Treasure Fleet' }, { id: 19, name: 'The Fountain of Youth?' },
        ],
      },
      {
        id: 2,
        name: 'Act II: Ice',
        levels: [
          { id: 2, name: 'Defend the Colony' }, { id: 4, name: 'Strange Alliances' },
          { id: 7, name: 'The Rescue' }, { id: 10, name: 'The Seven Year\'s War' },
          { id: 13, name: 'The Great Lakes' }, { id: 16, name: 'Respect' },
          { id: 18, name: 'Warwick\'s Stronghold' }, { id: 20, name: 'Bring Down the Mountain' },
        ],
      },
      {
        id: 3,
        name: 'Act III: Steel',
        levels: [
          { id: 2, name: 'Race for the Rails' }, { id: 4, name: 'Hold the Fort' },
          { id: 7, name: 'The Boneguard\'s Lair' }, { id: 10, name: 'The Lost Spanish Gold' },
          { id: 13, name: 'Bolivar\'s Revolt' }, { id: 15, name: 'Journey Through the Andes' },
          { id: 17, name: 'Last City of the Inca' }, { id: 20, name: 'Last Stand of the Boneguard' },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Fire & Shadow',
    acts: [
      {
        id: 1,
        name: 'Act I: Fire',
        levels: [
          { id: 2, name: 'War Ceremony' }, { id: 5, name: 'The Rescue' },
          { id: 7, name: 'Breed\'s Hill' }, { id: 9, name: 'Crossing the Delaware' },
          { id: 11, name: 'Saratoga' }, { id: 13, name: 'Valley Forge' },
          { id: 15, name: 'The Battle of Morristown' }, { id: 17, name: 'The Battle of Yorktown' },
        ],
      },
      {
        id: 2,
        name: 'Act II: Shadow',
        levels: [
          { id: 2, name: 'The Bozeman Trail' }, { id: 4, name: 'A Reckoning' },
          { id: 7, name: 'Claims' }, { id: 9, name: 'Urgent News' },
          { id: 12, name: 'To Stop a War' }, { id: 14, name: 'Trust' },
          { id: 17, name: 'Battle of the Greasy Grass' },
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'The Asian Dynasties',
    acts: [
      {
        id: 1,
        name: 'Act I: Japan',
        levels: [
          { id: 3, name: 'The Siege of Osaka' }, { id: 5, name: 'Uprising!' },
          { id: 7, name: 'Clearing the Road' }, { id: 10, name: 'Last Stand at Fushimi' },
          { id: 13, name: 'The Battle of Sekigahara' },
        ],
      },
      {
        id: 2,
        name: 'Act II: China',
        levels: [
          { id: 3, name: 'To Finish a Fleet' }, { id: 5, name: 'Storming the Beaches' },
          { id: 7, name: 'Lost Ships' }, { id: 9, name: 'A Rescue in the Wilderness' },
          { id: 11, name: 'No Empire Lasts Forever' },
        ],
      },
      {
        id: 3,
        name: 'Act III: India',
        levels: [
          { id: 3, name: 'Into the Punjab' }, { id: 5, name: 'Fires of Calcutta' },
          { id: 8, name: 'Resist!' }, { id: 10, name: 'Raid in Delhi' },
          { id: 13, name: 'Company Confrontation' },
        ],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const maskAlpha = (url, h = '100%') => ({
  maskImage: `url(${url})`,
  WebkitMaskImage: `url(${url})`,
  maskMode: 'alpha',
  WebkitMaskMode: 'alpha',
  maskSize: `100% ${h}`,
  WebkitMaskSize: `100% ${h}`,
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
  maskPosition: 'center',
  WebkitMaskPosition: 'center',
});

// Red button matching the HomeScreen Ranked/Monitor style
function ModalBtn({ onClick, onPlayHover, onPlayClick, children }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      className="coop-modal-btn"
      onClick={() => { onPlayClick?.(); onClick?.(); }}
      onMouseEnter={() => onPlayHover?.()}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{ backgroundImage: `url(${pressed ? buttonRedClick : buttonRedAvail})` }}
    >
      {children}
    </button>
  );
}

// ─── Level Card ───────────────────────────────────────────────────────────────

function LevelCard({ campaignId, actId, level, playHoverSound, playClickSound, onLevelSelect }) {
  const [hovered,    setHovered]    = useState(false);
  const [imgMissing, setImgMissing] = useState(false);
  const imgUrl = `/coop/${campaignId}act${actId}lvl${level.id}.png`;

  return (
    <button
      className="coop-level-card"
      onMouseEnter={() => { setHovered(true); playHoverSound?.(); }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { playClickSound?.(); onLevelSelect(); }}
      title={level.name}
      aria-label={level.name}
    >
      <img src={lvlcardShadow} className="coop-level-overlay" alt="" draggable={false} />
      <img src={lvlcardGlow} className={`coop-level-overlay coop-level-glow${hovered ? ' active' : ''}`} alt="" draggable={false} />
      <div
        className={`coop-level-base${imgMissing ? ' coop-level-base--missing' : ''}`}
        style={imgMissing ? maskAlpha(lvlcardMask, '100%') : {
          backgroundImage: `url(${imgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          ...maskAlpha(lvlcardMask, '100%'),
        }}
      >
        <img src={imgUrl} alt="" style={{ display: 'none' }} onError={() => setImgMissing(true)} />
        <div
          className="coop-level-titlebg"
          style={{
            backgroundImage: `url(${titlebg})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span className="coop-level-title-text">{level.name}</span>
        </div>
        <img src={lvlcardHighlight} className="coop-level-overlay" alt="" draggable={false} />
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CoOpScreen({
  onBackClick,
  onBackHover,
  onBackPress,
  musicEnabled,
  onToggleMusic,
  musicVolume,
  onVolumeChange,
  isMobile,
  playClickSound,
  playHoverSound,
  onDownloadScenario,
}) {
  const [activeCampaign, setActiveCampaign] = useState(0);
  // selectedLevel: null | { level, campaignId, actId }
  const [selectedLevel,  setSelectedLevel]  = useState(null);
  // step: 'choose' | 'manual-done' | 'auto-done'
  const [downloadStep,   setDownloadStep]   = useState('choose');
  const [pathCopied,     setPathCopied]     = useState(false);

  const campaign = CAMPAIGN_DATA[activeCampaign];

  const openModal = (level, campaignId, actId) => {
    setSelectedLevel({ level, campaignId, actId });
    setDownloadStep('choose');
    setPathCopied(false);
  };
  const closeModal = () => setSelectedLevel(null);

  const serverUrl = import.meta.env.VITE_SERVER_URL || '';

  const handleManualDownload = () => {
    const { level, campaignId, actId } = selectedLevel;
    const name = encodeURIComponent(level.name);
    onDownloadScenario?.(`${serverUrl}/api/coop/download/${campaignId}/${actId}/${level.id}?name=${name}`);
    setDownloadStep('manual-done');
  };

  const handleAutoDownload = () => {
    const { level, campaignId, actId } = selectedLevel;
    const name  = encodeURIComponent(level.name);
    // Pass the full download URL (with name) so the bat uses the correct server + filename
    const dlurl = encodeURIComponent(`${serverUrl}/api/coop/download/${campaignId}/${actId}/${level.id}?name=${name}`);
    onDownloadScenario?.(`${serverUrl}/api/coop/install/${campaignId}/${actId}/${level.id}?name=${name}&dlurl=${dlurl}`);
    setDownloadStep('auto-done');
  };

  const copyPath = () => {
    const text = '%USERPROFILE%\\Games\\Age of Empires 3 DE';
    const fallback = () => {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(fallback);
    } else {
      fallback();
    }
    setPathCopied(true);
    setTimeout(() => setPathCopied(false), 2000);
  };

  return (
    <div className="coop-screen" style={{ backgroundImage: `url(${backgroundImg})` }}>
      <EmberCanvas />

      {/* Fixed controls */}
      <div style={{ position: 'fixed', top: isMobile ? 62 : 12, left: 12, zIndex: 1001 }}>
        <BackButton
          onClick={onBackPress ? () => onBackPress(onBackClick) : onBackClick}
          onMouseEnter={onBackHover}
        />
      </div>
      <VolumeControl
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
        volume={musicVolume}
        onVolumeChange={onVolumeChange}
        isMobile={isMobile}
      />

      {/* Header */}
      <div className={`coop-header${isMobile ? ' coop-header--mobile' : ''}`}>
        <div className="coop-chrome-marble" style={{ backgroundImage: `url(${marbleBg})` }} />
        <div className="coop-toggle-row">
          {CAMPAIGN_DATA.map((c, i) => (
            <div
              key={c.id}
              className="coop-toggle-option"
              onClick={() => { playClickSound?.(); setActiveCampaign(i); }}
              onMouseEnter={() => playHoverSound?.()}
              role="radio"
              aria-checked={i === activeCampaign}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setActiveCampaign(i)}
            >
              <img
                src={i === activeCampaign ? '/civ-spinner/checkbox_on.png' : '/civ-spinner/checkbox_off.png'}
                className="coop-toggle-checkbox"
                alt={i === activeCampaign ? 'selected' : 'unselected'}
                draggable={false}
              />
              <span className="coop-toggle-label">{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable level grid */}
      <div className="coop-scroll">
        {campaign.acts.map(act => (
          <div key={act.id} className="coop-act-section">
            <h2 className="coop-act-title">{act.name}</h2>
            <div className="coop-levels-grid">
              {act.levels.map(level => (
                <LevelCard
                  key={level.id}
                  campaignId={campaign.id}
                  actId={act.id}
                  level={level}
                  playHoverSound={playHoverSound}
                  playClickSound={playClickSound}
                  onLevelSelect={() => openModal(level, campaign.id, act.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Download modal */}
      {selectedLevel && (
        <div className="coop-modal-overlay" onClick={closeModal}>
          <div className="coop-modal" onClick={e => e.stopPropagation()}>

            {/* Marble tint */}
            <div className="coop-modal-marble" style={{ backgroundImage: `url(${marbleBg})` }} />

            {/* Close */}
            <button
              className="coop-modal-close"
              onClick={() => { playClickSound?.(); closeModal(); }}
              onMouseEnter={playHoverSound}
              aria-label="Close"
            >✕</button>

            {/* Title */}
            <h2 className="coop-modal-title">{selectedLevel.level.name}</h2>
            <img src={goldDivider} alt="" className="coop-modal-divider" draggable={false} />

            {/* ── Choose method ── */}
            {downloadStep === 'choose' && (
              <div className="coop-modal-body">
                <p className="coop-modal-subtitle">How would you like to install this scenario?</p>

                <div className="coop-modal-option">
                  <ModalBtn onClick={handleManualDownload} onPlayHover={playHoverSound} onPlayClick={playClickSound}>Download Manually</ModalBtn>
                  <p className="coop-modal-option-desc">
                    Downloads the scenario file to your Downloads folder.
                    We'll show you where to move it.
                  </p>
                </div>

                <div className="coop-modal-option">
                  <ModalBtn onClick={handleAutoDownload} onPlayHover={playHoverSound} onPlayClick={playClickSound}>Download Automatically</ModalBtn>
                  <p className="coop-modal-option-desc">
                    Downloads a small installer that detects your AoE3 profile
                    folders and places the file in the right location automatically.
                  </p>
                </div>
              </div>
            )}

            {/* ── Manual instructions ── */}
            {downloadStep === 'manual-done' && (
              <div className="coop-modal-body">
                <p className="coop-modal-check">✓ File sent to your Downloads folder</p>
                <p className="coop-modal-subtitle">Move it to your AoE3 Scenario folder:</p>

                <div className="coop-modal-path">
                  <span className="coop-modal-path-env">%USERPROFILE%</span>
                  \Games\Age of Empires 3 DE\
                  <span className="coop-modal-path-var">&lt;SteamID&gt;</span>
                  \Scenario
                </div>

                <p className="coop-modal-hint">
                  The SteamID is the long numbered folder inside the Age of Empires 3 DE directory.
                  There may be multiple — copy into each one that has a Scenario subfolder.
                </p>

                <div className="coop-modal-actions">
                  <ModalBtn onClick={copyPath} onPlayHover={playHoverSound} onPlayClick={playClickSound}>{pathCopied ? 'Copied!' : 'Copy Base Path'}</ModalBtn>
                  <ModalBtn onClick={closeModal} onPlayHover={playHoverSound} onPlayClick={playClickSound}>Done</ModalBtn>
                </div>
              </div>
            )}

            {/* ── Auto instructions ── */}
            {downloadStep === 'auto-done' && (
              <div className="coop-modal-body">
                <p className="coop-modal-check">✓ Installer downloaded</p>
                <p className="coop-modal-subtitle">
                  Find <strong>Install {selectedLevel.level.name}.bat</strong> in your
                  Downloads folder and double-click it.
                </p>
                <p className="coop-modal-hint">
                  The installer scans all your AoE3 profile folders and copies
                  the scenario to each valid Scenario directory. Files that already
                  exist are skipped automatically.
                </p>
                <p className="coop-modal-hint coop-modal-hint--warn">
                  If Windows shows a security warning, click <strong>More info</strong> →
                  then <strong>Run anyway</strong>.
                </p>
                <ModalBtn onClick={closeModal} onPlayHover={playHoverSound} onPlayClick={playClickSound}>Done</ModalBtn>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
