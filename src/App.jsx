// (entire file — only small changes around the leaderboard rendering and the <style> block)
import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import "./App.css";
import questions from "./questions.json";
import { useDiscordActivity } from './discord/useDiscordActivity';
import { DiscordProxySocket } from './socket';
import {  safeLog } from './utils/logger';

import marbleBg from "./assets/marblebg2.png";
import woodPanelBg from "./assets/sendresource_bg.png";
import btnNormal from "./assets/combobox_button_normal.png";
import btnHover from "./assets/combobox_button_hover.png";
import btnDisabled from "./assets/combobox_button_disabled.png";
import btnMainMenuDisabled from "./assets/button_mainmenu_disabled.png";

import nicknameBg from "./assets/uiskirmishnickname_textentry.png";
import nicknameBgOver from "./assets/uiskirmishnickname_textentry_over.png";
import dividingLine from "./assets/dividingline.png";

// NEW — medal assets (top 3)
import medalFirst from "./assets/award_03.png"; // first place (gold)
import medalSecond from "./assets/award_02.png"; // second place (silver)
import medalThird from "./assets/award_01.png"; // third place (bronze)

// NEW — Import sounds
import clickSoundFile from "./assets/bigbutton.wav";
import hoverSoundFile from "./assets/hoverobject_short.wav";

// Background music tracks (playlist)
import someOfAKindFile from "./assets/SomeOfAKind.mp3";
import revolootinFile from "./assets/Revolootin.mp3";
import kothFile from "./assets/KOTH.mp3";

// Music toggle icons
import soundOnIcon from "./assets/notification_sound_on.png";
import soundOffIcon from "./assets/notification_sound_off.png";

// REVEAL SOUND (we'll decode and play via WebAudio)
import revealSoundFile from "./assets/chatreceived.wav";

// Card image utility
import { getCardImageUrl } from './utils/cardImages';

// API configuration - use same base URL as socket
const API_BASE_URL = '/api';

const MAX_TIME = 15;

// Volume/fade settings
const NORMAL_VOLUME = 0.6; // volume when question is active
const FADED_VOLUME = 0.08; // volume when question ended (faded down)
const FADE_DURATION = 800; // milliseconds

// Scoring config
const MAX_POINTS = 150; // points for an instant (maximum)
// Scoring shape: use a power curve f(x) = x^k where x = timeLeft / MAX_TIME in [0..1].
// When k > 1 the curve drops steeply when timeLeft falls a little from the maximum,
// then flattens out as time approaches 0 — this matches "steep at first, then less steep".
// Increase SCORING_EXPONENT to make the initial falloff steeper (e.g. 3). 
const SCORING_EXPONENT = 2;

// Helper: format numbers with commas (e.g. 1000 -> "1,000")
// Uses the user's locale; falls back to a safe numeric conversion.
const formatNumber = (n) => {
  if (n === null || n === undefined) return "0";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString();
};

// Age of Empires III Home City Cards
const cardNames = [
  "Conquistador", "Team Fencing Instructor", "Unction", "Team Spanish Road", "Team Hidalgos",
  "Native Lore", "Advanced Trading Post", "Town Militia", "Pioneers", "Advanced Mill",
  "Advanced Market", "Advanced Estate", "Advanced Dock", "Llama Ranching", "Ranching",
  "Fish Market", "Schooners", "Sawmills", "Exotic Hardwoods", "Team Ironmonger",
  "Stockyards", "Furrier", "Rum Distillery", "Capitalism", "Stonemasons",
  "Land Grab", "Team Coastal Defenses", "Tercio Tactics", "Reconquista", "Advanced Arsenal",
  "Extensive Fortifications", "Rendering Plant", "Silversmith", "Sustainable Agriculture", "Spice Trade",
  "Medicine", "Cigar Roller", "Spanish Galleons", "Theaters", "Caballeros",
  "Liberation March", "Spanish Gold", "Armada", "Mercenary Loyalty", "Grenade Launchers",
  "Improved Buildings", "Blood Brothers", "Peninsular Guerrillas", "Advanced Balloon", "Florence Nightingale",
  "Virginia Company", "South Sea Bubble", "Fulling Mills", "Yeomen", "Siege Archery",
  "Master Surgeons", "Northwest Passage", "Distributivism", "Wilderness Warfare", "French Royal Army",
  "Naval Gunners", "Thoroughbreds", "Gribeauval System", "Navigator", "Agents",
  "Portuguese White Fleet", "Carracks", "Stadhouder", "Admiral Tromp", "Tulip Speculation",
  "Willem", "Polar Explorer", "Engineering School", "Suvorov Reforms", "Ransack",
  "Polk", "Offshore Support", "Germantown Farmers", "Guild Artisans", "Spanish Riding School",
  "Mosque Construction", "Flight Archery", "New Ways", "Beaver Wars", "Medicine Wheels",
  "Black Arrow", "Silent Strike", "Smoking Mirror", "Boxer Rebellion", "Western Reforms",
  "Advanced Wonders", "Seven Lucky Gods", "Desert Terror", "Foreign Logging", "Salt Ponds",
  "Imperial Unity", "Duelist", "Trample Tactics", "Virginia Oak", "Coffee Mill Guns",
  "Bushburning", "Beekeepers", "Koose", "Kingslayer", "Barbacoa",
  "Man of Destiny", "Freemasons", "Admirality", "Advanced Commanderies", "Bailiff",
  "Fire Towers", "Native Treaties", "Advanced Scouts", "Grain Market", "Chinampa",
  "Knight Hitpoints", "Knight Attack", "Aztec Mining", "Ritual Gladiators", "Artificial Islands",
  "Knight Combat", "Scorched Earth", "Aztec Fortification", "Chichimeca Rebellion", "Wall of Skulls",
  "Old Ways", "Improved Warships", "Terraced Houses", "Rangers", "Textile Mill",
  "Refrigeration", "Royal Mint", "Greenwich Time", "Dowager Empress", "Year of the Goat",
  "Year of the Tiger", "Year of the Ox", "Year of the Dragon", "Acupuncture",
  "Repelling Volley", "Native Crafts", "Colbertism", "Cartridge Currency", "European Cannons",
  "Voyageur", "Solingen Steel", "Town Destroyer", "Battlefield Construction", "Conservative Tactics",
  "Dane Guns"
];

// Helper: Convert card name to image path
const getCardImagePath = (cardName) => {
  // Convert spaces to underscores and remove special characters for filename
  const fileName = cardName.replace(/\s+/g, '_').replace(/[:/]/g, '');
  return new URL(`./assets/cards/${fileName}.png`, import.meta.url).href;
};

