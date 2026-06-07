import React, { useState } from 'react';
import { BackButton }    from './BackButton';
import { VolumeControl } from './VolumeControl';
import { EmberCanvas }   from './EmberCanvas';
import '../styles/CoOpScreen.css';

import backgroundImg    from '../assets/background-spinner.png';
import marbleBg         from '../assets/marblebg2.png';
import aoe3Logo         from '../assets/aoe3_de_logo.png';
import goldDivider      from '../assets/GoldDivider.png';

// Formatting overlays — place in client/src/assets/coop/
// All overlay images are 1120×260px (same dimensions as level images)
import lvlcardGlow      from '../assets/coop/lvlcard_glow.png';
import lvlcardMask      from '../assets/coop/lvlcard_mask.png'; // used as CSS mask-image
import lvlcardShadow    from '../assets/coop/lvlcard_shadow.png';
import titlebg          from '../assets/coop/titlebg.png'; // 1120×90px

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
        name: 'Act I — Blood',
        levels: [
          { id: 1, name: 'Mission 1' }, { id: 2, name: 'Mission 2' },
          { id: 3, name: 'Mission 3' }, { id: 4, name: 'Mission 4' },
          { id: 5, name: 'Mission 5' }, { id: 6, name: 'Mission 6' },
          { id: 7, name: 'Mission 7' }, { id: 8, name: 'Mission 8' },
          { id: 9, name: 'Mission 9' },
        ],
      },
      {
        id: 2,
        name: 'Act II — Ice',
        levels: [
          { id: 1, name: 'Mission 1' }, { id: 2, name: 'Mission 2' },
          { id: 3, name: 'Mission 3' }, { id: 4, name: 'Mission 4' },
          { id: 5, name: 'Mission 5' }, { id: 6, name: 'Mission 6' },
          { id: 7, name: 'Mission 7' }, { id: 8, name: 'Mission 8' },
          { id: 9, name: 'Mission 9' },
        ],
      },
      {
        id: 3,
        name: 'Act III — Steel',
        levels: [
          { id: 1, name: 'Mission 1' }, { id: 2, name: 'Mission 2' },
          { id: 3, name: 'Mission 3' }, { id: 4, name: 'Mission 4' },
          { id: 5, name: 'Mission 5' }, { id: 6, name: 'Mission 6' },
          { id: 7, name: 'Mission 7' }, { id: 8, name: 'Mission 8' },
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
        name: 'Act I',
        levels: [
          { id: 1, name: 'Mission 1' }, { id: 2, name: 'Mission 2' },
          { id: 3, name: 'Mission 3' }, { id: 4, name: 'Mission 4' },
          { id: 5, name: 'Mission 5' }, { id: 6, name: 'Mission 6' },
          { id: 7, name: 'Mission 7' }, { id: 8, name: 'Mission 8' },
        ],
      },
      {
        id: 2,
        name: 'Act II',
        levels: [
          { id: 1, name: 'Mission 1' }, { id: 2, name: 'Mission 2' },
          { id: 3, name: 'Mission 3' }, { id: 4, name: 'Mission 4' },
          { id: 5, name: 'Mission 5' }, { id: 6, name: 'Mission 6' },
          { id: 7, name: 'Mission 7' },
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
        name: 'The Japanese',
        levels: [
          { id: 1, name: 'Mission 1' }, { id: 2, name: 'Mission 2' },
          { id: 3, name: 'Mission 3' }, { id: 4, name: 'Mission 4' },
          { id: 5, name: 'Mission 5' }, { id: 6, name: 'Mission 6' },
          { id: 7, name: 'Mission 7' }, { id: 8, name: 'Mission 8' },
        ],
      },
      {
        id: 2,
        name: 'The Indian',
        levels: [
          { id: 1, name: 'Mission 1' }, { id: 2, name: 'Mission 2' },
          { id: 3, name: 'Mission 3' }, { id: 4, name: 'Mission 4' },
          { id: 5, name: 'Mission 5' }, { id: 6, name: 'Mission 6' },
          { id: 7, name: 'Mission 7' }, { id: 8, name: 'Mission 8' },
        ],
      },
      {
        id: 3,
        name: 'The Chinese',
        levels: [
          { id: 1, name: 'Mission 1' }, { id: 2, name: 'Mission 2' },
          { id: 3, name: 'Mission 3' }, { id: 4, name: 'Mission 4' },
          { id: 5, name: 'Mission 5' }, { id: 6, name: 'Mission 6' },
          { id: 7, name: 'Mission 7' }, { id: 8, name: 'Mission 8' },
          { id: 9, name: 'Mission 9' },
        ],
      },
    ],
  },
];

// ─── Level Card ───────────────────────────────────────────────────────────────
// All images (level base + overlays) share the same 1120×260 dimensions.
// lvlcard_mask is applied as a CSS mask-image to clip the base image shape.
// shadow, highlight, glow are stacked overlays on top of the masked base.
// titlebg (1120×90) is centered at the bottom as a background-image plate.

function LevelCard({ campaignId, actId, level, playHoverSound, playClickSound }) {
  const [hovered, setHovered]       = useState(false);
  const [imgMissing, setImgMissing] = useState(false);
  const imgUrl = `/coop/${campaignId}act${actId}lvl${level.id}.png`;

  const maskStyle = {
    maskImage: `url(${lvlcardMask})`,
    WebkitMaskImage: `url(${lvlcardMask})`,
    maskMode: 'alpha',
    WebkitMaskMode: 'alpha',
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  };


  return (
    <button
      className="coop-level-card"
      onMouseEnter={() => { setHovered(true); playHoverSound?.(); }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { playClickSound?.(); /* TODO: launch co-op level */ }}
      title={level.name}
      aria-label={level.name}
    >
      {/* Shadow — unmasked; dark torn border shows outside the masked base div */}
      <img src={lvlcardShadow} className="coop-level-overlay" alt="" draggable={false} />

      {/* Glow — unmasked, behind the masked base div; only the pink/red torn border
          shows at the card edge on hover; cream centre is covered by the base div */}
      <img src={lvlcardGlow} className={`coop-level-overlay coop-level-glow${hovered ? ' active' : ''}`} alt="" draggable={false} />

      {/* Masked wrapper — same dimensions as the card; mask-size 100% 100% is exact.
          Both the base image and the title plate are clipped here together. */}
      <div style={{ position: 'absolute', inset: 0, ...maskStyle }}>
        <div
          className={`coop-level-base${imgMissing ? ' coop-level-base--missing' : ''}`}
          style={{ backgroundImage: imgMissing ? 'none' : `url(${imgUrl})` }}
        >
          <img src={imgUrl} alt="" style={{ display: 'none' }} onError={() => setImgMissing(true)} />
        </div>

        <div className="coop-level-titlebg" style={{ backgroundImage: `url(${titlebg})` }}>
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

        {/* Subtle marble tint behind chrome */}
        <div className="coop-chrome-marble" style={{ backgroundImage: `url(${marbleBg})` }} />

        {/* Campaign toggles — checkbox style matching civ spinner */}
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
                src={i === activeCampaign
                  ? '/civ-spinner/checkbox_on.png'
                  : '/civ-spinner/checkbox_off.png'}
                className="coop-toggle-checkbox"
                alt={i === activeCampaign ? 'selected' : 'unselected'}
                draggable={false}
              />
              <span className="coop-toggle-label">{c.name}</span>
            </div>
          ))}
        </div>

        {/* Gold divider at natural size */}
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
