import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ActivityProvider } from './discord/ActivityProvider'
import { ActivityProvider as MockActivityProvider } from './discord/MockActivityProvider'
import { ErrorBoundary } from './components/ErrorBoundary'

// Home screen assets — preloaded before the loading screen dismisses
import backgroundImg    from './assets/background-spinner.png'
import marbleBg         from './assets/marblebg2.png'
import playGameBtn      from './assets/PlayGameHomeButtonNew.png'
import civAndMapBtn     from './assets/CivAndMapHomeButtonNew.png'
import eventsBtn        from './assets/EventsHomeButtonNew.png'
import lockIcon         from './assets/lock_icon.png'
import aoe3Logo         from './assets/aoe3_de_logo.png'
import discordAppText   from './assets/DiscordAppTextNew.png'
import goldDivider      from './assets/GoldDivider.png'
import btnRedAvailable  from './assets/ButtonRedAvailable.png'
import btnRedClicked    from './assets/ButtonRedClicked.png'
import smokeLayer       from './assets/loadscreen_smoke.png'
import soundOn          from './assets/notification_sound_on.png'
import soundOff         from './assets/notification_sound_off.png'
import volumeSlider     from './assets/VolumeSlider.png'
import volumeNob        from './assets/VolumeNob.png'
import backNormal       from './assets/button_back_normal.png'
import backHover        from './assets/button_back_hover.png'
import coOpBtn          from './assets/CoOpButtonNew.png'

const homeScreenAssets = [
  backgroundImg, marbleBg,
  playGameBtn, civAndMapBtn, coOpBtn, eventsBtn,
  lockIcon, aoe3Logo, discordAppText, goldDivider,
  btnRedAvailable, btnRedClicked,
  smokeLayer,
  soundOn, soundOff, volumeSlider, volumeNob,
  backNormal, backHover,
];

const Provider = ActivityProvider;

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Provider assetsToPreload={homeScreenAssets}>
      <App />
    </Provider>
  </ErrorBoundary>
)
