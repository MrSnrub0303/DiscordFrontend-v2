import React, { useState } from 'react';
import { BackButton }    from './BackButton';
import { VolumeControl } from './VolumeControl';
import { EmberCanvas }   from './EmberCanvas';
import '../styles/CoOpScreen.css';

import backgroundImg    from '../assets/background-spinner.png';
import marbleBg         from '../assets/marblebg2.png';

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

// ─── Level Card ───────────────────────────────────────────────────────────────
// All images (level base + overlays) share the same 1120×260 dimensions.
// lvlcard_mask is applied as a CSS mask-image to clip the base image shape.
// shadow, highlight, glow are stacked overlays on top of the masked base.
// titlebg (1120×90) is centered at the bottom as a background-image plate.

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

function LevelCard({ campaignId, actId, level, playHoverSound, playClickSound }) {
  const [hovered, setHovered]       = useState(false);
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
      {/* Shadow + glow — unmasked; torn border bleeds outside the card edges */}
      <img src={lvlcardShadow} className="coop-level-overlay" alt="" draggable={false} />
      <img src={lvlcardGlow} className={`coop-level-overlay coop-level-glow${hovered ? ' active' : ''}`} alt="" draggable={false} />

      {/* Level image + titlebg — both inside one masked div.
          mask-image clips the element AND all its children, so the titlebg
          inherits the card's torn-edge shape from the same 1120×260 mask. */}
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
        {/* Highlight — inside the masked div so it's clipped to the torn card shape */}
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
