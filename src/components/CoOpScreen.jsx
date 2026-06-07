import React, { useState } from 'react';
import { BackButton }    from './BackButton';
import { VolumeControl } from './VolumeControl';
import { EmberCanvas }   from './EmberCanvas';
import '../styles/CoOpScreen.css';

import backgroundImg    from '../assets/background-spinner.png';
import marbleBg         from '../assets/marblebg2.png';
import aoe3Logo         from '../assets/aoe3_de_logo.png';
import goldDivider      from '../assets/GoldDivider.png';

// Formatting overlays — place these 5 files in client/src/assets/coop/
import lvlcardGlow      from '../assets/coop/lvlcard_glow.png';
import lvlcardHighlight from '../assets/coop/lvlcard_highlight.png';
import lvlcardMask      from '../assets/coop/lvlcard_mask.png';
import lvlcardShadow    from '../assets/coop/lvlcard_shadow.png';
import titlebg          from '../assets/coop/titlebg.png';

// ─── Campaign / Act / Level data ──────────────────────────────────────────────
// Edit names and level counts here to match the actual missions.
// Level images load from: client/public/coop/{campaignId}act{actId}lvl{levelId}.png
//   e.g.  public/coop/1act2lvl4.png  →  Campaign 1, Act 2, Level 4
const CAMPAIGN_DATA = [
  {
    id: 1,
    name: 'Campaign I',
    acts: [
      {
        id: 1,
        name: 'Act I',
        levels: [
          { id: 1, name: 'Mission 1' },
          { id: 2, name: 'Mission 2' },
          { id: 3, name: 'Mission 3' },
          { id: 4, name: 'Mission 4' },
          { id: 5, name: 'Mission 5' },
          { id: 6, name: 'Mission 6' },
          { id: 7, name: 'Mission 7' },
          { id: 8, name: 'Mission 8' },
          { id: 9, name: 'Mission 9' },
        ],
      },
      {
        id: 2,
        name: 'Act II',
        levels: [
          { id: 1, name: 'Mission 1' },
          { id: 2, name: 'Mission 2' },
          { id: 3, name: 'Mission 3' },
          { id: 4, name: 'Mission 4' },
          { id: 5, name: 'Mission 5' },
          { id: 6, name: 'Mission 6' },
          { id: 7, name: 'Mission 7' },
          { id: 8, name: 'Mission 8' },
          { id: 9, name: 'Mission 9' },
        ],
      },
      {
        id: 3,
        name: 'Act III',
        levels: [
          { id: 1, name: 'Mission 1' },
          { id: 2, name: 'Mission 2' },
          { id: 3, name: 'Mission 3' },
          { id: 4, name: 'Mission 4' },
          { id: 5, name: 'Mission 5' },
          { id: 6, name: 'Mission 6' },
          { id: 7, name: 'Mission 7' },
          { id: 8, name: 'Mission 8' },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Campaign II',
    acts: [
      {
        id: 1,
        name: 'Act I',
        levels: [
          { id: 1,  name: 'Mission 1'  },
          { id: 2,  name: 'Mission 2'  },
          { id: 3,  name: 'Mission 3'  },
          { id: 4,  name: 'Mission 4'  },
          { id: 5,  name: 'Mission 5'  },
          { id: 6,  name: 'Mission 6'  },
          { id: 7,  name: 'Mission 7'  },
          { id: 8,  name: 'Mission 8'  },
          { id: 9,  name: 'Mission 9'  },
          { id: 10, name: 'Mission 10' },
        ],
      },
    ],
  },
];

// ─── Level Card ───────────────────────────────────────────────────────────────

function LevelCard({ campaignId, actId, level, playHoverSound, playClickSound }) {
  const [hovered, setHovered] = useState(false);
  const [imgMissing, setImgMissing] = useState(false);
  const imgUrl = `/coop/${campaignId}act${actId}lvl${level.id}.png`;

  return (
    <button
      className="coop-level-card"
      onMouseEnter={() => { setHovered(true); playHoverSound?.(); }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { playClickSound?.(); /* TODO: launch co-op level */ }}
      title={level.name}
      aria-label={level.name}
    >
      {/* Base level image */}
      <div
        className={`coop-level-base${imgMissing ? ' coop-level-base--missing' : ''}`}
        style={imgMissing ? {} : { backgroundImage: `url(${imgUrl})` }}
      >
        {/* Hidden img used only to detect a missing file */}
        <img src={imgUrl} alt="" style={{ display: 'none' }} onError={() => setImgMissing(true)} />
      </div>

      {/* Formatting overlays (bottom → top: mask, shadow, highlight, glow) */}
      <img src={lvlcardMask}      className="coop-level-overlay"                                         alt="" draggable={false} />
      <img src={lvlcardShadow}    className="coop-level-overlay"                                         alt="" draggable={false} />
      <img src={lvlcardHighlight} className="coop-level-overlay"                                         alt="" draggable={false} />
      <img src={lvlcardGlow}      className={`coop-level-overlay coop-level-glow${hovered ? ' active' : ''}`} alt="" draggable={false} />

      {/* Title plate — centered at bottom of card */}
      <div className="coop-level-footer">
        <div
          className="coop-level-titlebg"
          style={{ backgroundImage: `url(${titlebg})` }}
        >
          <span className="coop-level-title-text">{level.name}</span>
        </div>
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
}) {
  const [activeCampaign, setActiveCampaign] = useState(0);
  const campaign = CAMPAIGN_DATA[activeCampaign];

  return (
    <div className="coop-screen" style={{ backgroundImage: `url(${backgroundImg})` }}>
      <EmberCanvas />

      {/* Fixed controls — top-left back button, top-right volume */}
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

      {/* AoE3 logo — bottom left */}
      <img
        src={aoe3Logo}
        alt="Age of Empires III DE"
        style={{
          position: 'fixed', bottom: 16, left: 16,
          width: '16vw', height: 'auto',
          zIndex: 999, pointerEvents: 'none',
        }}
      />

      {/* ── Main layout ── */}
      <div className={`coop-main${isMobile ? ' coop-main--mobile' : ''}`}>

        {/* Marble background overlay on the chrome area */}
        <div className="coop-chrome-marble" style={{ backgroundImage: `url(${marbleBg})` }} />

        {/* Campaign tabs */}
        <div className="coop-tabs">
          {CAMPAIGN_DATA.map((c, i) => (
            <button
              key={c.id}
              className={`coop-tab${i === activeCampaign ? ' coop-tab--active' : ''}`}
              onClick={() => { playClickSound?.(); setActiveCampaign(i); }}
              onMouseEnter={() => playHoverSound?.()}
            >
              {c.name}
            </button>
          ))}
        </div>

        <img src={goldDivider} alt="" className="coop-divider" draggable={false} />

        {/* Scrollable level browser */}
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
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