export default function App() {
  // Players will be populated from Discord voice channel
  const [players, setPlayers] = useState([]);

  // Socket state for multiplayer communication
  const [socket, setSocket] = useState(null);

  // Use Discord Activity hook
  const { 
    voiceChannel, 
    participants, 
    currentUser,
    instanceId,
    channelId,
    isHost,
    isInVoiceChannel,
    ready
  } = useDiscordActivity();

  // Use Discord channel ID as room ID so all players in same voice channel join same game
  // Prioritize channelId, but extract channelId from instanceId as fallback
  let roomId = channelId;
  
  if (!roomId && instanceId) {
    // instanceId format: i-{sessionId}-gc-{guildId}-{channelId}
    // Extract channelId from instanceId as fallback
    const instanceParts = instanceId.split('-');
    if (instanceParts.length >= 4) {
      roomId = instanceParts[instanceParts.length - 1]; // Last part is channelId
    } else {
      roomId = instanceId; // Use full instanceId if parsing fails
    }
  }
  
  if (!roomId) {
    roomId = "fallback-quiz-room";
  }
  
  safeLog.room('🏠 Using room ID:', roomId);
  // logger.debug('🔍 Discord Activity Values (partial):', { 
  //   hasChannelId: !!channelId, 
  //   hasInstanceId: !!instanceId,
  //   isInVoiceChannel, 
  //   participantCount: participants?.length || 0,
  //   finalRoomId: roomId ? 'room_***' : null
  // });

  const [availableQuestions, setAvailableQuestions] = useState([...questions]); // Not used anymore but keep for compatibility
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selections, setSelections] = useState({}); // Final revealed selections
  const [mySelection, setMySelectionState] = useState(null); // Only my selection (for immediate feedback)
  
  // Wrapper for mySelection state management
  const setMySelection = (value) => {
    // Only log when actually setting a selection (not clearing)
    if (value !== null) {
      console.log('✅ Setting mySelection to:', value);
    }
    setMySelectionState(value);
  };
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [showResult, setShowResult] = useState(false);
  const [scores, setScores] = useState({});
  const [serverScoredThisRound, setServerScoredThisRound] = useState(false);
  const [playerNames, setPlayerNames] = useState({}); // Player names from server
  
  // Leaderboard UI state
  const [isLeaderboardCollapsed, setIsLeaderboardCollapsed] = useState(false);
  const [leaderboardPosition, setLeaderboardPosition] = useState({ x: 0, y: 92 }); 
  const [isDraggingLeaderboard, setIsDraggingLeaderboard] = useState(false);
  
  // Set initial leaderboard position from the right edge
  useEffect(() => {
    const setInitialPosition = () => {
      setLeaderboardPosition({ 
        x: window.innerWidth - 300, // 280px width + 20px margin from right
        y: 92 
      });
    };
    
    // Set position immediately and on window resize
    setInitialPosition();
    window.addEventListener('resize', setInitialPosition);
    
    return () => window.removeEventListener('resize', setInitialPosition);
  }, []);

  const [isLoading, setIsLoading] = useState(true); // Loading state for server questions
  const [isTimerRunning, setIsTimerRunning] = useState(false); // Track timer state to prevent sync conflicts
  const [isTransitioning, setIsTransitioning] = useState(false); // Loading state for question transitions

  // For card-mode: input state and last attempt feedback
  const [cardInput, setCardInput] = useState("");
  const [cardLastWrong, setCardLastWrong] = useState(false);
  const [cardImageUrl, setCardImageUrl] = useState(null); // Dynamically loaded card image URL

  // Animated display scores (counts up when underlying `scores` changes)
  const [displayScores, setDisplayScores] = useState({});
  const displayScoresRef = useRef(displayScores);
  useEffect(() => {
    displayScoresRef.current = displayScores;
  }, [displayScores]);

  // whether music is toggled on (user-visible setting)
  const [musicEnabled, setMusicEnabled] = useState(true);

  // Socket state trigger for useEffect re-runs when socket properties change
  const [socketStateVersion, setSocketStateVersion] = useState(0);

  // Safety timeout for transition state to prevent getting stuck
  useEffect(() => {
    if (isTransitioning) {
      const timeout = setTimeout(() => {
        // console.log('⚠️ Transition timeout - resetting isTransitioning state');
        setIsTransitioning(false);
      }, 5000); // 5 second safety timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isTransitioning]);

  const timerRef = useRef(null);

  // Track whether awarding has been performed for the current question
  const awardedDoneRef = useRef(false);
  
  // Debounce ref to prevent rapid transition toggling
  const transitionDebounceRef = useRef(null);
  
  // Store current selection in ref for persistence during reveals
  const currentSelectionRef = useRef(null);

  // Record per-player answer-time (timeLeft at moment of click)
  // shape: { playerId: number (timeLeftAtClick), ... }
  const answerTimesRef = useRef({});

  // NEW — Audio refs
  const clickSound = useRef(new Audio(clickSoundFile));
  const hoverSound = useRef(new Audio(hoverSoundFile));

  // WEB AUDIO for reveal sound
  const audioCtxRef = useRef(null);
  const revealBufferRef = useRef(null);
  const audioUnlockedRef = useRef(false); // whether audio context has been resumed
  const pendingRevealRef = useRef(false); // if reveal should play when context resumes

  // Playlist audio refs
  const bg = useRef({
    tracks: [], // array of Audio objects in playlist order
  });

  // index of currently playing track in bg.current.tracks
  const currentIndexRef = useRef(0);

  // single fade timer for current audio
  const fadeTimerRef = useRef(null);

  // Clean up timers when Discord Activity ready state changes (activity stop/start)
  useEffect(() => {
    // When Discord Activity is not ready (stopped), clean up all timers
    if (!ready) {
      // console.log('🧹 Discord Activity not ready - cleaning up timers');
      
      // Clear the main game timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Clear fade timer
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      
      // Clear transition debounce
      if (transitionDebounceRef.current) {
        clearTimeout(transitionDebounceRef.current);
        transitionDebounceRef.current = null;
      }
      
      // Reset timer-related state
      setIsTimerRunning(false);
      setIsTransitioning(false);
      
      // Notify server that activity is ending (trigger room cleanup)
      if (socket && roomId) {
        socket.emit('activity_ended', { roomId });
        console.log('📴 Notified server of activity end for room:', roomId);
      }
      
      // Reset game state when activity stops for fresh start on next launch
      setTimeLeft(MAX_TIME);
      setShowResult(false);
      setCurrentQuestion(null);
      setSelections({});
      setMySelection(null);
      currentSelectionRef.current = null;
      window.lastSelectionTime = null;
      window.lastSelectionQuestionId = null;
      console.log('🔄 Game state reset for fresh start');
    }
  }, [ready, socket, roomId]); // Trigger when Discord Activity ready state changes

  // Setup socket event listeners when socket is available
  useEffect(() => {
    if (!socket || !currentUser) return;
    
    // Set up socket event listeners
    socket.on('gameState', (gameState) => {
      // console.log('📡 Received gameState:', gameState);
      
      // Check if this is a new question - if so, clear selections
      const isNewQuestion = currentQuestion?.id !== gameState.currentQuestion?.id;
      
      setCurrentQuestion(gameState.currentQuestion);
      
      // Only set selections if not a new question, otherwise clear them
      if (isNewQuestion) {
        // Only clear when safe - never during active gameplay
        console.log('� Socket detected question change:', { from: currentQuestion?.id, to: gameState.currentQuestion?.id });
        // Smart clearing: Check if it's truly a different question by comparing content
        const isRealQuestionChange = 
          currentQuestion.isCard !== gameState.currentQuestion.isCard ||
          (currentQuestion.isCard && currentQuestion.cardName !== gameState.currentQuestion.cardName) ||
          (!currentQuestion.isCard && currentQuestion.question !== gameState.currentQuestion.question);
        
        // Time-based protection for socket events too
        const timeSinceLastSelection = Date.now() - (window.lastSelectionTime || 0);
        const recentlySelected = timeSinceLastSelection < 10000; // 10 seconds protection
        
        // ONLY preserve selections during active reveal phase (when showResult is true)
        // If we're moving to a new question and NOT showing results, clear selections
        const isInRevealPhase = showResult || gameState.showResult;
        
        if (isRealQuestionChange && !recentlySelected && !isInRevealPhase) {
          console.log('🆕 Socket: Real question change - clearing selections');
          setSelections({});
          setMySelection(null);
          currentSelectionRef.current = null;
          window.lastSelectionTime = null;
          window.lastSelectionQuestionId = null;
        } else if (recentlySelected) {
          console.log('🛡️ Socket: Recently selected - protecting user choice');
        } else if (isInRevealPhase) {
          console.log('🏆 Socket: Preserving selections - results are being/were revealed');
        } else {
          console.log('🎯 Socket: Same question content - preserving selections');
        }
      } else {
        // Preserve local selection when syncing with server gameState
        const currentLocalSelection = mySelection !== null ? mySelection : currentSelectionRef.current;
        if (currentLocalSelection !== null && playerName) {
          console.log('🔄 [GameState] Preserving local selection:', { 
            playerName, 
            localSelection: currentLocalSelection,
            serverSelections: gameState.selections 
          });
          setSelections({
            ...(gameState.selections || {}),
            [playerName]: currentLocalSelection
          });
        } else {
          setSelections(gameState.selections || {});
        }
      }
      
      setShowResult(gameState.showResult); 
      setTimeLeft(gameState.timeLeft);
      setScores(gameState.scores);
    });

    // Listen for server responses to multiplayer events
    socket.on('question_started', (data) => {
      // console.log('📡 Received question_started from server:', data);
      if (data.question) {
        const isNewQuestion = !currentQuestion || currentQuestion.id !== data.question.id;
        
        setCurrentQuestion(data.question);
        setShowResult(false);
        
        if (isNewQuestion) {
          // Only reset selections for truly new questions
          console.log('🆕 New question detected, clearing selections:', data.question.id);
          setSelections({});
          setMySelection(null);
          currentSelectionRef.current = null;
          window.lastSelectionTime = null;
          window.lastSelectionQuestionId = null;
          // Reset per-question tracking
          answerTimesRef.current = {};
          awardedDoneRef.current = false;
        } else {
          console.log('🔄 Same question in question_started, preserving selection');
        }
        
        setTimeLeft(data.timeLeft || MAX_TIME);
      }
      
    });

    // Listen for round completion and reveal phase
    socket.on('round_complete', (data) => {
      // console.log('📡 Round complete - revealing all selections:', data);
      if (data.selections) {
        setSelections(data.selections);
        setShowResult(true);
        // Update scores if provided
        if (data.scores) {
          setScores(data.scores);
        }
        // Update player names if provided  
        if (data.playerNames) {
          // console.log('📝 Updating player names from round_complete:', data.playerNames);
          setPlayerNames(prevNames => ({ ...prevNames, ...data.playerNames }));
        }
      }
    });

    socket.on('player_selected', (data) => {
      // console.log('📡 Player made selection (hidden until reveal):', data.playerId);
      // Don't show the actual selection - just acknowledge someone selected
      // This could be used for "Player X has answered" indicators
    });

    socket.on('playerJoined', (player) => {
      // console.log('📡 Player joined via socket:', player);
      setPlayers(prev => {
        // Avoid duplicates
        if (prev.find(p => p.id === player.id)) {
          return prev;
        }
        return [...prev, player];
      });
    });

    // Remove local mode initialization - we now sync with Discord participants
    // The participants useEffect will handle both multiplayer and single player setup

    socket.on('playerLeft', (playerId) => {
      // console.log('📡 Player left via socket:', playerId);
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });

    // Send current user info if socket is connected
    if (socket.connected && !socket.localMode) {
      socket.emit('join', {
        id: currentUser.id,
        name: currentUser.username,
        isHost
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket, currentUser, isHost]);

  // Load card image when currentQuestion is a card
  useEffect(() => {
    if (currentQuestion?.isCard && currentQuestion?.cardName) {
      // console.log('🃏 Loading card image for:', currentQuestion.cardName);
      // Clear previous card input and feedback when new card question arrives
      setCardInput("");
      setCardLastWrong(false);
      // Clear previous card image immediately to prevent flash
      setCardImageUrl(null);
      
      getCardImageUrl(currentQuestion.cardName)
        .then((imageUrl) => {
          // console.log('🃏 Card image loaded:', imageUrl);
          setCardImageUrl(imageUrl);
        })
        .catch((error) => {
          // console.error('🃏 Failed to load card image:', error);
          setCardImageUrl(null);
        });
    } else {
      // Not a card question, clear all card-related state
      setCardImageUrl(null);
      setCardInput("");
      setCardLastWrong(false);
    }
  }, [currentQuestion?.id, currentQuestion?.isCard, currentQuestion?.cardName]); // Only trigger on actual question changes

  // Debug mySelection changes
  useEffect(() => {
    // console.log(`🎯 MySelection changed to:`, mySelection);
  }, [mySelection]);

  // For animation (FLIP) of leaderboard
  // We store the previous bounding rects so we can compute deltas when order changes
  const prevRectsRef = useRef({});

  // Animation frames refs for the score count animations so we can cancel if needed
  const scoreAnimFramesRef = useRef({});

  // Prevent double execution of initial game check
  const gameCheckExecutedRef = useRef(false);
  const gameCheckRetriesRef = useRef(0);
  const MAX_SOCKET_WAIT_RETRIES = 6; // Wait up to 3 seconds for socket
  const questionFetchInProgressRef = useRef(false); // Prevent duplicate question fetches

  // small highlight state for when score bumps (used to add a temporary CSS class)
  const [scoreHighlight, setScoreHighlight] = useState({});

  // helper: fade an audio element to target volume over duration (single timer)
  const fadeTo = (audio, targetVolume, duration = FADE_DURATION) => {
    if (!audio) return;
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    const intervalMs = 50;
    const steps = Math.max(1, Math.floor(duration / intervalMs));
    const start = Number(audio.volume) || 0;
    const delta = targetVolume - start;
    let step = 0;

    fadeTimerRef.current = setInterval(() => {
      step++;
      const fraction = step / steps;
      const newVol = Math.max(0, Math.min(1, start + delta * fraction));
      audio.volume = newVol;
      if (step >= steps) {
        clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
        audio.volume = Math.max(0, Math.min(1, targetVolume)); // final exact value
      }
    }, intervalMs);
  };

  // helper: pause all tracks
  const pauseAllTracks = () => {
    bg.current.tracks.forEach((t) => {
      try {
        t.pause();
      } catch (e) {}
    });
  };

  // play the track at given index (pauses others)
  const playTrackAt = (index) => {
    const tracks = bg.current.tracks;
    if (!tracks || tracks.length === 0) return;
    index = ((index % tracks.length) + tracks.length) % tracks.length;
    currentIndexRef.current = index;

    // pause other tracks
    tracks.forEach((t, i) => {
      if (!t) return;
      if (i !== index) {
        try {
          t.pause();
          // don't reset currentTime — we want tracks to play full when they come up again
        } catch (e) {}
      }
    });

    const current = tracks[index];
    if (!current) return;

    // set appropriate volume depending on showResult
    current.volume = showResult ? FADED_VOLUME : NORMAL_VOLUME;

    const p = current.play();
    if (p && typeof p.catch === "function") {
      p.catch((err) => {
        // console.warn("playTrackAt play() rejected:", err);
      });
    }
  };

    // Initialize socket connection when Discord user info is available
  useEffect(() => {
    if (currentUser?.username && !socket) {
      // console.log('🎮 Initializing multiplayer socket for:', currentUser.username);
      
      const initSocket = async () => {
        try {
          const newSocket = new DiscordProxySocket();
          
          // Set up state change callback to trigger React re-renders
          newSocket.onStateChange(() => {
            setSocketStateVersion(prev => prev + 1);
          });
          
          const connected = await newSocket.connect();
          
          if (connected && !newSocket.localMode) {
            // console.log('🌐 Successfully connected to multiplayer mode');
            
            // Join shared room with retry logic
            let joinAttempts = 0;
            const maxAttempts = 3;
            
            const joinRoom = async () => {
              try {
                await newSocket.emit('join_room', { 
                  room: roomId, 
                  username: currentUser.username 
                });
                // console.log(`🏠 Joined room: ${roomId} as ${currentUser.username}`);
              } catch (error) {
                joinAttempts++;
                // console.log(`⚠️ Join room attempt ${joinAttempts} failed:`, error.message);
                
                if (joinAttempts < maxAttempts) {
                  // console.log(`🔄 Retrying join room in 2 seconds...`);
                  setTimeout(joinRoom, 2000);
                } else {
                  // console.log('❌ Failed to join room after max attempts');
                }
              }
            };
            
            await joinRoom();
          } else {
            // console.log('🏠 Using local single-player mode');
          }
          
          setSocket(newSocket);
        } catch (error) {
          // console.error('❌ Socket initialization failed:', error);
        }
      };
      
      initSocket();
    }
  }, [currentUser, roomId, socket]);

  // Component cleanup - ensure all timers are cleared when component unmounts
  useEffect(() => {
    return () => {
      // console.log('🧹 Component unmounting - cleaning up all timers');
      
      // Clear all timer refs
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current);
      }
      
      if (transitionDebounceRef.current) {
        clearTimeout(transitionDebounceRef.current);
      }
    };
  }, []); // Empty dependency array - only runs on unmount

  // Sync Discord participants with players state
  useEffect(() => {
    if (participants && participants.length > 0 && currentUser) {
      // console.log('🎮 Syncing Discord participants to players:', participants);
      
      // Convert Discord participants to player objects using Discord's proper format
      const discordPlayers = participants.map(participant => {
        const user = participant.user || participant;
        
        // Use Discord's recommended username format
        const displayName = user.global_name || user.username || 'Discord User';
        
        // Generate Discord avatar URL using proper CDN format
        let avatarUrl = '';
        if (user.avatar) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
        } else {
          const defaultAvatarIndex = (BigInt(user.id) >> 22n) % 6n;
          avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        }
        
        return {
          id: user.id,
          name: displayName,
          avatar: avatarUrl
        };
      });
      
      // Make sure current user is included (should already be from participants API)
      if (currentUser && !discordPlayers.find(p => p.id === currentUser.id)) {
        const currentUserDisplayName = currentUser.global_name || currentUser.username || 'You';
        let currentUserAvatar = '';
        if (currentUser.avatar) {
          currentUserAvatar = `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=256`;
        } else {
          const defaultAvatarIndex = (BigInt(currentUser.id) >> 22n) % 6n;
          currentUserAvatar = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        }
        
        discordPlayers.unshift({
          id: currentUser.id,
          name: currentUserDisplayName,
          avatar: currentUserAvatar
        });
      }
      
      setPlayers(discordPlayers);
      
      // Initialize scores for all players
      const initialScores = {};
      discordPlayers.forEach(player => {
        initialScores[player.id] = 0;
      });
      setScores(initialScores);
      
      // console.log('✅ Players synced with Discord instance:', discordPlayers);
    } else if (!participants || participants.length === 0) {
      // Fallback to single player mode with current user
      if (currentUser) {
        const currentUserDisplayName = currentUser.global_name || currentUser.username || 'You';
        let currentUserAvatar = '';
        if (currentUser.avatar) {
          currentUserAvatar = `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=256`;
        } else {
          const defaultAvatarIndex = (BigInt(currentUser.id) >> 22n) % 6n;
          currentUserAvatar = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        }
        
        const singlePlayer = {
          id: currentUser.id,
          name: currentUserDisplayName,
          avatar: currentUserAvatar
        };
        setPlayers([singlePlayer]);
        setScores({[singlePlayer.id]: 0});
        // console.log('🏠 Fallback to single player mode:', singlePlayer);
      }
    }
  }, [participants, currentUser]);

// Initialize playlist audios on mount AND create AudioContext + decode reveal sound
useEffect(() => {
  // create playlist audios
  try {
      const files = [someOfAKindFile, revolootinFile, kothFile];
      const created = files.map((f, i) => {
        const a = new Audio(f);
        a.preload = "auto";
        a.loop = false; // we'll chain via 'ended' to go to next track
        a.volume = NORMAL_VOLUME;
        a.crossOrigin = "anonymous";

        // ended: advance to next track and play it
        const onEnded = () => {
          const next = (currentIndexRef.current + 1) % files.length;
          currentIndexRef.current = next;
          // only auto-advance/play if music is enabled
          if (musicEnabled) playTrackAt(next);
        };

        // attach listener
        a.addEventListener("ended", onEnded);
        a._onEnded = onEnded;

        return a;
      });

      bg.current.tracks = created;
    } catch (err) {
      // console.error("Error creating playlist audios:", err);
    }

    // create audio context and decode reveal sound
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();

      // fetch the revealSoundFile (import gives a URL) and decode
      (async () => {
        try {
          const resp = await fetch(revealSoundFile);
          const arrayBuffer = await resp.arrayBuffer();
          const decoded = await audioCtxRef.current.decodeAudioData(arrayBuffer);
          revealBufferRef.current = decoded;
        } catch (err) {
          // console.warn("Failed to load/decode reveal sound:", err);
        }
      })();
    } catch (e) {
      // console.warn("WebAudio not available:", e);
    }

    // cleanup on unmount: remove listeners, pause and free
    return () => {
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      bg.current.tracks.forEach((a) => {
        try {
          if (a._onEnded) a.removeEventListener("ended", a._onEnded);
          a.pause();
          a.src = "";
        } catch (e) {}
      });
      bg.current.tracks = [];

      // close audio context
      try {
        if (audioCtxRef.current && audioCtxRef.current.close) {
          audioCtxRef.current.close();
        }
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper: unlock/resume the audio context on user gesture and play any pending reveal
  const unlockAudioContext = async () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      audioUnlockedRef.current = true;
      // if reveal was pending, play it now
      if (pendingRevealRef.current && revealBufferRef.current) {
        playRevealBuffer();
        pendingRevealRef.current = false;
      }
    } catch (e) {
      // ignore
    }
  };

  // one-time pointerdown unlock attempt (in case user interacts somewhere else)
  useEffect(() => {
    const handler = () => {
      unlockAudioContext();
      window.removeEventListener("pointerdown", handler);
    };
    window.addEventListener("pointerdown", handler, { once: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

  // play reveal buffer via Web Audio
  const playRevealBuffer = () => {
    const ctx = audioCtxRef.current;
    const buffer = revealBufferRef.current;
    if (!ctx || !buffer) return;
    try {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = 1.0; // tweak if too loud
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(0);
      // no need to keep a reference — it will close after playback
    } catch (e) {
      // console.warn("Failed to play reveal buffer:", e);
    }
  };

  // function that attempts to play the current track (must be called from a user gesture to satisfy autoplay)
  const startBackgroundMusic = () => {
    if (!musicEnabled) return;
    const tracks = bg.current.tracks;
    if (!tracks || tracks.length === 0) {
      // console.warn("Playlist not ready yet.");
      return;
    }

    // ensure AudioContext is unlocked/resumed as well (so reveal sound will work later)
    unlockAudioContext();

    // attempt to play the track at current index
    const indexToPlay = currentIndexRef.current || 0;
    try {
      playTrackAt(indexToPlay);
      // console.log("Background playlist started at index", indexToPlay);
    } catch (err) {
      // console.warn("startBackgroundMusic: play failed:", err);
    }
  };

  // Attach one-time pointerdown to start music on first user gesture (only if musicEnabled)
  useEffect(() => {
    const tryAutoStart = () => {
      if (musicEnabled) startBackgroundMusic();
      window.removeEventListener("pointerdown", tryAutoStart);
    };
    window.addEventListener("pointerdown", tryAutoStart, { once: true });
    return () => window.removeEventListener("pointerdown", tryAutoStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicEnabled]);

  // When showResult changes, fade the currently-playing track down/up (only if music enabled)
  // and play the reveal sound once (via WebAudio) when results are shown.
  useEffect(() => {
    if (showResult) {
      // attempt to play via WebAudio
      if (audioUnlockedRef.current && revealBufferRef.current) {
        playRevealBuffer();
      } else {
        // can't play now — mark pending to play once context is unlocked
        pendingRevealRef.current = true;
      }
    }

    if (!musicEnabled) return;
    const tracks = bg.current.tracks;
    if (!tracks || tracks.length === 0) return;
    const current = tracks[currentIndexRef.current] || tracks[0];
    if (!current) return;

    if (showResult) {
      fadeTo(current, FADED_VOLUME, FADE_DURATION);
    } else {
      // try resume if paused
      current
        .play()
        .catch(() => {
          /* ignore */
        })
        .finally(() => {
          fadeTo(current, NORMAL_VOLUME, FADE_DURATION);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult, musicEnabled]);

  // toggle music on/off handler
  const toggleMusic = (e) => {
    e.stopPropagation();
    const newValue = !musicEnabled;
    setMusicEnabled(newValue);

    if (newValue) {
      // user turned music ON — this click is a user gesture so play() should be allowed
      startBackgroundMusic();
    } else {
      // user turned music OFF — pause immediately
      try {
        pauseAllTracks();
      } catch (err) {}
      // clear fade timer if any
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    }
  };

  const playClickSound = () => {
    // attempt to start background music if enabled (user gesture)
    if (musicEnabled) startBackgroundMusic();

    // unlocking audio context on any user click will also flush pending reveal sounds
    unlockAudioContext();

    clickSound.current.currentTime = 0;
    clickSound.current.play().catch(() => {});
  };

  const playHoverSound = () => {
    hoverSound.current.currentTime = 0;
    hoverSound.current.play().catch(() => {});
  };

  useEffect(() => {
    // Delay initial question fetch to ensure Discord integration stabilizes
    const initializeQuestion = async () => {
      // Wait a bit for Discord currentUser to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Always get questions from server - no more local generation
      const getQuestionFromServer = async () => {
        // Prevent duplicate question fetches
        if (questionFetchInProgressRef.current) {
          // console.log('⚠️ Question fetch already in progress, skipping duplicate');
          return;
        }
        
        questionFetchInProgressRef.current = true;
        setIsLoading(true);
        
        try {
          // Simplified check - just ensure we have basic requirements
          if (!roomId) {
            // console.log('❌ No room ID available, cannot proceed');
            // Keep loading screen for at least 1 second even if no roomId
            setTimeout(() => {
              setIsLoading(false);
              questionFetchInProgressRef.current = false;
            }, 1000);
            return;
          }

          // Skip the Discord user wait - we'll proceed with what we have
          // console.log('🌐 Getting question from server for room:', roomId);
          
          try {
            // Check if room already has an active question FIRST
            const gameStateResponse = await fetch(`${API_BASE_URL}/game-state/${roomId}`);
            const gameStateData = await gameStateResponse.json();
            
            if (gameStateData.success && gameStateData.currentQuestion) {
              // console.log('✅ Found existing question in room - timer at:', gameStateData.timeLeft);
              // Batch all state updates to prevent flickering
              const question = gameStateData.currentQuestion;
              const timeLeft = gameStateData.timeLeft;
              const showResult = gameStateData.showResult || timeLeft <= 0;
              
              // Only reset selection if this is actually a different question
              const isSameQuestion = currentQuestion && currentQuestion.id === question.id;
              // console.log('🔄 Initial question load:', { isSameQuestion, currentId: currentQuestion?.id, serverId: question.id });
              
              setCurrentQuestion(question);
              setTimeLeft(timeLeft);
              setShowResult(showResult);
              setSelections({});
              if (!isSameQuestion) {
                // console.log('🗑️ Clearing selection due to different question in initial load');
                setMySelection(null);
                currentSelectionRef.current = null;
                window.lastSelectionTime = null;
                window.lastSelectionQuestionId = null;
              } else {
                // console.log('✅ Preserving selection - same question in initial load');
              }
              answerTimesRef.current = {};
              awardedDoneRef.current = false;
              setIsLoading(false);
              questionFetchInProgressRef.current = false;
              return;
            }

            // No active question - DON'T auto-start on join
            // Let players manually start via "Start Question" or "Next Question"
            // This prevents joining players from triggering new questions mid-game
            // console.log('ℹ️ No active question in room - waiting for host to start');
            // Clear any stale state
            setCurrentQuestion(null);
            setShowResult(false);
            setSelections({});
            setMySelection(null);
            currentSelectionRef.current = null;
            window.lastSelectionTime = null;
            window.lastSelectionQuestionId = null;
            answerTimesRef.current = {};
            awardedDoneRef.current = false;
            
          } catch (error) {
            // console.error('❌ Error getting question from server:', error);
          }
        } finally {
          // Ensure loading screen shows for at least 1.5 seconds for better UX
          setTimeout(() => {
            setIsLoading(false);
            questionFetchInProgressRef.current = false;
          }, 1500);
        }
      };

      // Only fetch if we don't already have a current question (prevent duplicate fetches)
      if (!currentQuestion && !questionFetchInProgressRef.current) {
        getQuestionFromServer();
      }
    };

    initializeQuestion();
  }, [roomId]); // Only depend on roomId, let Discord integration settle naturally

  // console.log('🔍 DEBUG: Top level component state:', {
    // socket: !!socket,
    // socketConnected: socket?.connected,
    // socketLocalMode: socket?.localMode,
    // currentUser: !!currentUser,
    // roomId,
    // currentQuestion: !!currentQuestion
  // });

  // Continuous synchronization for multiplayer
  useEffect(() => {
    // console.log('🔧 SYNC USEEFFECT TRIGGERED! Checking conditions...');
    // console.log('🔧 Sync useEffect triggered with conditions:', {
      // socket: !!socket,
      // localMode: socket?.localMode,
      // connected: socket?.connected,
      // currentUser: !!currentUser,
      // roomId,
      // shouldSync: !(!socket || socket.localMode || !socket.connected || !currentUser || !roomId)
    // });
    
    if (!socket || socket.localMode || !socket.connected || !currentUser || !roomId) {
      // console.log('❌ Sync disabled - conditions not met. Details:', {
        // noSocket: !socket,
        // localMode: socket?.localMode,
        // notConnected: !socket?.connected,
        // noCurrentUser: !currentUser,
        // noRoomId: !roomId
      // });
      return;
    }

    // console.log('✅ Starting sync for multiplayer mode');
    const syncGameState = async () => {
      // Don't sync if question fetch is in progress to prevent conflicts
      if (questionFetchInProgressRef.current) {
        // console.log('⚠️ Skipping sync - question fetch in progress');
        return;
      }
      
      // console.log('🔄 Sync executing for room:', roomId);
      try {
        // Use game-state endpoint to sync without generating new questions
        const response = await fetch(`${API_BASE_URL}/game-state/${roomId}`);
        const data = await response.json();
        // console.log('📡 Sync response:', { success: data.success, hasQuestion: !!data.currentQuestion });
        
        if (data.success && data.currentQuestion) {
          // Check if this is a different question than what we have
          // console.log('🔍 Sync check - Current question:', {
            // exists: !!currentQuestion,
            // isCard: currentQuestion?.isCard,
            // cardName: currentQuestion?.cardName,
            // questionText: currentQuestion?.question ? currentQuestion.question.substring(0, 30) + '...' : 'N/A'
          // });
          // console.log('🔍 Sync check - Server question:', {
            // isCard: data.currentQuestion.isCard,
            // cardName: data.currentQuestion.cardName,
            // questionText: data.currentQuestion.question ? data.currentQuestion.question.substring(0, 30) + '...' : 'N/A'
          // });
          
          // Use question ID for more reliable comparison
          const currentQuestionId = currentQuestion?.id;
          const serverQuestionId = data.currentQuestion?.id;
          const isDifferentQuestion = !currentQuestion || currentQuestionId !== serverQuestionId;
          
          // console.log('🔍 Is different question?', isDifferentQuestion, `(current: ${currentQuestionId}, server: ${serverQuestionId})`);
          
          if (isDifferentQuestion) {
            // console.log("🔄 New question detected, syncing:", data.currentQuestion.isCard ? 'Card Question' : 'Regular Question');
            // console.log('📄 Client received question details:', {
              // isCard: data.currentQuestion.isCard,
              // cardName: data.currentQuestion.cardName,
              // cardUrl: data.currentQuestion.cardUrl,
              // questionText: data.currentQuestion.question ? data.currentQuestion.question.substring(0, 50) + '...' : 'N/A'
            // });
            
            // Only show transition loading if we detect a real question change
            // Check if there's actually a new question from server vs current client state
            const hasCurrentQuestion = currentQuestion && (currentQuestion.question || currentQuestion.questionText || currentQuestion.cardName);
            const hasServerQuestion = data.currentQuestion && (data.currentQuestion.question || data.currentQuestion.cardName);
            
            // console.log('🔄 Sync update:', { 
              // hasCurrentQuestion, 
              // hasServerQuestion,
              // currentQuestionId: currentQuestion?.id,
              // serverQuestionId: data.currentQuestion?.id
            // });
            
            // Don't show transition loaders from sync - let user actions handle transitions
            // Just update the question state without transitions
            
            // Batch all state updates together to prevent flickering
            setCurrentQuestion(data.currentQuestion);
            setTimeLeft(data.timeLeft);
            // Use server's showResult state - don't override during grace period
            setShowResult(data.showResult);
            
            // Only reset selections for truly new questions, preserve for same question
            if (currentQuestion && currentQuestionId !== serverQuestionId) {
              // Only clear selections when showing results or timer expired - never during active gameplay
              console.log('� Question ID changed:', { from: currentQuestionId, to: serverQuestionId });
              // Add time-based protection and detailed content logging
              const isRealQuestionChange = 
                currentQuestion.isCard !== data.currentQuestion.isCard ||
                (currentQuestion.isCard && currentQuestion.cardName !== data.currentQuestion.cardName) ||
                (!currentQuestion.isCard && currentQuestion.question !== data.currentQuestion.question);
              
              // Log what's actually different
              console.log('🔍 Content comparison:', {
                typeMatch: currentQuestion.isCard === data.currentQuestion.isCard,
                cardNameMatch: currentQuestion.cardName === data.currentQuestion.cardName,  
                questionMatch: currentQuestion.question === data.currentQuestion.question,
                isRealChange: isRealQuestionChange
              });
              
              // Time-based protection: Don't clear selections during active gameplay
              const timeSinceLastSelection = Date.now() - (window.lastSelectionTime || 0);
              const recentlySelected = timeSinceLastSelection < 10000; // 10 seconds protection
              
              // CRITICAL: Protect selections during active gameplay
              // If user has made a selection (mySelection or ref has value), never clear until reveal
              const hasActiveSelection = mySelection !== null || currentSelectionRef.current !== null;
              
              // CRITICAL: Never clear selections during reveal phase
              // This prevents badges from disappearing for ALL players (host and friends)
              // The server will send proper selection data in the reveal response
              const isInRevealPhase = showResult || data.showResult;
              
              // In local mode, don't clear selections automatically - let the game flow handle it
              const isLocalMode = socket?.localMode === true;
              
              // Only clear if: real change AND no active selection AND not in reveal AND not local mode
              if (isRealQuestionChange && !recentlySelected && !hasActiveSelection && !isInRevealPhase && !isLocalMode) {
                console.log('🆕 Real question change detected - clearing selections for fresh start');
                setSelections({});
                setMySelection(null);
                currentSelectionRef.current = null;
                window.lastSelectionTime = null; // Clear selection timestamp
                window.lastSelectionQuestionId = null; // Clear question ID
              } else if (isLocalMode) {
                console.log('🏠 Local mode - skipping auto-clear, letting game flow manage selections');
              } else if (recentlySelected) {
                console.log('🛡️ Recently selected - protecting user choice from clearing');
              } else if (hasActiveSelection) {
                console.log('🎯 Active selection detected - protecting green badge from clearing');
              } else if (isInRevealPhase) {
                console.log('🏆 Protecting reveal phase - NEVER clear selections during reveal');
              } else {
                console.log('🎯 Same question content, different ID - preserving selections');
              }
            } else {
              // console.log('✅ Preserving selection - same question or initial load');
              // For same question, sync server selections but preserve local selection
              if (data.selections) {
                const currentLocalSelection = mySelection !== null ? mySelection : currentSelectionRef.current;
                
                // CRITICAL: During reveal phase, ALWAYS preserve local selection
                // Never discard selections based on question ID during reveal
                const isInRevealPhase = showResult || data.showResult;
                
                if (isInRevealPhase && currentLocalSelection !== null && playerName) {
                  // Reveal phase - merge server data with local selection
                  console.log('🏆 [Sync] Same-question reveal phase - preserving local selection:', { 
                    playerName, 
                    localSelection: currentLocalSelection,
                    serverSelections: data.selections 
                  });
                  setSelections({
                    ...data.selections,
                    [playerName]: currentLocalSelection
                  });
                } else {
                  // Active gameplay - check timestamp AND question ID to prevent old selections from persisting
                  const selectionQuestionId = window.lastSelectionQuestionId;
                  const currentQuestionId = data.currentQuestion?.id;
                  const localSelectionBelongsToThisQuestion = 
                    currentLocalSelection !== null && 
                    playerName && 
                    window.lastSelectionTime && 
                    selectionQuestionId === currentQuestionId &&
                    (Date.now() - window.lastSelectionTime < MAX_TIME * 1000); // Within current question timeframe
                  
                  if (localSelectionBelongsToThisQuestion) {
                    // Merge server selections with local selection to prevent overwriting
                    console.log('🔄 [Sync] Preserving local selection:', { 
                      playerName, 
                      localSelection: currentLocalSelection,
                      serverSelections: data.selections 
                    });
                    setSelections({
                      ...data.selections,
                      [playerName]: currentLocalSelection
                    });
                  } else {
                    // Selection from different question or stale - use server data only
                    setSelections(data.selections);
                    if (selectionQuestionId !== currentQuestionId) {
                      console.log('⚠️ [Sync] Selection from different question in same-question path - using server data');
                    }
                  }
                }
              }
            }
            
            // Update scores and player names if provided from server
            if (data.scores) {
              setScores(data.scores);
            }
            if (data.playerNames) {
              // console.log('📝 [Sync] Updating player names from server:', data.playerNames);
              setPlayerNames(prevNames => ({ ...prevNames, ...data.playerNames }));
            }
            answerTimesRef.current = {};
            awardedDoneRef.current = false;
            
            // Transition hiding is now handled by debounce logic above
            
            // Update timer state - if time is already up, show result after a brief delay
            const shouldShowTimer = data.gameState === 'playing' && data.timeLeft > 0;
            setIsTimerRunning(shouldShowTimer);
            
            // If the question has already timed out, show results after a brief delay
            if (data.timeLeft <= 0 && data.showResult) {
              setTimeout(() => {
                setShowResult(true);
                setIsTimerRunning(false);
              }, 200);
            }
          } else {
            // Same question, just sync timer and result state - but only if significantly different
            // Don't sync timer/results during active gameplay to prevent mid-game disruption
            // BUT always allow new questions to sync through
            // IMPORTANT: Protect user selection until results are actually shown to prevent badge clearing
            const isActiveGameplay = !showResult;
            
            // Always sync showResult when server says it should be shown (critical for badge display)
            if (data.showResult !== showResult) {
              setShowResult(data.showResult);
              setIsTimerRunning(false);
            }
            
            if (!isActiveGameplay) {
              const timeDiff = Math.abs(timeLeft - data.timeLeft);
              if (timeDiff > 3) { // Increased threshold to prevent flickering
                // console.log(`🕒 Syncing timer: ${timeLeft}s → ${data.timeLeft}s`);
                setTimeLeft(data.timeLeft);
                setIsTimerRunning(data.gameState === 'playing' && !data.showResult && data.timeLeft > 0);
              }
            } else {
              // console.log('⏸️ Skipping timer sync - active gameplay in progress');
            }
            
            // Always sync selections and playerNames for same question (needed for reveal badges)
            // But be careful not to overwrite local selection during active gameplay
            // AND protect selections during reveal phase until server confirms them
            if (data.selections) {
              const isInRevealPhase = showResult || data.showResult;
              const hasLocalSelection = mySelection !== null || currentSelectionRef.current !== null;
              
              // During reveal phase: Merge server selections with local selection
              if (isInRevealPhase) {
                if (Object.keys(data.selections).length > 0) {
                  // Server sent reveal data - merge with local selection
                  const mergedSelections = { ...data.selections };
                  
                  // If we have a local selection, ensure it's included
                  if (hasLocalSelection && currentUser?.id) {
                    const localSelection = mySelection !== null ? mySelection : currentSelectionRef.current;
                    mergedSelections[currentUser.id] = localSelection;
                    console.log('🏆 [Sync] Reveal phase - merged server + local selections', {
                      serverSelections: data.selections,
                      currentUserId: currentUser.id,
                      localSelection,
                      mergedSelections
                    });
                  } else {
                    console.log('🏆 [Sync] Reveal phase - using server selections only', {
                      hasLocalSelection,
                      currentUserId: currentUser?.id,
                      serverSelections: data.selections
                    });
                  }
                  
                  setSelections(mergedSelections);
                } else {
                  // Server sent empty during reveal - keep what we have with local selection
                  if (hasLocalSelection && currentUser?.id) {
                    const localSelection = mySelection !== null ? mySelection : currentSelectionRef.current;
                    const preservedSelections = { ...selections, [currentUser.id]: localSelection };
                    setSelections(preservedSelections);
                    console.log('🛡️ [Sync] Reveal phase - server sent empty, preserving local selection', {
                      currentUserId: currentUser.id,
                      localSelection,
                      preservedSelections
                    });
                  } else {
                    console.log('🛡️ [Sync] Reveal phase - server sent empty, keeping current selections');
                  }
                }
              }
              // During active gameplay: Preserve local selection with timeframe check
              else if (isActiveGameplay && hasLocalSelection && currentUser?.id) {
                // CRITICAL: Only merge if selection was made recently AND for THIS question
                const selectionQuestionId = window.lastSelectionQuestionId;
                const currentQuestionId = data.currentQuestion?.id;
                const localSelectionBelongsToThisQuestion = 
                  window.lastSelectionTime && 
                  selectionQuestionId === currentQuestionId &&
                  (Date.now() - window.lastSelectionTime < MAX_TIME * 1000);
                
                if (localSelectionBelongsToThisQuestion) {
                  const mergedSelections = { ...data.selections };
                  const localSelection = mySelection !== null ? mySelection : currentSelectionRef.current;
                  mergedSelections[currentUser.id] = localSelection;
                  setSelections(mergedSelections);
                  console.log('🔄 [Sync] Active gameplay - merged local selection', {
                    serverSelections: data.selections,
                    currentUserId: currentUser.id,
                    localSelection,
                    mergedSelections
                  });
                } else {
                  // Stale selection or different question - don't merge
                  setSelections(data.selections);
                  if (selectionQuestionId !== currentQuestionId) {
                    console.log('⚠️ [Sync] Selection from different question - using server data');
                  } else {
                    console.log('⚠️ [Sync] Stale selection detected - using server data');
                  }
                }
              }
              // Not in gameplay or reveal - just sync server data
              else {
                setSelections(data.selections);
              }
            }
            if (data.playerNames) {
              setPlayerNames(prevNames => ({ ...prevNames, ...data.playerNames }));
            }
            if (data.scores) {
              setScores(data.scores);
            }
          }
        } else {
          // No current question - sync persisted data (scores, playerNames)
          // console.log('📋 [Sync] No current question, updating persisted data');
          if (data.scores) {
            setScores(data.scores);
          }
          if (data.playerNames) {
            // console.log('📝 [Sync] Updating player names (no question):', data.playerNames);
            setPlayerNames(prevNames => ({ ...prevNames, ...data.playerNames }));
          }
          if (data.selections) {
            setSelections(data.selections);
          }
        }
      } catch (error) {
        // Silently handle sync errors to prevent noise
        // console.log('⚠️ Sync error (non-critical):', error.message);
      }
    };
    
    // Expose syncGameState globally for immediate triggering
    window.syncGameStateFunc = syncGameState;

    // Initial sync - wait longer to avoid conflict with main question fetch
    setTimeout(syncGameState, 3000);
    
    // Sync every 3000ms to reduce polling frequency and prevent constant question changes  
    const syncInterval = setInterval(syncGameState, 3000);

    return () => {
      clearInterval(syncInterval);
      // Clean up global reference
      window.syncGameStateFunc = null;
    };
  }, [socket, socket?.connected, socket?.localMode, currentUser, roomId]);

  // Remove the manual sync keyboard shortcut
  useEffect(() => {
    if (!currentQuestion) return;
    if (showResult) return;

    // Don't reset timeLeft to MAX_TIME here - it should already be set correctly by checkForExistingGame or onNextQuestion
    setServerScoredThisRound(false); // Reset server scoring flag for new question
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          
          // In multiplayer mode, request round completion from server
          if (socket && !socket.localMode) {
            // console.log('⏰ Time up! Requesting round completion from server...');
            
            const endRoundRequest = async () => {
              try {
                const response = await fetch(`${API_BASE_URL}/game-event`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event: 'end_round',
                    data: {
                      roomId: roomId
                    }
                  })
                });
                
                if (response.ok) {
                  const result = await response.json();
                  // console.log('📡 Round completion response:', result);
                  if (result && result.data && result.data.selections) {
                    // console.log('📊 Server scores:', result.data.scores);
                    // console.log('📊 Server selections:', result.data.selections);
                    setSelections(result.data.selections || {});
                    if (result.data.playerNames) {
                      setPlayerNames(result.data.playerNames);
                      console.log('👥 Player names from server:', result.data.playerNames);
                    } else {
                      console.log('⚠️ No playerNames received from server in end_round response');
                    }
                    if (result.data.scores) {
                      setScores(result.data.scores);
                      setServerScoredThisRound(true); // Flag that server provided scores
                      // console.log('✅ Scores updated from server:', result.data.scores);
                    }
                    setShowResult(true);
                  } else {
                    // Fallback to local reveal with current user's selection
                    // console.log('⚠️ No server response, falling back to local reveal');
                    // console.log('🔧 Using local mySelection:', mySelection);
                    // console.log('🔧 Using ref selection:', currentSelectionRef.current);
                    // console.log('🔧 Current user ID:', currentUser?.id);
                    
                    // Create selections object from local data - try both state and ref
                    const localSelections = {};
                    const selectionToUse = mySelection !== null ? mySelection : currentSelectionRef.current;
                    if (selectionToUse !== null && currentUser?.id) {
                      localSelections[currentUser.id] = selectionToUse;
                      // console.log('🔧 Created local selections:', localSelections);
                    } else {
                      // console.log('🚨 No selection found in state or ref!');
                    }
                    setSelections(localSelections);
                    setShowResult(true);
                  }
                } else {
                  throw new Error(`Server responded with status: ${response.status}`);
                }
              } catch (error) {
                // console.log('⚠️ Failed to end round via server:', error);
                // Fallback to local reveal
                const localSelections = {};
                const selectionToUse = mySelection !== null ? mySelection : currentSelectionRef.current;
                if (selectionToUse !== null && currentUser?.id) {
                  localSelections[currentUser.id] = selectionToUse;
                }
                setSelections(localSelections);
                setShowResult(true);
              }
            };
            
            endRoundRequest();
          } else {
            // Local mode - just show result
            // console.log('🏠 Local mode - no server scoring');
            setShowResult(true);
          }
          
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentQuestion, showResult, socket, roomId]); // Removed isInVoiceChannel to prevent timer restarts

  // Use current user ID if available, fallback to "player1"
  const myPlayerId = currentUser?.id || "player1";

  const isCardMode = currentQuestion ? !!currentQuestion.isCard : false;

  const correctLetter = !isCardMode && currentQuestion ? currentQuestion.answer : null;
  const correctIndex = !isCardMode && currentQuestion
    ? currentQuestion.options.findIndex((opt) => opt.startsWith(correctLetter))
    : -1;

  // Updated: Emit answer through socket with competitive flow
  const onSelectOption = (playerId, optionIndex) => {
    if (showResult) return; // Can't select after results are shown
    
    console.log(`🎯 Attempting to select option ${optionIndex}`, {
      showResult,
      currentSelection: mySelection,
      isInVoiceChannel,
      voiceChannel: !!voiceChannel,
      playerId,
      socket: !!socket
    });

    // Allow changing selection - update to new choice
    setMySelection(optionIndex);
    currentSelectionRef.current = optionIndex; // Store in ref for persistence
    
    // Track selection time AND question ID for clearing protection
    window.lastSelectionTime = Date.now();
    window.lastSelectionQuestionId = currentQuestion?.id;
    
    console.log(`🎯 You selected option ${optionIndex} (${mySelection !== null ? 'changed from ' + mySelection : 'new selection'})`);
    console.log(`🔧 Stored selection in ref:`, optionIndex);

    // Emit selection to server with retry logic
    const submitSelection = async () => {
      if (socket && !socket.localMode) {
        let attempts = 0;
        const maxAttempts = 3;
        
        const trySubmit = async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/game-event`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'select_option',
                data: {
                  roomId: roomId,
                  playerId: playerId,
                  playerName: currentUser?.global_name || currentUser?.username || 'Unknown Player',
                  optionIndex: optionIndex,
                  timeTaken: MAX_TIME - timeLeft
                }
              })
            });
            



            if (response.ok) {
              // console.log('📤 Option selection submitted successfully');
            } else {
              throw new Error(`Server responded with status: ${response.status}`);
            }
          } catch (error) {
            attempts++;
            // console.log(`⚠️ Selection submit attempt ${attempts} failed:`, error.message);
            
            if (attempts < maxAttempts) {
              // console.log(`🔄 Retrying selection submission in 1 second...`);
              setTimeout(trySubmit, 1000);
            } else {
              // console.log('❌ Failed to submit selection after max attempts');
            }
          }
        };
        
        await trySubmit();
      } else {
        // console.log('🏠 Local mode - selection recorded locally');
        // In local mode, immediately show result
        setTimeout(() => {
          setSelections({ [playerId]: optionIndex });
          setShowResult(true);
        }, 1000);
      }
    };
    
    submitSelection();

    // Record timing for scoring - ONLY on first answer to prevent point farming
    // Players can change their selection, but the points are based on first answer time
    if (answerTimesRef.current[playerId] === undefined) {
      answerTimesRef.current = {
        ...answerTimesRef.current,
        [playerId]: timeLeft,
      };
      console.log(`⏱️ Locked answer time for player ${playerId}: ${timeLeft}s remaining`);
    } else {
      console.log(`🔒 Answer time already locked at ${answerTimesRef.current[playerId]}s - ignoring new time`);
    }

    // unlock audio context & maybe start music because this was a user gesture
    if (musicEnabled) startBackgroundMusic();
    unlockAudioContext();
    playClickSound();
  };

  // New: submit typed answer for card questions (player can keep trying until time runs out)
  const onSubmitCardAnswer = async (playerId, text) => {
    if (showResult) return;
    if (!isCardMode) return;
    if (selections[playerId] !== undefined) return; // already answered correctly

    const attempt = (text || cardInput || "").trim();
    if (!attempt) return;

    // Normalize comparison: case-insensitive, trim
    const expected = (currentQuestion.cardName || "").trim().toLowerCase();
    const given = attempt.toLowerCase();

    if (given === expected) {
      // correct!
      const clickedTimeLeft = timeLeft;

      answerTimesRef.current = {
        ...answerTimesRef.current,
        [playerId]: clickedTimeLeft,
      };

      setSelections((prev) => ({ ...prev, [playerId]: true }));
      setCardLastWrong(false);
      // don't reveal immediately — follow the same reveal rules (either everyone or timer)

      // play click to reward the user feel
      playClickSound();

      // Send correct card answer to server
      try {
        const response = await fetch(`${API_BASE_URL}/game-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'select_option',
            data: {
              roomId: roomId,
              playerId: playerId,
              playerName: currentUser?.global_name || currentUser?.username || 'Unknown Player',
              cardAnswer: attempt, // Send the text answer for card questions
              isCorrect: true, // Mark as correct since we validated it client-side
              timeTaken: MAX_TIME - timeLeft
            }
          })
        });
        
        if (response.ok) {
          // console.log('📤 Card answer submitted successfully:', attempt);
        } else {
          // console.error('❌ Failed to submit card answer to server');
        }
      } catch (error) {
        // console.error('❌ Error submitting card answer:', error);
      }

      // Don't reveal immediately - wait for timer to reach 0 just like trivia questions
      // The timer logic will handle revealing when timeLeft reaches 0
    } else {
      // wrong — allow keep trying until timer runs out
      setCardLastWrong(true);
      // small audio cue
      playHoverSound();
    }
  };

  // Award points once when results are revealed. Use the stored answer times.
  useEffect(() => {
    if (!showResult) return;
    if (awardedDoneRef.current) return; // guard — only award once per question
    if (serverScoredThisRound) {
      // console.log('🔒 Skipping client scoring - server already provided scores');
      awardedDoneRef.current = true;
      return;
    }

    // console.log('🎯 Running client-side scoring calculation');
    // calculate and award points
    setScores((prevScores) => {
      const newScores = { ...prevScores };

      const computePointsFromTime = (time) => {
        if (!time || time <= 0) return 0;
        const x = Math.max(0, Math.min(1, time / MAX_TIME)); // normalized [0..1]
        const raw = MAX_POINTS * Math.pow(x, SCORING_EXPONENT);
        return Math.round(raw);
      };

      if (isCardMode) {
        // In multiplayer, server handles card scoring (it validates correct answers)
        // In local mode, award points client-side for correct answers
        if (socket?.localMode) {
          players.forEach(({ id }) => {
            if (selections[id] === true) {
              const timeAtAnswer = answerTimesRef.current[id];
              const points = timeAtAnswer ? computePointsFromTime(timeAtAnswer) : 0;
              newScores[id] = (newScores[id] || 0) + points;
            }
          });
        } else {
          // Multiplayer: Server already calculated scores, don't override
          console.log('🔒 Card mode in multiplayer - server handles scoring');
        }
      } else {
        // trivia mode (existing logic)
        players.forEach(({ id }) => {
          // only award if the player's selection was correct
          if (selections[id] === correctIndex) {
            const timeAtAnswer = answerTimesRef.current[id];
            const points = timeAtAnswer ? computePointsFromTime(timeAtAnswer) : 0;
            newScores[id] = (newScores[id] || 0) + points;
          }
        });
      }

      return newScores;
    });

    // mark awarding done for this question so effect won't re-run awarding
    awardedDoneRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult]);

  const onNextQuestion = async () => {
    // console.log('� Starting next question from server');
    setIsLoading(true);
    
    try {
      // Show transition only for the person who clicked Next Question
      setIsTransitioning(true);
      const attemptStartQuestion = async (retryCount = 0) => {
        const response = await fetch(`${API_BASE_URL}/start_question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: roomId,
            forceNew: true  // Next button always generates new question
          })
        });
        
        const result = await response.json();
        // console.log('📡 Next question response:', result);
        
        // If question generation is in progress (409), retry after a short delay
        if (response.status === 409 && retryCount < 2) {
          // console.log(`⏳ Next: Question generation in progress, retrying in 300ms (attempt ${retryCount + 1}/2)`);
          await new Promise(resolve => setTimeout(resolve, 300));
          return attemptStartQuestion(retryCount + 1);
        }
        
        // If rate limited (429), wait longer and retry
        if (response.status === 429 && retryCount < 1) {
          // console.log(`🚫 Next: Rate limited, retrying in 1000ms (attempt ${retryCount + 1}/1)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptStartQuestion(retryCount + 1);
        }
        
        return { response, result };
      };
      
      const { response, result } = await attemptStartQuestion();
      
      if (result && result.success && result.question) {
        const question = result.question;
        setCurrentQuestion(question);
        setShowResult(false);
        setSelections({});
        setMySelection(null);
        currentSelectionRef.current = null;
        window.lastSelectionTime = null; // Clear selection timestamp for new question
        window.lastSelectionQuestionId = null; // Clear question ID
        setTimeLeft(result.timeLeft || MAX_TIME);
        answerTimesRef.current = {};
        awardedDoneRef.current = false;
        setIsTransitioning(false); // Hide transition for the person who clicked
        // console.log('✅ Got next question from server:', question.isCard ? 'Card Question' : 'Regular Question');
        
        // Let regular sync polling handle updates - no need for manual trigger that causes double transitions
      } else {
        // console.log('⚠️ Failed to get next question from server');
      }
      
    } catch (error) {
      // console.error('❌ Error getting next question:', error);
    } finally {
      setIsLoading(false);
      setIsTransitioning(false); // Hide transition in case of error
    }
  };
  // Build a sorted leaderboard from scores
  const sortedPlayers = useMemo(() => {
    return players
      .map((p) => ({ ...p, score: scores[p.id] || 0 }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name);
      });
  }, [scores]);

  // helper to get medal asset for top-3 ranks
  const getMedalForRank = (rankIdx) => {
    if (rankIdx === 0) return medalFirst;
    if (rankIdx === 1) return medalSecond;
    if (rankIdx === 2) return medalThird;
    return null;
  };

  // FLIP animation using layout measurements — triggers whenever sortedPlayers changes.
  useLayoutEffect(() => {
    // Capture new positions
    const newRects = {};
    sortedPlayers.forEach((p) => {
      // there may be multiple leaderboard renderings; pick the first occurrence to measure
      const el = document.querySelector(`[data-player-id="${p.id}"]`);
      if (el) newRects[p.id] = el.getBoundingClientRect();
    });

    const prevRects = prevRectsRef.current || {};

    // For each player that existed before and still exists now, compute delta
    sortedPlayers.forEach((p) => {
      const prev = prevRects[p.id];
      const next = newRects[p.id];
      if (!prev || !next) return;
      const deltaY = prev.top - next.top;
      if (!deltaY) return; // no movement

      // Apply transform to all occurrences of this player's row (handles multiple leaderboards)
      const els = document.querySelectorAll(`[data-player-id="${p.id}"]`);
      els.forEach((el) => {
        // set up initial transform to visually place it where it was
        el.style.transition = "none";
        el.style.transform = `translateY(${deltaY}px)`;
        el.style.willChange = "transform";
      });

      // Force a reflow so the browser acknowledges the transform, then animate to 0
      requestAnimationFrame(() => {
        els.forEach((el) => {
          // start animation
          el.style.transition = "transform 480ms cubic-bezier(0.2, 0.8, 0.2, 1)";
          el.style.transform = ""; // animate to natural position
        });
      });

      // After animation, clean up inline styles (optional)
      setTimeout(() => {
        els.forEach((el) => {
          el.style.transition = "";
          el.style.willChange = "";
        });
      }, 520);
    });

    // Save the newRects for the next run
    prevRectsRef.current = newRects;
  }, [sortedPlayers]);

  // Animate displayScores when scores change (count up)
  useEffect(() => {
    const duration = 600; // ms for the count animation

    Object.keys(scores).forEach((id) => {
      const start = displayScoresRef.current[id] || 0;
      const end = scores[id] || 0;
      if (start === end) return;

      // cancel any previous frame for this id
      if (scoreAnimFramesRef.current[id]) {
        cancelAnimationFrame(scoreAnimFramesRef.current[id]);
        scoreAnimFramesRef.current[id] = null;
      }

      const startTime = performance.now();

      const step = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const value = Math.round(start + (end - start) * t);
        setDisplayScores((prev) => {
          if (prev[id] === value) return prev;
          return { ...prev, [id]: value };
        });

        if (t < 1) {
          scoreAnimFramesRef.current[id] = requestAnimationFrame(step);
        } else {
          scoreAnimFramesRef.current[id] = null;
          // briefly highlight increases
          if (end > start) {
            setScoreHighlight((h) => ({ ...h, [id]: true }));
            setTimeout(() => {
              setScoreHighlight((h) => {
                const copy = { ...h };
                delete copy[id];
                return copy;
              });
            }, 700);
          }
        }
      };

      scoreAnimFramesRef.current[id] = requestAnimationFrame(step);
    });

    // cleanup on unmount or scores change
    return () => {
      Object.values(scoreAnimFramesRef.current).forEach((f) => {
        if (f) cancelAnimationFrame(f);
      });
      scoreAnimFramesRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores]);

  // Loading screen with themed design
  if (isLoading || isTransitioning) {
    return (
      <div
        className="app-container"
        style={{
          backgroundImage: `url(${marbleBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          height: "100vh",
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          boxSizing: "border-box",
        }}
      >
        <div
          className="wood-panel"
          style={{
            backgroundImage: `url(${woodPanelBg})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            padding: 60,
            boxSizing: "border-box",
            width: 600,
            maxWidth: "95vw",
            minHeight: 400,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            color: "white",
            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          }}
        >
          <h1 style={{ 
            fontSize: 48, 
            fontWeight: "bold", 
            marginBottom: 30,
            textAlign: "center",
            color: "#FFE4B5"
          }}>
            Age of Empires III Quiz
          </h1>
          
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20
          }}>
            {/* Animated loading spinner */}
            <div style={{
              width: 60,
              height: 60,
              border: "4px solid rgba(255, 228, 181, 0.3)",
              borderTop: "4px solid #FFE4B5",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            
            <p style={{
              fontSize: 20,
              textAlign: "center",
              color: "#FFE4B5",
              margin: 0
            }}>
              {/* {isTransitioning ? "Loading next question..." : "Getting questions from server..."} */}
            </p>
            
            <p style={{
              fontSize: 14,
              textAlign: "center",
              color: "rgba(255, 228, 181, 0.7)",
              margin: 0,
              fontStyle: "italic"
            }}>
              {isTransitioning ? "Preparing your next challenge" : "Preparing your Age of Empires III challenge"}
            </p>
          </div>
        </div>
        
        {/* Add CSS animation for spinner */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Completed screen - only show if we're not loading and really have no question
  if (!currentQuestion && !isLoading && !questionFetchInProgressRef.current) {
    return (
      <div
        className="app-container"
        style={{
          backgroundImage: `url(${marbleBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          height: "100vh",
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          boxSizing: "border-box",
        }}
      >
        <div
          className="wood-panel"
          style={{
            backgroundImage: `url(${woodPanelBg})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            padding: 60,
            boxSizing: "border-box",
            width: 850,
            maxWidth: "95vw",
            minHeight: 600,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflow: "hidden",
            color: "white",
            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          }}
        >
          <h1 className="title">Quiz Completed!</h1>
          <button
            className="restart-button"
            onMouseEnter={playHoverSound}
            onClick={async () => {
              playClickSound();
              
              // Reset scores for all players
              setScores(
                players.reduce((acc, p) => {
                  acc[p.id] = 0;
                  return acc;
                }, {})
              );
              
              // Reset per-question tracking
              answerTimesRef.current = {};
              awardedDoneRef.current = false;
              
              // Get new question from server
              setIsLoading(true);
              try {
                const response = await fetch(`${API_BASE_URL}/start_question`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    roomId: roomId,
                    forceNew: true
                  })
                });

                const result = await response.json();
                
                if (result.success && result.question) {
                  setCurrentQuestion(result.question);
                  setTimeLeft(result.timeLeft || MAX_TIME);
                  setShowResult(false);
                  setSelections({});
                  setMySelection(null);
                  currentSelectionRef.current = null;
                  // console.log('✅ Restarted with new question from server');
                  
                  // Let regular sync polling handle updates - no need for manual trigger
                }
              } catch (error) {
                // console.error('❌ Error restarting quiz:', error);
              } finally {
                setIsLoading(false);
              }
            }}
          >
            Restart Quiz
          </button>
        </div>
      </div>
    );
  }

  // Leaderboard drag handlers
  const handleLeaderboardMouseDown = (e) => {
    if (e.target.closest('.leaderboard-title button')) return; // Don't drag when clicking collapse button
    
    e.preventDefault(); // Prevent text selection during drag
    setIsDraggingLeaderboard(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    let animationFrame = null;
    let lastX = null;
    let lastY = null;
    
    const handleMouseMove = (moveEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - 280, moveEvent.clientX - offsetX));
      const newY = Math.max(0, Math.min(window.innerHeight - 200, moveEvent.clientY - offsetY));
      
      // Only update if position actually changed (reduce unnecessary renders)
      if (newX !== lastX || newY !== lastY) {
        lastX = newX;
        lastY = newY;
        
        // Use requestAnimationFrame for smoother updates
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
        
        animationFrame = requestAnimationFrame(() => {
          setLeaderboardPosition({ x: newX, y: newY });
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDraggingLeaderboard(false);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleLeaderboardCollapse = () => {
    setIsLeaderboardCollapsed(!isLeaderboardCollapsed);
  };

  // Main quiz UI
  return (
    <div
      className="app-container"
      style={{
        backgroundImage: `url(${marbleBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      {/* Leaderboard sidebar */}
      <aside 
        className={`leaderboard-container ${isLeaderboardCollapsed ? 'collapsed' : ''} ${isDraggingLeaderboard ? 'dragging' : ''}`}
        aria-label="Leaderboard"
        style={{
          left: `${leaderboardPosition.x}px`,
          top: `${leaderboardPosition.y}px`,
        }}
        onMouseDown={handleLeaderboardMouseDown}
      >
        <div className="leaderboard-title">
          <span>Leaderboard</span>
          <button 
            className="collapse-toggle"
            onClick={toggleLeaderboardCollapse}
            onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking button
            aria-label={isLeaderboardCollapsed ? "Expand leaderboard" : "Collapse leaderboard"}
          >
            {isLeaderboardCollapsed ? '▲' : '▼'}
          </button>
        </div>
        {!isLeaderboardCollapsed && (
          <ol className="leaderboard-list">
            {sortedPlayers.map((p, idx) => {
              const medal = getMedalForRank(idx);
              return (
                <li
                  key={p.id}
                  data-player-id={p.id}
                  className={`leaderboard-item ${p.id === myPlayerId ? "you" : ""} rank-${idx + 1}`}
                  aria-label={`${p.name} score ${p.score}`}
                >
                  {/* NEW: inner wrapper so FLIP's translate transforms on <li> do not override scale */}
                  <div className="leaderboard-row">
                    {medal ? (
                      <img
                        src={medal}
                        alt={`#${idx + 1} medal`}
                        // sizes controlled by CSS below to keep adjustments centralized
                      />
                    ) : (
                      <span className="leaderboard-rank">{idx + 1}</span>
                    )}
                    <span 
                      className="leaderboard-name"
                      data-length={p.name.length > 18 ? "long" : "normal"}
                      title={p.name.length > 18 ? p.name : undefined} // Show full name on hover for long names
                    >
                      {p.name}
                    </span>
                    <span className={`leaderboard-score ${scoreHighlight[p.id] ? "score-bump" : ""}`}>
                      {formatNumber(displayScores[p.id] ?? 0)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </aside>

      {/* Music toggle button (always visible) */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 999 }}>
        <button
          onClick={toggleMusic}
          onMouseEnter={() => {
            // don't play hover sound for this toggle to avoid accidental audio starts
          }}
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
          title={musicEnabled ? "Music On (click to mute)" : "Music Off (click to enable)"}
        >
          <img
            src={musicEnabled ? soundOnIcon : soundOffIcon}
            alt={musicEnabled ? "music on" : "music off"}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </button>
      </div>

      <div
        className="wood-panel"
        style={{
          backgroundImage: `url(${woodPanelBg})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          padding: 60,
          boxSizing: "border-box",
          width: 850,
          maxWidth: "95vw",
          minHeight: 600,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
          color: "white",
          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
        }}
      >
        <h1 className="title">Age of Empires III Trivia!</h1>
        <img
          src={dividingLine}
          alt=""
          className="divider-line"
          style={{
            display: "block",
            width: 600,
            maxWidth: "100%",
            height: "auto",
            pointerEvents: "none",
            userSelect: "none",
            transform: "translateY(-15px)"
          }}
        />

        <p className="timer">Time Left: {timeLeft}s</p>

        {/* Only render question content if currentQuestion exists */}
        {currentQuestion ? (
          <>
            {/* Render differently when this question is a card-guess */}
            {isCardMode ? (
          <>
            <h2 className="question">What HC card is this?</h2>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {/* image wrapper (position:relative) so overlay can be placed over the image */}
              <div style={{ position: "relative", width: 160, height: 160 }}>
                {cardImageUrl ? (
                  <img
                    src={cardImageUrl}
                    alt="HC card"
                    style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8, boxShadow: "0 6px 18px rgba(0,0,0,0.6)" }}
                  />
                ) : (
                  <div 
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      borderRadius: 8, 
                      boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
                      background: "linear-gradient(135deg, #2c1810 0%, #4a3222 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#d4b887",
                      fontSize: "14px",
                      textAlign: "center",
                      border: "2px solid #8b6914"
                    }}
                  >
                    Loading card...
                  </div>
                )}

                {/* Overlayed correct answer (center bottom) — slightly transparent background for legibility */}
                {showResult && (
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: 8,
                      transform: "translateX(-50%)",
                      background: "rgba(0, 0, 0, 0.6)",
                      padding: "8px 10px",
                      borderRadius: 6,
                      color: "#ffd",
                      textAlign: "center",
                      maxWidth: "92%",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                      pointerEvents: "none",
                      fontSize: "0.77rem",
                      width: "75%",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Correct Answer: {currentQuestion.cardName}</div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  className="card-input"
                  value={cardInput}
                  onChange={(e) => {
                    setCardInput(e.target.value);
                    setCardLastWrong(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onSubmitCardAnswer(myPlayerId, e.target.value);
                    }
                  }}
                  disabled={showResult || selections[myPlayerId] !== undefined}
                  placeholder="Type the card name here..."
                  style={{
                    width: 420,
                    height: 48,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "none",
                    outline: "none",
                    fontSize: "1.4rem",
                    fontFamily: `"Trajan Pro White", "Trajan Pro", serif`,
                    color: "#ffffff",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
                    // background image switches to "over" when timer ends OR correct answer entered
                    backgroundImage: `url(${(showResult || selections[myPlayerId] !== undefined) ? nicknameBgOver : nicknameBg})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    // make sure text sits above the image
                    backgroundColor: "transparent",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                />

                <button
                  onClick={() => onSubmitCardAnswer(myPlayerId, cardInput)}
                  onMouseEnter={playHoverSound}
                  disabled={showResult || selections[myPlayerId] !== undefined}
                  style={{
                    height: 48,
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    cursor: (showResult || selections[myPlayerId] !== undefined) ? "default" : "pointer",
                    backgroundImage: `url(${btnNormal})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundColor: "transparent",
                    color: "white",
                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    fontSize: "1.4rem",
                    width: 320,
                  }}
                >
                  Submit!
                </button>
              </div>

              {cardLastWrong && !showResult && (
                <div style={{ color: "#ffb3b3", marginTop: 6 }}>Incorrect — try again.</div>
              )}

              {/* The previous "Correct: ..." block under the input was removed and is now overlayed on the image */}
            </div>
          </>
        ) : (
          // Trivia mode (existing UI)
          <>
            <h2 className="question">{currentQuestion.question}</h2>

            <div className="options-grid">
              {currentQuestion.options.map((opt, i) => {
                const reveal = showResult;
                const isMySelected = i === mySelection; // Use state mySelection, not selections[myPlayerId]
                // Also check if server has my selection for this option (backup check)
                const isMySelectionOnServer = selections[myPlayerId] === i;

                let backgroundImage = `url(${btnNormal})`;
                let boxShadow = "none";

                if (reveal) {
                  if (i === correctIndex) {
                    backgroundImage = `url(${btnHover})`;
                    boxShadow = "0 0 12px 4px gold";
                  } else {
                    backgroundImage = `url(${btnDisabled})`;
                  }
                } else if (isMySelected) {
                  backgroundImage = `url(${btnHover})`;
                }

                return (
                  <button
                    key={i}
                    disabled={reveal} // Only disable after results are revealed
                    className="option-button"
                    style={{ backgroundImage, boxShadow }}
                    onMouseEnter={playHoverSound}
                    onClick={() => {
                      // console.log(`🔥 Button ${i} clicked!`, {
                        // reveal,
                        // mySelection,
                        // disabled: reveal,
                        // myPlayerId,
                        // showResult
                      // });
                      onSelectOption(myPlayerId, i);
                    }}
                  >
                    <span className="option-text">{opt}</span>
                    
                    {/* Show my name on my selected option (even before reveal) */}
                    {!reveal && (isMySelected || isMySelectionOnServer) && (
                      <>
                        {/* console.log(`🟢 Rendering green badge for option ${i}, reveal: ${reveal}, mySelection: ${mySelection}, serverSelection: ${selections[myPlayerId]}`) */}
                        <span className="option-badge my-selection">
                          {currentUser?.username || currentUser?.global_name || "You"}
                        </span>
                      </>
                    )}
                    
                    {/* Show all player names after reveal */}
                    {reveal && (() => {
                      const playersForOption = Object.entries(selections)
                        .filter(([playerId, optionIndex]) => optionIndex === i);
                      
                      // Only render badge if there are players for this option
                      if (playersForOption.length === 0) {
                        return null; // Don't render anything
                      }
                      
                      const playerNames_display = playersForOption
                        .map(([playerId]) => {
                          // Try multiple sources for player name
                          let playerName = playerNames[playerId]; // From server
                          
                          if (!playerName) {
                            // Fallback to local players array
                            const player = players.find(p => p.id === playerId);
                            playerName = player?.name;
                          }
                          
                          if (!playerName && playerId === currentUser?.id) {
                            // Fallback to current user info
                            playerName = currentUser?.username || currentUser?.global_name;
                          }
                          
                          // Final fallback
                          const finalName = playerName || `Player ${playerId.slice(-4)}`;
                          return finalName;
                        })
                        .join(", ");
                      
                      return (
                        <span className="option-badge">
                          {playerNames_display}
                        </span>
                      );
                    })()}
                  </button>
                );
              })}
            </div>
          </>
        )}
        </>
        ) : (
          <div style={{ textAlign: "center", color: "#ccc", padding: "40px" }}>
            {socket && !socket.localMode && socket.connected && isInVoiceChannel ? (
              <div>
                <p>Ready to start the quiz?</p>
                <button
                  className="next-question-button"
                  style={{
                    marginTop: 16,
                    width: 360,
                    height: 65,
                    backgroundImage: `url(${btnMainMenuDisabled})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: 12,
                    color: "white",
                    fontFamily: '"Trajan Pro Bold", serif',
                    fontWeight: 600,
                    fontSize: "1.7rem",
                    cursor: "pointer",
                    outline: "none",
                    filter: "drop-shadow(0 0 8px gold)",
                    userSelect: "none",
                  }}
                  onMouseEnter={() => playHoverSound()}
                  onClick={async () => {
                    playClickSound();
                    // console.log('🎮 Starting first question in multiplayer mode');
                    // Use the same HTTP endpoint as onNextQuestion for consistency
                    try {
                      const response = await fetch(`${API_BASE_URL}/start_question`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          roomId: roomId,
                          forceNew: false  // First question doesn't need forceNew
                        })
                      });
                      
                      const result = await response.json();
                      // console.log('📡 Start question response:', result);
                      
                      if (result && result.success && result.question) {
                        const question = result.question;
                        setCurrentQuestion(question);
                        setShowResult(false);
                        setSelections({});
                        setMySelection(null);
                        currentSelectionRef.current = null;
                        setTimeLeft(result.timeLeft || MAX_TIME);
                        answerTimesRef.current = {};
                        awardedDoneRef.current = false;
                        // console.log('✅ First question loaded from server:', question.isCard ? 'Card Question' : 'Regular Question');
                      } else {
                        // console.log('⚠️ No question in server response - staying in waiting state');
                        // In multiplayer mode, do NOT fall back to local generation
                      }
                    } catch (error) {
                      // console.log('⚠️ Failed to get question from server:', error);
                      // In multiplayer mode, do NOT fall back to local generation
                    }
                  }}
                >
                  Start Quiz
                </button>
              </div>
            ) : (
              <p>No question loaded. Wait for the host to start the quiz.</p>
            )}
          </div>
        )}
      </div>

      {/* Always render the button, but hide and disable when showResult is false */}
      <button
        className="next-question-button"
        onMouseEnter={() => {
          if (showResult) playHoverSound();
        }}
        onClick={() => {
          if (showResult) {
            playClickSound();
            onNextQuestion();
          }
        }}
        style={{
          marginTop: 16,
          width: 360,
          height: 65,
          backgroundImage: `url(${btnMainMenuDisabled})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundColor: "transparent",
          border: "none",
          borderRadius: 12,
          color: "white",
          fontFamily: '"Trajan Pro Bold", serif',
          fontWeight: 600,
          fontSize: "1.7rem",
          cursor: showResult ? "pointer" : "default",
          outline: "none",
          filter: showResult ? "drop-shadow(0 0 8px gold)" : "none",
          visibility: showResult ? "visible" : "hidden",
          pointerEvents: showResult ? "auto" : "none",
          userSelect: "none",
        }}
      >
        Next Question
      </button>

      {/* Small inline style to improve animation smoothness for leaderboard items and score bump */}
      <style>{`
        .leaderboard-container {
          position: fixed;
          /* right and top will be set via inline styles for dragging */
          width: 280px; /* Reduced from 320px for better size */
          background: linear-gradient(180deg, rgba(10,10,10,0.7), rgba(22,22,22,0.72));
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.45);
          z-index: 995;
          color: white;
          backdrop-filter: blur(6px) saturate(120%);
          -webkit-backdrop-filter: blur(6px) saturate(120%);
          border: 1px solid rgba(255,255,255,0.04);
          display: flex;
          flex-direction: column;
          gap: 8px;
          /* Remove transition during dragging for smoother movement */
          transition: box-shadow 0.3s ease;
          cursor: move;
          user-select: none;
        }

        .leaderboard-container.dragging {
          z-index: 1000;
          transform: scale(1.02);
          box-shadow: 0 15px 40px rgba(0,0,0,0.6);
          /* Disable all transitions during dragging for immediate response */
          transition: none !important;
        }

        .leaderboard-container.collapsed {
          width: 160px; /* Narrower when collapsed */
        }

        .leaderboard-title {
          font-family: "Trajan Pro Bold", serif;
          font-size: 1.05rem;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          padding-bottom: 4px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
        }

        .collapse-toggle {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
          flex-shrink: 0;
        }

        .collapse-toggle:hover {
          background: rgba(255,255,255,0.2);
        }

        .leaderboard-list {
          list-style: none;
          margin: 0;
          padding: 8px 4px 4px 4px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 400px;
          overflow-y: auto;
        }

        /* individual row */
        .leaderboard-item {
          display: block;
          border-radius: 8px;
          overflow: visible;
        }

        /* Apply grid to the inner row instead to preserve FLIP animations */
        .leaderboard-row {
          display: grid;
          grid-template-columns: 28px 1fr auto;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: 8px;
          transition: background 160ms, transform 160ms;
          transform-origin: left center;
          background: transparent;
        }

        .leaderboard-item:hover .leaderboard-row {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.02);
        }

        /* rank badge - applies to both medal images and text ranks */
        .leaderboard-rank {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          font-weight: 700;
          font-size: 0.9rem;
        }

        /* Medal images sizing */
        .leaderboard-row img {
          width: 28px;
          height: 28px;
          object-fit: contain;
        }

        /* Enhanced name column with improved wrapping */
        .leaderboard-name {
          font-family: "Trajan Pro Bold", serif;
          font-size: 0.95rem;
          line-height: 1.2;
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
          max-width: 100%;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Enhanced name truncation for very long names */
        .leaderboard-name::after {
          content: "";
        }

        /* Apply ellipsis only if name exceeds 18 characters */
        .leaderboard-name[data-length="long"] {
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          -webkit-line-clamp: unset;
          -webkit-box-orient: unset;
          display: block;
        }

        /* score column */
        .leaderboard-score {
          font-weight: 800;
          font-size: 1rem;
          min-width: 50px;
          text-align: right;
          color: #ffd966; /* gold-ish for contrast */
          text-shadow: 0 1px 2px rgba(0,0,0,0.6);
          transform-origin: center;
          flex-shrink: 0; /* Ensure score never gets pushed out */
          justify-self: end;
        }

        /* highlight the current user */
        .leaderboard-item.you .leaderboard-row {
          background: linear-gradient(90deg, rgba(100,108,255,0.10), rgba(100,108,255,0.03));
          box-shadow: 0 6px 18px rgba(100,108,255,0.06);
        }

        /* keep score bump animation unchanged */
        .score-bump { 
          animation: bump 680ms cubic-bezier(.2,.9,.3,1); 
          color: #ffd966 !important; /* override to maintain gold color during animation */
        }
        @keyframes bump {
          0% { transform: scale(1); }
          25% { transform: scale(1.35); }
          60% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }

        /* hide the leaderboard on very small screens to keep UI uncluttered */
        @media (max-width: 900px) {
          .leaderboard-container {
            display: none;
          }
        }

        /* Card input customizations */
        .card-input {
          background-clip: padding-box; /* prevent weird bleed on rounded corners */
          caret-color: #ffffff;
        }

        .card-input::placeholder {
          color: rgba(255,255,255,0.85);
          opacity: 1; /* ensure consistent placeholder color across browsers */
          font-family: "Trajan Pro White", "Trajan Pro", serif;
        }

        .card-input:disabled {
          cursor: default;
          /* if you want a slight dim when locked, uncomment next line */
          /* opacity: 0.98; */
        }
        
        /* divider under main title */
        .divider-line { display: block; height: auto; }
      `}</style>
    </div>
  );
}
