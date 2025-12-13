import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useLayoutEffect,
  useCallback,
} from "react";
import "./App.css";
import questions from "./questions.json";
import { useDiscordActivity } from "./discord/useDiscordActivity";
import { io } from "socket.io-client";

import woodPanelBg from "./assets/sendresource_bg.png";
import btnNormal from "./assets/combobox_button_normal.png";
import btnHover from "./assets/combobox_button_hover.png";
import btnDisabled from "./assets/combobox_button_disabled.png";
import btnMainMenuDisabled from "./assets/button_mainmenu_disabled.png";
import restartButtonBg from "./assets/button.webp";
import restartScreenBg from "./assets/background.webp";
import quizScreenBg from "./assets/background_two.webp";

import nicknameBg from "./assets/uiskirmishnickname_textentry.png";
import nicknameBgOver from "./assets/uiskirmishnickname_textentry_over.png";
import dividingLine from "./assets/dividingline.png";

import medalFirst from "./assets/award_03.png";
import medalSecond from "./assets/award_02.png";
import medalThird from "./assets/award_01.png";

import clickSoundFile from "./assets/bigbutton.wav";
import hoverSoundFile from "./assets/hoverobject_short.wav";

import someOfAKindFile from "./assets/SomeOfAKind.mp3";
import revolootinFile from "./assets/Revolootin.mp3";
import kothFile from "./assets/KOTH.mp3";

import soundOnIcon from "./assets/notification_sound_on.png";
import soundOffIcon from "./assets/notification_sound_off.png";

import revealSoundFile from "./assets/chatreceived.wav";

import { getCardImageUrl } from "./utils/cardImages";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (API_BASE_URL.startsWith("http")
    ? API_BASE_URL
    : window.location.origin);

const MAX_TIME = 20;
const JOIN_COUNTDOWN_SECONDS = 3;

const NORMAL_VOLUME = 0.3;
const FADED_VOLUME = 0.04;
const FADE_DURATION = 800;

const MAX_POINTS = 150;

const SCORING_EXPONENT = 2;

const SOLO_ROOM_KEY_PREFIX = "aoe3-quiz-solo-room";

const ensureSoloRoomId = (userId) => {
  if (typeof window === "undefined") {
    return `solo-${userId || "guest"}`;
  }

  const storageKey = userId
    ? `${SOLO_ROOM_KEY_PREFIX}:${userId}`
    : SOLO_ROOM_KEY_PREFIX;

  try {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) {
      return existing;
    }

    const randomPart =
      window.crypto?.randomUUID?.() ??
      Math.random().toString(36).slice(2, 10);
    const generated = `solo-${userId || "guest"}-${randomPart}`;
    window.localStorage.setItem(storageKey, generated);
    return generated;
  } catch (error) {
    const fallbackRandom = Math.random().toString(36).slice(2, 10);
    return `solo-${userId || "guest"}-${fallbackRandom}`;
  }
};

const deriveInstanceRoomId = (instanceId) => {
  if (!instanceId) {
    return null;
  }

  const parts = instanceId.split("-");
  if (parts.length >= 4) {
    const tail = parts[parts.length - 1];
    return tail || instanceId;
  }

  return instanceId;
};

const formatNumber = (n) => {
  if (n === null || n === undefined) return "0";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString();
};

const cardNames = [
  "Conquistador",
  "Team Fencing Instructor",
  "Unction",
  "Team Spanish Road",
  "Team Hidalgos",
  "Native Lore",
  "Advanced Trading Post",
  "Town Militia",
  "Pioneers",
  "Advanced Mill",
  "Advanced Market",
  "Advanced Estate",
  "Advanced Dock",
  "Llama Ranching",
  "Ranching",
  "Fish Market",
  "Schooners",
  "Sawmills",
  "Exotic Hardwoods",
  "Team Ironmonger",
  "Stockyards",
  "Furrier",
  "Rum Distillery",
  "Capitalism",
  "Stonemasons",
  "Land Grab",
  "Team Coastal Defenses",
  "Tercio Tactics",
  "Reconquista",
  "Advanced Arsenal",
  "Extensive Fortifications",
  "Rendering Plant",
  "Silversmith",
  "Sustainable Agriculture",
  "Spice Trade",
  "Medicine",
  "Cigar Roller",
  "Spanish Galleons",
  "Theaters",
  "Caballeros",
  "Liberation March",
  "Spanish Gold",
  "Armada",
  "Mercenary Loyalty",
  "Grenade Launchers",
  "Improved Buildings",
  "Blood Brothers",
  "Peninsular Guerrillas",
  "Advanced Balloon",
  "Florence Nightingale",
  "Virginia Company",
  "South Sea Bubble",
  "Fulling Mills",
  "Yeomen",
  "Siege Archery",
  "Master Surgeons",
  "Northwest Passage",
  "Distributivism",
  "Wilderness Warfare",
  "French Royal Army",
  "Naval Gunners",
  "Thoroughbreds",
  "Gribeauval System",
  "Navigator",
  "Agents",
  "Portuguese White Fleet",
  "Carracks",
  "Stadhouder",
  "Admiral Tromp",
  "Tulip Speculation",
  "Willem",
  "Polar Explorer",
  "Engineering School",
  "Suvorov Reforms",
  "Ransack",
  "Polk",
  "Offshore Support",
  "Germantown Farmers",
  "Guild Artisans",
  "Spanish Riding School",
  "Mosque Construction",
  "Flight Archery",
  "New Ways",
  "Beaver Wars",
  "Medicine Wheels",
  "Black Arrow",
  "Silent Strike",
  "Smoking Mirror",
  "Boxer Rebellion",
  "Western Reforms",
  "Advanced Wonders",
  "Seven Lucky Gods",
  "Desert Terror",
  "Foreign Logging",
  "Salt Ponds",
  "Imperial Unity",
  "Duelist",
  "Trample Tactics",
  "Virginia Oak",
  "Coffee Mill Guns",
  "Bushburning",
  "Beekeepers",
  "Koose",
  "Kingslayer",
  "Barbacoa",
  "Man of Destiny",
  "Freemasons",
  "Admirality",
  "Advanced Commanderies",
  "Bailiff",
  "Fire Towers",
  "Native Treaties",
  "Advanced Scouts",
  "Grain Market",
  "Chinampa",
  "Knight Hitpoints",
  "Knight Attack",
  "Aztec Mining",
  "Ritual Gladiators",
  "Artificial Islands",
  "Knight Combat",
  "Scorched Earth",
  "Aztec Fortification",
  "Chichimeca Rebellion",
  "Wall of Skulls",
  "Old Ways",
  "Improved Warships",
  "Terraced Houses",
  "Rangers",
  "Textile Mill",
  "Refrigeration",
  "Royal Mint",
  "Greenwich Time",
  "Dowager Empress",
  "Year of the Goat",
  "Year of the Tiger",
  "Year of the Ox",
  "Year of the Dragon",
  "Acupuncture",
  "Repelling Volley",
  "Native Crafts",
  "Colbertism",
  "Cartridge Currency",
  "European Cannons",
  "Voyageur",
  "Solingen Steel",
  "Town Destroyer",
  "Battlefield Construction",
  "Conservative Tactics",
  "Dane Guns",
];

const getCardImagePath = (cardName) => {
  const fileName = cardName.replace(/\s+/g, "_").replace(/[:/]/g, "");
  return new URL(`./assets/cards/${fileName}.png`, import.meta.url).href;
};

const createJoinCountdownState = () => ({
  active: false,
  remaining: JOIN_COUNTDOWN_SECONDS,
  questionId: null,
});

export default function App() {
  const [players, setPlayers] = useState([]);

  const [socket, setSocket] = useState(null);

  const {
    voiceChannel,
    participants,
    currentUser,
    instanceId,
    channelId,
    isHost,
    isInVoiceChannel,
    ready,
  } = useDiscordActivity();

  const currentPlayerId = currentUser?.id ?? null;

  const initialRoomId = useMemo(() => {
    if (channelId) {
      return channelId;
    }
    const derivedInstanceId = deriveInstanceRoomId(instanceId);
    if (derivedInstanceId) {
      return derivedInstanceId;
    }
    return ensureSoloRoomId(currentUser?.id ?? null);
  }, [channelId, instanceId, currentUser?.id]);

  const [roomId, setRoomId] = useState(initialRoomId);


  useEffect(() => {
    console.log("🏠 Using room ID:", roomId);
  }, [roomId]);

  const [availableQuestions, setAvailableQuestions] = useState([...questions]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectionState, setSelectionState] = useState({
    questionId: null,
    entries: {},
  });
  const selections =
    currentQuestion?.id && selectionState.questionId === currentQuestion.id
      ? selectionState.entries
      : {};
  const [mySelection, setMySelectionState] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  const setMySelection = (value, questionIdOverride) => {
    const resolvedQuestionId =
      questionIdOverride ??
      currentQuestionIdRef.current ??
      currentQuestion?.id ??
      null;
    if (value !== null) {
      setIsLocked(true);
    } else {
      setIsLocked(false);

      hcCardAnswersRef.current = {};

      const playerId = currentUser?.id || "player1";
      updateSelections((prevSelections) => {
        if (!prevSelections || prevSelections[playerId] === undefined) {
          return prevSelections || {};
        }

        const nextSelections = { ...prevSelections };
        delete nextSelections[playerId];
        return nextSelections;
      }, resolvedQuestionId);
    }
    setMySelectionState(value);
  };
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [showResult, setShowResult] = useState(false);
  const [hostPlayerId, setHostPlayerId] = useState(null);
  const canControlQuestions =
    !!currentPlayerId && (!hostPlayerId || hostPlayerId === currentPlayerId);

  const currentQuestionDataRef = useRef(null);
  useEffect(() => {
    currentQuestionDataRef.current = currentQuestion;
  }, [currentQuestion]);

  const showResultRef = useRef(showResult);
  useEffect(() => {
    showResultRef.current = showResult;
  }, [showResult]);

  const timeLeftRef = useRef(MAX_TIME);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const syncLocalQuestionToServer = useCallback(
    async (targetRoomIdOverride) => {
      const targetRoomId = targetRoomIdOverride || channelId || roomId;
      const activeQuestion = currentQuestionDataRef.current;
      if (
        !targetRoomId ||
        !activeQuestion ||
        showResultRef.current ||
        !canControlQuestions ||
        !currentPlayerId
      ) {
        return false;
      }

      const remainingSeconds = Math.max(
        0,
        Math.round(timeLeftRef.current ?? MAX_TIME),
      );

      try {
        const response = await fetch(`${API_BASE_URL}/sync_local_question`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: targetRoomId,
            question: activeQuestion,
            timeLeft: remainingSeconds,
            playerId: currentPlayerId,
          }),
        });

        let data = null;
        try {
          data = await response.json();
        } catch (jsonError) {}

        if (data?.hostPlayerId !== undefined) {
          setHostPlayerId(data.hostPlayerId || null);
        }

        if (!response.ok || !data?.success) {
          console.log(
            "Failed to sync question to server",
            targetRoomId,
            data?.error || response.statusText,
          );
          return false;
        }

        console.log("Synced active question into promoted room", targetRoomId);
        return true;
      } catch (error) {
        console.log(
          "Failed to sync question before promoting room",
          targetRoomId,
          error,
        );
        return false;
      }
    },
    [channelId, roomId, currentPlayerId, canControlQuestions],
  );

  useEffect(() => {
    let cancelled = false;

    const promoteToChannelIfNeeded = async () => {
      if (channelId && roomId !== channelId) {
        const activeQuestion = currentQuestionDataRef.current;
        const isInRevealPhase = showResultRef.current;
        const remainingSeconds = Math.max(
          0,
          Math.round(timeLeftRef.current ?? MAX_TIME),
        );

        const shouldSyncQuestionToServer =
          Boolean(activeQuestion) && !isInRevealPhase && canControlQuestions;

        if (shouldSyncQuestionToServer) {
          await syncLocalQuestionToServer(channelId);
        } else if (activeQuestion && !canControlQuestions) {
          console.log(
            "Skipped syncing local question because user is not host",
            channelId,
          );
        }

        if (!cancelled) {
          setRoomId(channelId);
        }

        return true;
      }

      return false;
    };

    promoteToChannelIfNeeded().then((promoted) => {
      if (cancelled || promoted) {
        return;
      }

      if (!roomId) {
        const derivedInstanceId = deriveInstanceRoomId(instanceId);
        if (derivedInstanceId) {
          setRoomId(derivedInstanceId);
          return;
        }

        setRoomId(ensureSoloRoomId(currentUser?.id ?? null));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    channelId,
    instanceId,
    currentUser?.id,
    roomId,
    canControlQuestions,
    syncLocalQuestionToServer,
  ]);

  const [scores, setScores] = useState({});
  const [serverScoredThisRound, setServerScoredThisRound] = useState(false);
  const [playerNames, setPlayerNames] = useState({});
  const [revealPhaseQuestionId, setRevealPhaseQuestionId] = useState(null);

  const [isLeaderboardCollapsed, setIsLeaderboardCollapsed] = useState(false);
  const [leaderboardPosition, setLeaderboardPosition] = useState({
    x: 0,
    y: 92,
  });
  const [isDraggingLeaderboard, setIsDraggingLeaderboard] = useState(false);

  useEffect(() => {
    const setInitialPosition = () => {
      setLeaderboardPosition({
        x: window.innerWidth - 300,
        y: 92,
      });
    };

    setInitialPosition();
    window.addEventListener("resize", setInitialPosition);

    return () => window.removeEventListener("resize", setInitialPosition);
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [cardInput, setCardInput] = useState("");
  const [cardLastWrong, setCardLastWrong] = useState(false);
  const [cardImageUrl, setCardImageUrl] = useState(null);

  const [displayScores, setDisplayScores] = useState({});
  const displayScoresRef = useRef(displayScores);
  useEffect(() => {
    displayScoresRef.current = displayScores;
  }, [displayScores]);

  const [musicEnabled, setMusicEnabled] = useState(true);
  const [joinCountdown, setJoinCountdown] = useState(createJoinCountdownState);
  const joinCountdownTimerRef = useRef(null);
  const autoEndGuardRef = useRef(true);
  const locallyStartedQuestionIdRef = useRef(null);

  const [socketStateVersion, setSocketStateVersion] = useState(0);

  useEffect(() => {
    if (isTransitioning) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isTransitioning]);

  const timerRef = useRef(null);

  const awardedDoneRef = useRef(false);

  const transitionDebounceRef = useRef(null);

  const currentSelectionRef = useRef(null);

  const currentQuestionIdRef = useRef(null);
  useEffect(() => {
    currentQuestionIdRef.current = currentQuestion?.id || null;
  }, [currentQuestion?.id]);

  const updateSelections = useCallback(
    (updater, questionIdOverride) => {
      const targetQuestionId =
        questionIdOverride !== undefined
          ? questionIdOverride
          : currentQuestionIdRef.current ?? currentQuestion?.id ?? null;

      setSelectionState((prev) => {
        const baseEntries =
          prev.questionId === targetQuestionId ? prev.entries : {};

        const nextEntries =
          typeof updater === "function"
            ? updater(baseEntries)
            : updater || {};

        return {
          questionId: targetQuestionId,
          entries: nextEntries,
        };
      });
    },
    [currentQuestion],
  );

  const beginRevealPhase = (explicitQuestionId) => {
    let resolvedQuestionId =
      explicitQuestionId ?? currentQuestionIdRef.current ?? null;

    if (resolvedQuestionId == null && currentQuestion?.id) {
      resolvedQuestionId = currentQuestion.id;
    }

    setRevealPhaseQuestionId(resolvedQuestionId ?? null);
    setShowResult(true);
    autoEndGuardRef.current = true;
  };

  const clearJoinCountdown = useCallback(() => {
    if (joinCountdownTimerRef.current) {
      clearInterval(joinCountdownTimerRef.current);
      joinCountdownTimerRef.current = null;
    }
    setJoinCountdown(createJoinCountdownState());
    autoEndGuardRef.current = true;
  }, []);

  const startJoinCountdown = useCallback(
    (questionId) => {
      if (!questionId) return;

      if (joinCountdownTimerRef.current) {
        clearInterval(joinCountdownTimerRef.current);
        joinCountdownTimerRef.current = null;
      }

      setJoinCountdown({
        active: true,
        remaining: JOIN_COUNTDOWN_SECONDS,
        questionId,
      });
      autoEndGuardRef.current = false;
      setIsTimerRunning(false);

      joinCountdownTimerRef.current = setInterval(() => {
        setJoinCountdown((prev) => {
          if (!prev.active || prev.questionId !== questionId) {
            return prev;
          }

          if (prev.remaining <= 1) {
            if (joinCountdownTimerRef.current) {
              clearInterval(joinCountdownTimerRef.current);
              joinCountdownTimerRef.current = null;
            }
            autoEndGuardRef.current = true;
            return createJoinCountdownState();
          }

          return {
            ...prev,
            remaining: prev.remaining - 1,
          };
        });
      }, 1000);
    },
    [setIsTimerRunning],
  );

  useEffect(() => {
    if (showResult || !currentQuestion) {
      clearJoinCountdown();
    }
  }, [showResult, currentQuestion, clearJoinCountdown]);

  useEffect(() => {
    if (!currentQuestion) {
      locallyStartedQuestionIdRef.current = null;
    }
  }, [currentQuestion]);

  const answerTimesRef = useRef({});

  const hcCardAnswersRef = useRef({});

  const lastClearedQuestionRef = useRef(null);

  const activityRestartedRef = useRef(false);
  const lastReadyStateRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const socketInitializingRef = useRef(false);

  const clickSound = useRef(null);
  const hoverSound = useRef(null);

  const audioCtxRef = useRef(null);
  const revealBufferRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const pendingRevealRef = useRef(false);

  const bg = useRef({
    tracks: [],
  });

  const currentIndexRef = useRef(0);

  const fadeTimerRef = useRef(null);

  useEffect(() => {
    if (!hasInitializedRef.current && ready) {
      hasInitializedRef.current = true;
      lastReadyStateRef.current = ready;
      return;
    }

    if (
      hasInitializedRef.current &&
      lastReadyStateRef.current === false &&
      ready
    ) {
      activityRestartedRef.current = true;
    }

    lastReadyStateRef.current = ready;

    if (!ready) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }

      if (transitionDebounceRef.current) {
        clearTimeout(transitionDebounceRef.current);
        transitionDebounceRef.current = null;
      }

      setIsTimerRunning(false);
      setIsTransitioning(false);

      if (socket?.connected && roomId) {
        socket.emit("activity_ended", { roomId });
      }

      setTimeLeft(MAX_TIME);
      setShowResult(false);
      setCurrentQuestion(null);
      setSelectionState({ questionId: null, entries: {} });
      setMySelection(null, currentQuestionIdRef.current ?? null);
    currentQuestionIdRef.current = null;
      currentSelectionRef.current = null;
      window.lastSelectionTime = null;
      window.lastSelectionQuestionId = null;
      hcCardAnswersRef.current = {};
      answerTimesRef.current = {};
      awardedDoneRef.current = false;
      setRevealPhaseQuestionId(null);

      if (scoreAnimFramesRef.current) {
        Object.values(scoreAnimFramesRef.current).forEach((frame) => {
          if (frame) cancelAnimationFrame(frame);
        });
        scoreAnimFramesRef.current = {};
      }

      setScores({});
      setDisplayScores({});
      setScoreHighlight({});
      displayScoresRef.current = {};

      setPlayers([]);
    }
  }, [ready, socket, roomId]);

  const applyGameState = useCallback(
    (gameState) => {
      const isNewQuestion =
        currentQuestion?.id !== gameState.currentQuestion?.id;

      setCurrentQuestion(gameState.currentQuestion);
      if (gameState.hostPlayerId !== undefined) {
        setHostPlayerId(gameState.hostPlayerId || null);
      }

      if (isNewQuestion) {
        currentQuestionIdRef.current = gameState.currentQuestion?.id ?? null;
        const isInRevealPhase = showResult || gameState.showResult;

        if (!isInRevealPhase) {
          setRevealPhaseQuestionId(null);
          updateSelections({}, gameState.currentQuestion?.id ?? null);
          setMySelection(null, gameState.currentQuestion?.id ?? null);
          currentSelectionRef.current = null;
          window.lastSelectionTime = null;
          window.lastSelectionQuestionId = null;
          setIsLocked(false);
          hcCardAnswersRef.current = {};
          answerTimesRef.current = {};
          awardedDoneRef.current = false;
          setServerScoredThisRound(false);
        }
      } else {
        const currentLocalSelection =
          mySelection !== null ? mySelection : currentSelectionRef.current;
        const myId = currentUser?.id;
        if (currentLocalSelection !== null && myId) {
          updateSelections(() => {
            const merged = {
              ...normalizeServerSelections(gameState.selections || {}),
            };
            merged[myId] = currentLocalSelection;
            return merged;
          }, gameState.currentQuestion?.id ?? null);
        } else {
          updateSelections(
            () => normalizeServerSelections(gameState.selections || {}),
            gameState.currentQuestion?.id ?? null,
          );
        }
      }

      // Update showResult from server state
      // This ensures round-end syncs across all players
      setShowResult(gameState.showResult);
      setTimeLeft(gameState.timeLeft);
      setScores(gameState.scores);
    },
    [
      currentQuestion?.id,
      currentUser?.id,
      mySelection,
      showResult,
      updateSelections,
    ],
  );

  useEffect(() => {
    if (!socket || !currentUser) return;

    socket.on("gameState", applyGameState);
    socket.on("game_state", applyGameState);

    socket.on("you_joined", (data) => {
      if (data?.hostPlayerId !== undefined) {
        setHostPlayerId(data.hostPlayerId || null);
      }
    });

    socket.on("question_started", (data) => {
      if (data?.hostPlayerId !== undefined) {
        setHostPlayerId(data.hostPlayerId || null);
      }
      if (data.question) {
        const isNewQuestion =
          !currentQuestion || currentQuestion.id !== data.question.id;

        currentQuestionIdRef.current = data.question.id ?? null;
        locallyStartedQuestionIdRef.current = data.question.id ?? null;
        setCurrentQuestion(data.question);
        setShowResult(false);
        setRevealPhaseQuestionId(null);
        clearJoinCountdown();
        autoEndGuardRef.current = true;

        if (isNewQuestion) {
          updateSelections({}, data.question.id ?? null);
          setMySelection(null, data.question.id ?? null);
          currentSelectionRef.current = null;
          window.lastSelectionTime = null;
          window.lastSelectionQuestionId = null;

          answerTimesRef.current = {};
          awardedDoneRef.current = false;
        }

        setTimeLeft(data.timeLeft || MAX_TIME);
      }
    });

    socket.on("round_complete", (data) => {
      if (data.selections) {
        updateSelections(
          () => normalizeServerSelections(data.selections),
          currentQuestionIdRef.current ?? null,
        );
        beginRevealPhase(currentQuestionIdRef.current);

        if (data.scores) {
          setScores(data.scores);
        }

        if (data.playerNames) {
          setPlayerNames((prevNames) => ({
            ...prevNames,
            ...data.playerNames,
          }));
        }
      }
    });

    socket.on("scores_reset", (data) => {
      setScores({});
      setDisplayScores({});
      scoreAnimFramesRef.current = {};
    });

    socket.on("room_state", (data) => {
      if (data?.hostPlayerId !== undefined) {
        setHostPlayerId(data.hostPlayerId || null);
      }
      if (data.scores) {
        setScores(data.scores);
        setDisplayScores(data.scores);
      }
      if (data.players) {
        setPlayers(data.players);
      }
    });

    socket.on("player_selected", (data) => {});

    socket.on("playerJoined", (player) => {
      setPlayers((prev) => {
        if (prev.find((p) => p.id === player.id)) {
          return prev;
        }
        return [...prev, player];
      });
    });

    socket.on("playerLeft", (playerId) => {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    });

    if (socket.connected) {
      socket.emit("join", {
        id: currentUser.id,
        name: currentUser.username,
        isHost,
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket, currentUser, isHost]);

  // Poll game state for multiplayer sync when socket.io is unavailable
  useEffect(() => {
    const isProxyMode = API_BASE_URL.startsWith('/');
    const shouldPoll = isProxyMode || (socket && !socket.connected);
    
    if (!roomId || !shouldPoll) return undefined;

    let cancelled = false;
    let pollTimer = null;
    let consecutiveErrors = 0;
    const maxErrorStreak = 5;

    // Determine if we're in multiplayer (more than 1 player)
    const isMultiplayer = players.length > 1;

    const poll = async () => {
      if (cancelled) return;
      
      try {
        const resp = await fetch(`${API_BASE_URL}/game-state/${roomId}`);
        const data = await resp.json();
        if (data?.success) {
          applyGameState({
            currentQuestion: data.currentQuestion || null,
            hostPlayerId: data.hostPlayerId,
            selections: data.selections || {},
            showResult: data.showResult || false,
            timeLeft: data.timeLeft ?? MAX_TIME,
            scores: data.scores || {},
          });
          consecutiveErrors = 0;
        } else {
          consecutiveErrors += 1;
        }
      } catch (error) {
        consecutiveErrors += 1;
      } finally {
        if (consecutiveErrors >= maxErrorStreak) {
          return; // stop polling after too many consecutive failures
        }

        // Faster polling for multiplayer, slower for solo
        let delay;
        if (isMultiplayer) {
          // In multiplayer: poll every 2-4 seconds for responsive sync
          delay = consecutiveErrors > 0 ? 4000 : 2000;
        } else if (currentQuestion && !showResult) {
          // Solo with active question: moderate polling
          delay = 8000;
        } else {
          // Solo, waiting for question or in round-end: slow polling
          delay = 20000;
        }
        
        pollTimer = setTimeout(poll, delay);
      }
    };

    // Start polling immediately in multiplayer, with delay in solo
    const initialDelay = isMultiplayer ? 500 : 5000;
    pollTimer = setTimeout(poll, initialDelay);

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [roomId, socket, socket?.connected, currentQuestion, showResult, players.length, applyGameState]);

  useEffect(() => {
    if (currentQuestion?.isCard && currentQuestion?.cardName) {
      setCardInput("");
      setCardLastWrong(false);

      setCardImageUrl(null);

      console.log(
        "🎴 HC card answer:",
        (currentQuestion.cardName || "").trim() || "<unknown>"
      );

      getCardImageUrl(currentQuestion.cardName)
        .then((imageUrl) => {
          setCardImageUrl(imageUrl);
        })
        .catch((error) => {
          setCardImageUrl(null);
        });
    } else {
      setCardImageUrl(null);
      setCardInput("");
      setCardLastWrong(false);
    }
  }, [currentQuestion?.id, currentQuestion?.isCard, currentQuestion?.cardName]);

  useEffect(() => {
    if (!currentQuestion?.id) return;

    setMySelection(null, currentQuestion?.id ?? null);
    currentSelectionRef.current = null;
    window.lastSelectionTime = null;
    window.lastSelectionQuestionId = null;
    answerTimesRef.current = {};
  }, [currentQuestion?.id, currentUser?.id]);

  useEffect(() => {}, [mySelection]);

  const prevRectsRef = useRef({});

  const scoreAnimFramesRef = useRef({});

  const gameCheckExecutedRef = useRef(false);
  const gameCheckRetriesRef = useRef(0);
  const MAX_SOCKET_WAIT_RETRIES = 6;
  const questionFetchInProgressRef = useRef(false);

  const [scoreHighlight, setScoreHighlight] = useState({});

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
        audio.volume = Math.max(0, Math.min(1, targetVolume));
      }
    }, intervalMs);
  };

  const pauseAllTracks = () => {
    bg.current.tracks.forEach((t) => {
      try {
        t.pause();
      } catch (e) {}
    });
  };

  const playTrackAt = (index) => {
    const tracks = bg.current.tracks;
    if (!tracks || tracks.length === 0) return;
    index = ((index % tracks.length) + tracks.length) % tracks.length;
    currentIndexRef.current = index;

    tracks.forEach((t, i) => {
      if (!t) return;
      if (i !== index) {
        try {
          t.pause();
        } catch (e) {}
      }
    });

    const current = tracks[index];
    if (!current) return;

    current.volume = showResult ? FADED_VOLUME : NORMAL_VOLUME;

    const p = current.play();
    if (p && typeof p.catch === "function") {
      p.catch((err) => {});
    }
  };

  useEffect(() => {
    // Skip socket.io entirely when using proxy - CSP blocks WebSocket anyway
    const isProxyMode = API_BASE_URL.startsWith('/');
    if (isProxyMode) {
      console.log('🔌 Running in proxy mode - using polling instead of WebSocket');
      socketInitializingRef.current = false;
      return;
    }

    // Only initialize socket once when user is ready and authenticated
    if (
      !currentUser?.username ||
      !currentUser?.accessToken ||
      !channelId ||
      socket ||
      socketInitializingRef.current
    ) {
      return;
    }

    socketInitializingRef.current = true;

    const initSocket = () => {
      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket"],
        auth: {
          token: currentUser.accessToken,
          channelId,
          reconnecting: false,
        },
      });

      // maintain compatibility with previous localMode checks
      newSocket.localMode = false;

      newSocket.on("connect", () => {
        setSocketStateVersion((prev) => prev + 1);
      });

      newSocket.on("disconnect", () => {
        setSocketStateVersion((prev) => prev + 1);
      });

      setSocket(newSocket);
      socketInitializingRef.current = false;
    };

    initSocket();
  }, [currentUser?.username, currentUser?.accessToken, channelId, socket]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current);
      }

      if (transitionDebounceRef.current) {
        clearTimeout(transitionDebounceRef.current);
      }

      if (joinCountdownTimerRef.current) {
        clearInterval(joinCountdownTimerRef.current);
        joinCountdownTimerRef.current = null;
      }
    };
  }, []);

  const getAvatarUrl = (user) => {
    if (user.avatar) {
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
    }
    
    // Handle guest users (IDs starting with 'guest-')
    if (typeof user.id === 'string' && user.id.startsWith('guest-')) {
      // Use a default avatar for guests
      return `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 6)}.png`;
    }
    
    // Discord snowflake IDs can be converted to BigInt
    try {
      const defaultAvatarIndex = (BigInt(user.id) >> 22n) % 6n;
      return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
    } catch {
      // Fallback if BigInt conversion fails
      return `https://cdn.discordapp.com/embed/avatars/0.png`;
    }
  };

  useEffect(() => {
    if (participants && participants.length > 0 && currentUser) {
      const discordPlayers = participants.map((participant) => {
        const user = participant.user || participant;

        const displayName = user.global_name || user.username || "Discord User";

        return {
          id: user.id,
          name: displayName,
          avatar: getAvatarUrl(user),
        };
      });

      if (currentUser && !discordPlayers.find((p) => p.id === currentUser.id)) {
        const currentUserDisplayName =
          currentUser.global_name || currentUser.username || "You";

        discordPlayers.unshift({
          id: currentUser.id,
          name: currentUserDisplayName,
          avatar: getAvatarUrl(currentUser),
        });
      }

      setPlayers(discordPlayers);

      const initialScores = {};
      discordPlayers.forEach((player) => {
        initialScores[player.id] = 0;
      });
      setScores(initialScores);
    } else if (!participants || participants.length === 0) {
      if (currentUser) {
        const currentUserDisplayName =
          currentUser.global_name || currentUser.username || "You";

        const singlePlayer = {
          id: currentUser.id,
          name: currentUserDisplayName,
          avatar: getAvatarUrl(currentUser),
        };
        setPlayers([singlePlayer]);
        setScores({ [singlePlayer.id]: 0 });
      }
    }
  }, [participants, currentUser]);

  // Initialize all audio objects once on mount
  useEffect(() => {
    // Initialize UI sound effects
    try {
      if (!clickSound.current) {
        clickSound.current = new Audio(clickSoundFile);
        clickSound.current.preload = "auto";
        clickSound.current.volume = 0.5;
      }
      if (!hoverSound.current) {
        hoverSound.current = new Audio(hoverSoundFile);
        hoverSound.current.preload = "auto";
        hoverSound.current.volume = 0.3;
      }
    } catch (err) {
      console.error("Failed to initialize UI sounds:", err);
    }

    // Initialize background music
    try {
      const files = [someOfAKindFile, revolootinFile, kothFile];
      const created = files.map((f, i) => {
        const a = new Audio(f);
        a.preload = "auto";
        a.loop = false;
        a.volume = NORMAL_VOLUME;
        a.crossOrigin = "anonymous";

        const onEnded = () => {
          const next = (currentIndexRef.current + 1) % files.length;
          currentIndexRef.current = next;

          if (musicEnabled) playTrackAt(next);
        };

        a.addEventListener("ended", onEnded);
        a._onEnded = onEnded;

        return a;
      });

      bg.current.tracks = created;
    } catch (err) {
      console.error("Failed to initialize background music:", err);
    }

    // Initialize AudioContext for reveal sounds
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();

      (async () => {
        try {
          const resp = await fetch(revealSoundFile);
          const arrayBuffer = await resp.arrayBuffer();
          const decoded =
            await audioCtxRef.current.decodeAudioData(arrayBuffer);
          revealBufferRef.current = decoded;
        } catch (err) {
          console.error("Failed to load reveal sound:", err);
        }
      })();
    } catch (e) {
      console.error("Failed to initialize AudioContext:", e);
    }

    return () => {
      // Clean up UI sounds
      try {
        if (clickSound.current) {
          clickSound.current.pause();
          clickSound.current.src = "";
          clickSound.current = null;
        }
        if (hoverSound.current) {
          hoverSound.current.pause();
          hoverSound.current.src = "";
          hoverSound.current = null;
        }
      } catch (e) {}

      // Clean up fade timer
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }

      // Clean up background music
      bg.current.tracks.forEach((a) => {
        try {
          if (a._onEnded) a.removeEventListener("ended", a._onEnded);
          a.pause();
          a.src = "";
        } catch (e) {}
      });
      bg.current.tracks = [];

      // Clean up AudioContext
      try {
        if (audioCtxRef.current && audioCtxRef.current.close) {
          audioCtxRef.current.close();
        }
      } catch (e) {}
    };
  }, []);

  const unlockAudioContext = async () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      audioUnlockedRef.current = true;

      if (pendingRevealRef.current && revealBufferRef.current) {
        playRevealBuffer();
        pendingRevealRef.current = false;
      }
    } catch (e) {}
  };

  useEffect(() => {
    const handler = () => {
      unlockAudioContext();
      window.removeEventListener("pointerdown", handler);
    };
    window.addEventListener("pointerdown", handler, { once: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

  const playRevealBuffer = () => {
    const ctx = audioCtxRef.current;
    const buffer = revealBufferRef.current;
    if (!ctx || !buffer) return;
    try {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = 1.0;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(0);
    } catch (e) {}
  };

  const startBackgroundMusic = () => {
    if (!musicEnabled) return;
    const tracks = bg.current.tracks;
    if (!tracks || tracks.length === 0) {
      return;
    }

    unlockAudioContext();

    const indexToPlay = currentIndexRef.current || 0;
    try {
      playTrackAt(indexToPlay);
    } catch (err) {}
  };

  useEffect(() => {
    const tryAutoStart = () => {
      if (musicEnabled) startBackgroundMusic();
      window.removeEventListener("pointerdown", tryAutoStart);
    };
    window.addEventListener("pointerdown", tryAutoStart, { once: true });
    return () => window.removeEventListener("pointerdown", tryAutoStart);
  }, [musicEnabled]);

  useEffect(() => {
    if (showResult) {
      if (audioUnlockedRef.current && revealBufferRef.current) {
        playRevealBuffer();
      } else {
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
      current
        .play()
        .catch(() => {})
        .finally(() => {
          fadeTo(current, NORMAL_VOLUME, FADE_DURATION);
        });
    }
  }, [showResult, musicEnabled]);

  const toggleMusic = (e) => {
    e.stopPropagation();
    const newValue = !musicEnabled;
    setMusicEnabled(newValue);

    if (newValue) {
      startBackgroundMusic();
    } else {
      try {
        pauseAllTracks();
      } catch (err) {}

      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    }
  };

  const playClickSound = () => {
    if (musicEnabled) startBackgroundMusic();

    unlockAudioContext();

    if (clickSound.current) {
      clickSound.current.currentTime = 0;
      clickSound.current.play().catch(() => {});
    }
  };

  const playHoverSound = () => {
    if (hoverSound.current) {
      hoverSound.current.currentTime = 0;
      hoverSound.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    const initializeQuestion = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const getQuestionFromServer = async (allowSyncAttempt = true) => {
        if (questionFetchInProgressRef.current) {
          return;
        }

        questionFetchInProgressRef.current = true;
        setIsLoading(true);

        try {
          if (!roomId) {
            setTimeout(() => {
              setIsLoading(false);
              questionFetchInProgressRef.current = false;
            }, 1000);
            return;
          }

          try {
            const gameStateResponse = await fetch(
              `${API_BASE_URL}/game-state/${roomId}`,
            );
            const gameStateData = await gameStateResponse.json();

            if (gameStateData.hostPlayerId !== undefined) {
              setHostPlayerId(gameStateData.hostPlayerId || null);
            }

            if (gameStateData.success && gameStateData.currentQuestion) {
              const question = gameStateData.currentQuestion;
              const timeLeft = gameStateData.timeLeft;
              const showResult = gameStateData.showResult || timeLeft <= 0;

              const isSameQuestion =
                currentQuestion && currentQuestion.id === question.id;

              setCurrentQuestion(question);
              setTimeLeft(timeLeft);
              setShowResult(showResult);
              currentQuestionIdRef.current = question?.id ?? null;

              if (!isSameQuestion) {
                setMySelection(null, question?.id ?? null);
                currentSelectionRef.current = null;
                window.lastSelectionTime = null;
                window.lastSelectionQuestionId = null;
              } else {
              }
              answerTimesRef.current = {};
              awardedDoneRef.current = false;
              setIsLoading(false);
              questionFetchInProgressRef.current = false;
              return;
            }

            const shouldSyncLocalQuestion =
              allowSyncAttempt &&
              canControlQuestions &&
              currentQuestionDataRef.current &&
              !showResultRef.current;

            if (shouldSyncLocalQuestion) {
              const synced = await syncLocalQuestionToServer(roomId);
              if (synced) {
                questionFetchInProgressRef.current = false;
                setIsLoading(false);
                await getQuestionFromServer(false);
                return;
              }
            }

            setCurrentQuestion(null);
            setShowResult(false);
            updateSelections({}, null);
            setMySelection(null, currentQuestionIdRef.current ?? null);
            currentQuestionIdRef.current = null;
            currentSelectionRef.current = null;
            window.lastSelectionTime = null;
            window.lastSelectionQuestionId = null;
            answerTimesRef.current = {};
            awardedDoneRef.current = false;
          } catch (error) {}
        } finally {
          setTimeout(() => {
            setIsLoading(false);
            questionFetchInProgressRef.current = false;
          }, 1500);
        }
      };

      if (!currentQuestion && !questionFetchInProgressRef.current) {
        getQuestionFromServer();
      }
    };

    initializeQuestion();
  }, [roomId, canControlQuestions, syncLocalQuestionToServer]);

  const normalizeServerSelections = (serverSelections) => {
    if (!serverSelections || typeof serverSelections !== "object") return {};

    const normalized = {};
    for (const [playerId, selection] of Object.entries(serverSelections)) {
      if (
        selection &&
        typeof selection === "object" &&
        "optionIndex" in selection
      ) {
        normalized[playerId] = selection.optionIndex;
      } else if (typeof selection === "number") {
        normalized[playerId] = selection;
      }
    }
    return normalized;
  };

  useEffect(() => {
    if (!socket || !socket.connected || !currentUser || !roomId) {
      return;
    }

    const syncGameState = async () => {
      if (questionFetchInProgressRef.current) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/game-state/${roomId}`);
        const data = await response.json();

        setHostPlayerId(data.hostPlayerId || null);

        if (
          (!data.currentQuestion || !data.currentQuestion.id) &&
          canControlQuestions &&
          currentQuestionDataRef.current &&
          !showResultRef.current
        ) {
          const synced = await syncLocalQuestionToServer(roomId);
          if (synced) {
            return;
          }
        }

        if (data.success && data.currentQuestion) {
          const currentQuestionId = currentQuestion?.id;
          const serverQuestionId = data.currentQuestion?.id;
          const isDifferentQuestion =
            !currentQuestion || currentQuestionId !== serverQuestionId;
          let questionChangedThisSync = false;

          if (isDifferentQuestion) {
            const hasCurrentQuestion =
              currentQuestion &&
              (currentQuestion.question ||
                currentQuestion.questionText ||
                currentQuestion.cardName);
            const hasServerQuestion =
              data.currentQuestion &&
              (data.currentQuestion.question || data.currentQuestion.cardName);

            const currentQuestionId = currentQuestion?.id;
            const serverQuestionId = data.currentQuestion?.id;

            const timeSinceLastSelection =
              Date.now() - (window.lastSelectionTime || 0);
            const hasRecentSelection = timeSinceLastSelection < 5000;
            const lastSelectionQuestionId = window.lastSelectionQuestionId;
            const recentSelectionMatchesServer =
              hasRecentSelection &&
              lastSelectionQuestionId &&
              serverQuestionId &&
              lastSelectionQuestionId === serverQuestionId;
            const shouldProtectRecentSelection = recentSelectionMatchesServer;

            const isActualQuestionChange =
              serverQuestionId &&
              currentQuestionId &&
              currentQuestionId !== serverQuestionId &&
              lastClearedQuestionRef.current !== serverQuestionId &&
              !shouldProtectRecentSelection;

            if (isActualQuestionChange) {
              lastClearedQuestionRef.current = serverQuestionId;
              setMySelection(null, serverQuestionId ?? null);
              setIsLocked(false);
              currentSelectionRef.current = null;
              hcCardAnswersRef.current = {};
              window.lastSelectionTime = null;
              window.lastSelectionQuestionId = null;
              setRevealPhaseQuestionId(null);
              setShowResult(false);
              updateSelections({}, serverQuestionId ?? null);
              answerTimesRef.current = {};
              awardedDoneRef.current = false;
              setServerScoredThisRound(false);
              questionChangedThisSync = true;
            }

            const isActualNewQuestion =
              currentQuestion &&
              data.currentQuestion &&
              currentQuestion.id !== data.currentQuestion.id &&
              currentQuestionId !== data.currentQuestion.id;

            if (isActualNewQuestion) {
              hcCardAnswersRef.current = {};
            }

            currentQuestionIdRef.current = data.currentQuestion?.id ?? null;
            setCurrentQuestion(data.currentQuestion);
            setTimeLeft(data.timeLeft);

            setShowResult(data.showResult);

            if (questionChangedThisSync && serverQuestionId) {
              if (locallyStartedQuestionIdRef.current === serverQuestionId) {
                clearJoinCountdown();
              } else {
                startJoinCountdown(serverQuestionId);
              }
            } else if (data.showResult) {
              clearJoinCountdown();
            }

            if (questionChangedThisSync) {
              const normalizedServerData = normalizeServerSelections(
                data.selections || {},
              );
              updateSelections(
                normalizedServerData,
                data.currentQuestion?.id ?? null,
              );
            } else if (!currentQuestion || currentQuestionId === serverQuestionId) {
              if (data.selections) {
                const currentLocalSelection =
                  mySelection !== null
                    ? mySelection
                    : currentSelectionRef.current;

                const serverWantsReveal = data.showResult;
                const alreadyInRevealForThisQuestion =
                  showResult &&
                  revealPhaseQuestionId === data.currentQuestion?.id;
                const isInRevealPhase =
                  serverWantsReveal || alreadyInRevealForThisQuestion;

                if (serverWantsReveal && !alreadyInRevealForThisQuestion) {
                  beginRevealPhase(data.currentQuestion?.id);
                }

                const myPlayerId = currentUser?.id;

                const hasAnsweredInSelections =
                  myPlayerId && selections[myPlayerId] !== undefined;
                const effectiveLocalSelection = hasAnsweredInSelections
                  ? selections[myPlayerId]
                  : currentLocalSelection;

                if (
                  isInRevealPhase &&
                  effectiveLocalSelection !== null &&
                  myPlayerId
                ) {
                  const normalizedServerData = normalizeServerSelections(
                    data.selections,
                  );

                  updateSelections((prev) => {
                    const merged = {
                      ...prev,
                      ...normalizedServerData,
                    };

                    if (
                      effectiveLocalSelection !== null &&
                      effectiveLocalSelection !== undefined
                    ) {
                      merged[myPlayerId] = effectiveLocalSelection;
                    } else {
                      delete merged[myPlayerId];
                    }

                    return merged;
                  }, data.currentQuestion?.id ?? null);
                } else {
                  const selectionQuestionId = window.lastSelectionQuestionId;
                  const currentQuestionId = data.currentQuestion?.id;
                  const localSelectionBelongsToThisQuestion =
                    currentLocalSelection !== null &&
                    myPlayerId &&
                    window.lastSelectionTime &&
                    selectionQuestionId === currentQuestionId &&
                    Date.now() - window.lastSelectionTime < MAX_TIME * 1000;

                  const hasValidSelection =
                    localSelectionBelongsToThisQuestion ||
                    effectiveLocalSelection !== null;

                  if (hasValidSelection) {
                    updateSelections((prev) => {
                      const merged = {
                        ...prev,
                        ...normalizeServerSelections(data.selections),
                      };

                      if (
                        effectiveLocalSelection !== null &&
                        effectiveLocalSelection !== undefined
                      ) {
                        merged[myPlayerId] = effectiveLocalSelection;
                      } else {
                        delete merged[myPlayerId];
                      }

                      return merged;
                    }, data.currentQuestion?.id ?? null);
                  } else {
                    const normalizedServerData = normalizeServerSelections(
                      data.selections,
                    );
                    const serverHasNoSelections =
                      Object.keys(normalizedServerData).length === 0;

                    if (serverHasNoSelections) {
                      const hasMySelection =
                        mySelection !== null ||
                        currentSelectionRef.current !== null;
                      const mySelectionForThisQuestion =
                        hasMySelection &&
                        window.lastSelectionQuestionId === currentQuestionId;

                      const hasAnsweredInRef =
                        hcCardAnswersRef.current[myPlayerId] !== undefined;
                      const hasAnsweredInSelections =
                        selections[myPlayerId] !== undefined;
                      const hasAnswered =
                        hasAnsweredInRef || hasAnsweredInSelections;

                      if (mySelectionForThisQuestion || hasAnswered) {
                        updateSelections(
                          (prev) => ({
                            ...prev,
                            [myPlayerId]: hasAnswered
                              ? prev[myPlayerId] || true
                              : mySelection !== null
                                ? mySelection
                                : currentSelectionRef.current,
                          }),
                          data.currentQuestion?.id ?? null,
                        );
                      } else if (!isLocked) {
                        updateSelections({}, data.currentQuestion?.id ?? null);
                      } else {
                      }
                    } else {
                      updateSelections(
                        (prev) => ({
                          ...prev,
                          ...normalizedServerData,
                        }),
                        data.currentQuestion?.id ?? null,
                      );
                    }
                  }
                }
              }
            }

            if (data.scores) {
              setScores(data.scores);
            }
            if (data.playerNames) {
              setPlayerNames((prevNames) => ({
                ...prevNames,
                ...data.playerNames,
              }));
            }
            answerTimesRef.current = {};
            awardedDoneRef.current = false;

            const shouldShowTimer =
              data.gameState === "playing" && data.timeLeft > 0;
            setIsTimerRunning(shouldShowTimer);

            if (data.timeLeft <= 0 && data.showResult) {
              setTimeout(() => {
                beginRevealPhase(data.currentQuestion?.id);
                setIsTimerRunning(false);
              }, 200);
            }
          } else {
            const isActiveGameplay = !showResult;

            const serverWantsReveal = data.showResult;
            const alreadyInRevealForThisQuestion =
              showResult && revealPhaseQuestionId === data.currentQuestion?.id;
            const isInRevealPhase =
              serverWantsReveal || alreadyInRevealForThisQuestion;

            if (serverWantsReveal && !alreadyInRevealForThisQuestion) {
              beginRevealPhase(data.currentQuestion?.id);
              setIsTimerRunning(false);
            }

            if (!isActiveGameplay) {
              const timeDiff = Math.abs(timeLeft - data.timeLeft);
              if (timeDiff > 3) {
                setTimeLeft(data.timeLeft);
                setIsTimerRunning(
                  data.gameState === "playing" &&
                    !data.showResult &&
                    data.timeLeft > 0,
                );
              }
            } else {
            }

            if (data.selections) {
              const hasLocalSelection =
                mySelection !== null || currentSelectionRef.current !== null;

              if (isInRevealPhase) {
                if (Object.keys(data.selections).length > 0) {
                  const localSelection =
                    hasLocalSelection && currentUser?.id
                      ? mySelection !== null
                        ? mySelection
                        : currentSelectionRef.current
                      : null;

                  const normalizedServerData = normalizeServerSelections(
                    data.selections,
                  );

                  updateSelections((prev) => {
                    const merged = {
                      ...prev,
                      ...normalizedServerData,
                    };

                    if (localSelection !== null && currentUser?.id) {
                      merged[currentUser.id] = localSelection;
                    }

                    return merged;
                  }, data.currentQuestion?.id ?? null);
                } else {
                  if (hasLocalSelection && currentUser?.id) {
                    const localSelection =
                      mySelection !== null
                        ? mySelection
                        : currentSelectionRef.current;
                    if (localSelection !== null && localSelection !== undefined) {
                      updateSelections(
                        (prev) => ({
                          ...prev,
                          [currentUser.id]: localSelection,
                        }),
                        data.currentQuestion?.id ?? null,
                      );
                    } else {
                      updateSelections(
                        (prev) => {
                          if (!prev || !(currentUser.id in prev)) {
                            return prev || {};
                          }
                          const next = { ...prev };
                          delete next[currentUser.id];
                          return next;
                        },
                        data.currentQuestion?.id ?? null,
                      );
                    }
                  } else {
                  }
                }
              } else if (
                isActiveGameplay &&
                hasLocalSelection &&
                currentUser?.id
              ) {
                const selectionQuestionId = window.lastSelectionQuestionId;
                const currentQuestionId = data.currentQuestion?.id;
                const localSelectionBelongsToThisQuestion =
                  window.lastSelectionTime &&
                  selectionQuestionId === currentQuestionId &&
                  Date.now() - window.lastSelectionTime < MAX_TIME * 1000;

                if (localSelectionBelongsToThisQuestion) {
                  const localSelection =
                    mySelection !== null
                      ? mySelection
                      : currentSelectionRef.current;
                  updateSelections((prev) => {
                    const merged = {
                      ...prev,
                      ...normalizeServerSelections(data.selections),
                    };
                    if (localSelection !== null && localSelection !== undefined) {
                      merged[currentUser.id] = localSelection;
                    } else {
                      delete merged[currentUser.id];
                    }

                    return merged;
                  }, data.currentQuestion?.id ?? null);
                } else {
                  const normalizedServerData = normalizeServerSelections(
                    data.selections,
                  );
                  const serverHasNoSelections =
                    Object.keys(normalizedServerData).length === 0;

                  if (serverHasNoSelections) {
                    const hasMySelection =
                      mySelection !== null ||
                      currentSelectionRef.current !== null;
                    const mySelectionForThisQuestion =
                      hasMySelection &&
                      window.lastSelectionQuestionId ===
                        data.currentQuestion?.id;

                    const myPlayerId = currentUser?.id;
                    const hasAnsweredInRef =
                      myPlayerId &&
                      hcCardAnswersRef.current[myPlayerId] !== undefined;
                    const hasAnsweredInSelections =
                      myPlayerId && selections[myPlayerId] !== undefined;
                    const hasAnswered =
                      hasAnsweredInRef || hasAnsweredInSelections;

                    if (mySelectionForThisQuestion || hasAnswered) {
                      if (myPlayerId) {
                        updateSelections(
                          (prev) => ({
                            ...prev,
                            [myPlayerId]: hasAnswered
                              ? prev[myPlayerId] || true
                              : mySelection !== null
                                ? mySelection
                                : currentSelectionRef.current,
                          }),
                          data.currentQuestion?.id ?? null,
                        );
                      }
                    } else if (!isLocked) {
                      updateSelections({}, data.currentQuestion?.id ?? null);
                    } else {
                    }
                  } else {
                    updateSelections(
                      (prev) => ({
                        ...prev,
                        ...normalizedServerData,
                      }),
                      data.currentQuestion?.id ?? null,
                    );
                  }
                }
              } else {
                const normalizedServerData = normalizeServerSelections(
                  data.selections,
                );
                const serverHasNoSelections =
                  Object.keys(normalizedServerData).length === 0;

                if (serverHasNoSelections) {
                  const hasMySelection =
                    mySelection !== null ||
                    currentSelectionRef.current !== null;
                  const mySelectionForThisQuestion =
                    hasMySelection &&
                    window.lastSelectionQuestionId === data.currentQuestion?.id;

                  const myPlayerId = currentUser?.id;
                  const hasAnsweredInRef =
                    myPlayerId &&
                    hcCardAnswersRef.current[myPlayerId] !== undefined;
                  const hasAnsweredInSelections =
                    myPlayerId && selections[myPlayerId] !== undefined;
                  const hasAnswered =
                    hasAnsweredInRef || hasAnsweredInSelections;

                  if (mySelectionForThisQuestion || hasAnswered) {
                    if (myPlayerId) {
                      updateSelections(
                        (prev) => ({
                          ...prev,
                          [myPlayerId]: hasAnswered
                            ? prev[myPlayerId] || true
                            : mySelection !== null
                              ? mySelection
                              : currentSelectionRef.current,
                        }),
                        data.currentQuestion?.id ?? null,
                      );
                    }
                  } else if (!isLocked) {
                    updateSelections({}, data.currentQuestion?.id ?? null);
                  } else {
                  }
                } else {
                  updateSelections(
                    (prev) => ({
                      ...prev,
                      ...normalizedServerData,
                    }),
                    data.currentQuestion?.id ?? null,
                  );
                }
              }
            }
            if (data.playerNames) {
              setPlayerNames((prevNames) => ({
                ...prevNames,
                ...data.playerNames,
              }));
            }
            if (data.scores) {
              setScores(data.scores);
            }
          }
        } else {
          if (data.scores) {
            setScores(data.scores);
          }
          if (data.playerNames) {
            setPlayerNames((prevNames) => ({
              ...prevNames,
              ...data.playerNames,
            }));
          }
          if (data.selections) {
            updateSelections(
              normalizeServerSelections(data.selections),
              currentQuestionIdRef.current ?? null,
            );
          }
        }
      } catch (error) {}
    };

    window.syncGameStateFunc = syncGameState;

    setTimeout(syncGameState, 12000);

    const syncInterval = setInterval(syncGameState, 12000);

    return () => {
      clearInterval(syncInterval);

      window.syncGameStateFunc = null;
    };
  }, [
    socket,
    socket?.connected,
    currentUser,
    roomId,
    startJoinCountdown,
    clearJoinCountdown,
    canControlQuestions,
    syncLocalQuestionToServer,
  ]);

  useEffect(() => {
    if (!currentQuestion) return;
    if (showResult) return;
    if (joinCountdown.active) return;

    setServerScoredThisRound(false);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);

          if (!autoEndGuardRef.current) {
            return 0;
          }

          if (!canControlQuestions) {
            return 0;
          }

          if (socket && socket.connected) {
            const endRoundRequest = async () => {
              try {
                const response = await fetch(`${API_BASE_URL}/game-event`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    event: "end_round",
                    data: {
                      roomId: roomId,
                      playerId: currentPlayerId,
                    },
                  }),
                });

                if (response.ok) {
                  const result = await response.json();
                  if (result && result.data && result.data.selections) {
                    const resolvedQuestionId =
                      result.data.questionId ??
                      currentQuestionIdRef.current ??
                      currentQuestion?.id ??
                      null;
                    updateSelections(
                      normalizeServerSelections(
                        result.data.selections || {},
                      ),
                      resolvedQuestionId,
                    );
                    if (result.data.playerNames) {
                      setPlayerNames(result.data.playerNames);
                    } else {
                    }
                    if (result.data.scores) {
                      setScores(result.data.scores);
                      setServerScoredThisRound(true);
                    }
                    beginRevealPhase(currentQuestionIdRef.current);
                  } else {
                    const localSelections = {};
                    const selectionToUse =
                      mySelection !== null
                        ? mySelection
                        : currentSelectionRef.current;
                    if (selectionToUse !== null && currentUser?.id) {
                      localSelections[currentUser.id] = selectionToUse;
                    } else {
                    }
                    updateSelections(
                      localSelections,
                      currentQuestionIdRef.current ??
                        currentQuestion?.id ??
                        null,
                    );
                    beginRevealPhase(currentQuestionIdRef.current);
                  }
                } else {
                  console.error(
                    "🚨 Server responded with error status:",
                    response.status,
                  );
                  throw new Error(
                    `Server responded with status: ${response.status}`,
                  );
                }
              } catch (error) {
                const localSelections = {};
                const selectionToUse =
                  mySelection !== null
                    ? mySelection
                    : currentSelectionRef.current;
                if (selectionToUse !== null && currentUser?.id) {
                  localSelections[currentUser.id] = selectionToUse;
                }
                updateSelections(
                  localSelections,
                  currentQuestionIdRef.current ??
                    currentQuestion?.id ??
                    null,
                );
                beginRevealPhase(currentQuestionIdRef.current);
              }
            };

            endRoundRequest();
          } else {
            beginRevealPhase(currentQuestionIdRef.current);
          }

          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [
    currentQuestion?.id,
    showResult,
    joinCountdown.active,
    socket,
    roomId,
    canControlQuestions,
  ]);

  const myPlayerId = currentPlayerId || "player1";

  const isCardMode = currentQuestion ? !!currentQuestion.isCard : false;

  const correctLetter =
    !isCardMode && currentQuestion ? currentQuestion.answer : null;
  const correctIndex =
    !isCardMode && currentQuestion
      ? currentQuestion.options.findIndex((opt) =>
          opt.startsWith(correctLetter),
        )
      : -1;

  const revealActive =
    !!currentQuestion?.id &&
    showResult &&
    revealPhaseQuestionId === currentQuestion.id;

  const onSelectOption = (playerId, optionIndex) => {
    if (showResult) return;

    if (mySelection === optionIndex) {
      return;
    }

    playClickSound();

    const activeQuestionId =
      currentQuestionIdRef.current ?? currentQuestion?.id ?? null;
    setMySelection(optionIndex, activeQuestionId);
    currentSelectionRef.current = optionIndex;

    updateSelections(
      (prev) => {
        const next = { ...prev };
        next[playerId] = optionIndex;
        return next;
      },
      activeQuestionId,
    );

    window.lastSelectionTime = Date.now();
    window.lastSelectionQuestionId = activeQuestionId;

    const submitSelection = async () => {
      if (socket?.connected) {
        let attempts = 0;
        const maxAttempts = 3;

        const trySubmit = async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/game-event`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event: "select_option",
                data: {
                  roomId: roomId,
                  playerId: playerId,
                  playerName:
                    currentUser?.global_name ||
                    currentUser?.username ||
                    "Unknown Player",
                  optionIndex: optionIndex,
                  timeTaken: MAX_TIME - timeLeft,
                },
              }),
            });

            if (response.ok) {
            } else {
              throw new Error(
                `Server responded with status: ${response.status}`,
              );
            }
          } catch (error) {
            attempts++;

            if (attempts < maxAttempts) {
              setTimeout(trySubmit, 1000);
            } else {
            }
          }
        };

        await trySubmit();
      } else {
        const pendingQuestionId = currentQuestionIdRef.current;
        setTimeout(() => {
          updateSelections(
            { [playerId]: optionIndex },
            pendingQuestionId ?? null,
          );
          beginRevealPhase(pendingQuestionId);
        }, 1000);
      }
    };

    submitSelection();

    if (answerTimesRef.current[playerId] === undefined) {
      answerTimesRef.current = {
        ...answerTimesRef.current,
        [playerId]: timeLeft,
      };
    } else {
    }

    if (musicEnabled) startBackgroundMusic();
    unlockAudioContext();
  };

  const onSubmitCardAnswer = async (playerId, text) => {
    if (showResult) return;
    if (!isCardMode) return;
    if (selections[playerId] !== undefined) return;

    const attempt = (text || cardInput || "").trim();
    if (!attempt) return;

    const expected = (currentQuestion.cardName || "").trim().toLowerCase();
    const given = attempt.toLowerCase();

    if (given === expected) {
      const clickedTimeLeft = timeLeft;

      answerTimesRef.current = {
        ...answerTimesRef.current,
        [playerId]: clickedTimeLeft,
      };

      hcCardAnswersRef.current = {
        ...hcCardAnswersRef.current,
        [playerId]: true,
      };

      updateSelections(
        (prev) => ({ ...prev, [playerId]: true }),
        currentQuestionIdRef.current ?? currentQuestion?.id ?? null,
      );
      setCardLastWrong(false);
      setIsLocked(true);

      try {
        const response = await fetch(`${API_BASE_URL}/game-event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "select_option",
            data: {
              roomId: roomId,
              playerId: playerId,
              playerName:
                currentUser?.global_name ||
                currentUser?.username ||
                "Unknown Player",
              cardAnswer: attempt,
              isCorrect: true,
              timeTaken: MAX_TIME - timeLeft,
            },
          }),
        });

        if (response.ok) {
        } else {
        }
      } catch (error) {}
    } else {
      setCardLastWrong(true);

      playHoverSound();
    }
  };

  useEffect(() => {
    if (!showResult) return;
    if (awardedDoneRef.current) return;
    if (serverScoredThisRound) {
      awardedDoneRef.current = true;
      return;
    }

    setScores((prevScores) => {
      const newScores = { ...prevScores };

      const computePointsFromTime = (time) => {
        if (!time || time <= 0) return 0;
        const x = Math.max(0, Math.min(1, time / MAX_TIME));
        const raw = MAX_POINTS * Math.pow(x, SCORING_EXPONENT);
        return Math.round(raw);
      };

      if (isCardMode) {
        // Award points for correct HC card answers
        players.forEach(({ id }) => {
          if (hcCardAnswersRef.current[id] === true) {
            const timeAtAnswer = answerTimesRef.current[id];
            const points = timeAtAnswer
              ? computePointsFromTime(timeAtAnswer)
              : 0;
            newScores[id] = (newScores[id] || 0) + points;
          }
        });
      } else {
        players.forEach(({ id }) => {
          if (selections[id] === correctIndex) {
            const timeAtAnswer = answerTimesRef.current[id];
            const points = timeAtAnswer
              ? computePointsFromTime(timeAtAnswer)
              : 0;
            newScores[id] = (newScores[id] || 0) + points;
          }
        });
      }

      return newScores;
    });

    awardedDoneRef.current = true;
  }, [showResult]);

  const onNextQuestion = async () => {
    if (!canControlQuestions) {
      console.log("Ignoring next-question trigger because user is not host");
      return;
    }

    setIsLoading(true);

    try {
      setIsTransitioning(true);
      const attemptStartQuestion = async (retryCount = 0) => {
        const response = await fetch(`${API_BASE_URL}/start_question`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: roomId,
            forceNew: true,
            playerId: currentPlayerId,
          }),
        });

        const result = await response.json();

        if (response.status === 409 && retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          return attemptStartQuestion(retryCount + 1);
        }

        if (response.status === 429 && retryCount < 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return attemptStartQuestion(retryCount + 1);
        }

        return { response, result };
      };

      const { response, result } = await attemptStartQuestion();

      const resolvedHostId =
        result?.hostPlayerId ?? result?.data?.hostPlayerId;
      if (resolvedHostId !== undefined) {
        setHostPlayerId(resolvedHostId || null);
      }

      const nextQuestion = result?.question ?? result?.data?.question;

      if (result && result.success && nextQuestion) {
        const question = nextQuestion;
        currentQuestionIdRef.current = question?.id ?? null;
        locallyStartedQuestionIdRef.current = question?.id ?? null;
        if (resolvedHostId === undefined) {
          setHostPlayerId(hostPlayerId ?? currentPlayerId ?? null);
        }
        setCurrentQuestion(question);
        setShowResult(false);
        setRevealPhaseQuestionId(null);
        clearJoinCountdown();
        autoEndGuardRef.current = true;
        const serverSelections = normalizeServerSelections(
          result?.data?.selections || result?.selections || {},
        );
        updateSelections(serverSelections, question?.id ?? null);
        setMySelection(null, question?.id ?? null);
        setIsLocked(false);
        hcCardAnswersRef.current = {};
        currentSelectionRef.current = null;
        window.lastSelectionTime = null;
        window.lastSelectionQuestionId = null;
        setTimeLeft(result?.timeLeft ?? result?.data?.timeLeft ?? MAX_TIME);
        answerTimesRef.current = {};
        awardedDoneRef.current = false;
        setServerScoredThisRound(false);
        setIsTransitioning(false);
      } else {
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
      setIsTransitioning(false);
    }
  };

  const sortedPlayers = useMemo(() => {
    return players
      .map((p) => ({ ...p, score: scores[p.id] || 0 }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name);
      });
  }, [scores]);

  const getMedalForRank = (rankIdx) => {
    if (rankIdx === 0) return medalFirst;
    if (rankIdx === 1) return medalSecond;
    if (rankIdx === 2) return medalThird;
    return null;
  };

  useLayoutEffect(() => {
    const newRects = {};
    sortedPlayers.forEach((p) => {
      const el = document.querySelector(`[data-player-id="${p.id}"]`);
      if (el) newRects[p.id] = el.getBoundingClientRect();
    });

    const prevRects = prevRectsRef.current || {};

    sortedPlayers.forEach((p) => {
      const prev = prevRects[p.id];
      const next = newRects[p.id];
      if (!prev || !next) return;
      const deltaY = prev.top - next.top;
      if (!deltaY) return;

      const els = document.querySelectorAll(`[data-player-id="${p.id}"]`);
      els.forEach((el) => {
        el.style.transition = "none";
        el.style.transform = `translateY(${deltaY}px)`;
        el.style.willChange = "transform";
      });

      requestAnimationFrame(() => {
        els.forEach((el) => {
          el.style.transition =
            "transform 480ms cubic-bezier(0.2, 0.8, 0.2, 1)";
          el.style.transform = "";
        });
      });

      setTimeout(() => {
        els.forEach((el) => {
          el.style.transition = "";
          el.style.willChange = "";
        });
      }, 520);
    });

    prevRectsRef.current = newRects;
  }, [sortedPlayers]);

  useEffect(() => {
    const duration = 600;

    Object.keys(scores).forEach((id) => {
      const start = displayScoresRef.current[id] || 0;
      const end = scores[id] || 0;
      if (start === end) return;

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

    return () => {
      Object.values(scoreAnimFramesRef.current).forEach((f) => {
        if (f) cancelAnimationFrame(f);
      });
      scoreAnimFramesRef.current = {};
    };
  }, [scores]);

  if (isLoading || isTransitioning) {
    const isInGameLoading = questionFetchInProgressRef.current || !!currentQuestion;
    return (
      <div
        className="app-container"
        style={{
          backgroundImage: `url(${isInGameLoading ? quizScreenBg : restartScreenBg})`,
          backgroundSize: isInGameLoading ? "cover" : "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "0 32px 96px",
          boxSizing: "border-box",
        }}
      >
        <p
          style={{
            fontSize: 16,
            textAlign: "center",
            color: "rgba(255, 228, 181, 0.85)",
            margin: 0,
            padding: "12px 24px",
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            borderRadius: 12,
            fontFamily: '"Trajan Pro Bold", serif',
            letterSpacing: 1,
          }}
        >
          {isTransitioning
            ? "Preparing your next challenge"
            : "Preparing your Age of Empires III challenge"}
        </p>
      </div>
    );
  }

  if (!currentQuestion && !isLoading && !questionFetchInProgressRef.current) {
    return (
      <div
        className="app-container"
        style={{
          backgroundImage: `url(${restartScreenBg})`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "0 32px 96px",
          boxSizing: "border-box",
        }}
      >
        <button
          className="restart-button"
          aria-label="Restart quiz"
          style={{
            width: 360,
            height: 65,
            backgroundImage: `url(${restartButtonBg})`,
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={playHoverSound}
          onClick={async () => {
            console.log('🎮 Start button clicked', {
              canControlQuestions,
              currentPlayerId,
              hostPlayerId,
              isHost,
            });
            
            if (!canControlQuestions) {
              console.warn("⚠️ Non-host attempted to restart quiz", {
                currentPlayerId,
                hostPlayerId,
                message: "This player is not the host and cannot start the quiz"
              });
              return;
            }

              playClickSound();

              setScores(
                players.reduce((acc, p) => {
                  acc[p.id] = 0;
                  return acc;
                }, {}),
              );

              answerTimesRef.current = {};
              awardedDoneRef.current = false;

              setIsLoading(true);
              try {
                const response = await fetch(`${API_BASE_URL}/start_question`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    roomId: roomId,
                    forceNew: true,
                    playerId: currentPlayerId,
                  }),
                });

                const result = await response.json();

                const resolvedHostId =
                  result?.hostPlayerId ?? result?.data?.hostPlayerId;
                if (resolvedHostId !== undefined) {
                  setHostPlayerId(resolvedHostId || null);
                }

                const restartQuestion = result?.question ?? result?.data?.question;

                if (result.success && restartQuestion) {
                  currentQuestionIdRef.current = restartQuestion?.id ?? null;
                  locallyStartedQuestionIdRef.current = restartQuestion?.id ?? null;
                  if (resolvedHostId === undefined) {
                    setHostPlayerId(hostPlayerId ?? currentPlayerId ?? null);
                  }
                  setCurrentQuestion(restartQuestion);
                  setTimeLeft(
                    result?.timeLeft ?? result?.data?.timeLeft ?? MAX_TIME,
                  );
                  setShowResult(false);
                  clearJoinCountdown();
                  autoEndGuardRef.current = true;
                  const serverSelections = normalizeServerSelections(
                    result?.data?.selections || result?.selections || {},
                  );
                  updateSelections(serverSelections, restartQuestion?.id ?? null);
                  setMySelection(null, restartQuestion?.id ?? null);
                  currentSelectionRef.current = null;

                  setScores({});
                  setDisplayScores({});
                }
              } catch (error) {
              } finally {
                setIsLoading(false);
              }
            }}
          ></button>
      </div>
    );
  }

  const handleLeaderboardMouseDown = (e) => {
    if (e.target.closest(".leaderboard-title button")) return;

    e.preventDefault();
    setIsDraggingLeaderboard(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    let animationFrame = null;
    let lastX = null;
    let lastY = null;

    const handleMouseMove = (moveEvent) => {
      const newX = Math.max(
        0,
        Math.min(window.innerWidth - 280, moveEvent.clientX - offsetX),
      );
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - 200, moveEvent.clientY - offsetY),
      );

      if (newX !== lastX || newY !== lastY) {
        lastX = newX;
        lastY = newY;

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
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const toggleLeaderboardCollapse = () => {
    setIsLeaderboardCollapsed(!isLeaderboardCollapsed);
  };

  return (
    <div
      className="app-container"
      style={{
        backgroundImage: `url(${quizScreenBg})`,
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
      {joinCountdown.active && (
        <div
          className="join-countdown-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            color: "#fff4d6",
            textShadow: "0 2px 6px rgba(0, 0, 0, 0.6)",
            pointerEvents: "none",
            fontFamily: '"Trajan Pro Bold", serif',
          }}
        >
          <p style={{ fontSize: 22, marginBottom: 4 }}>Joining mid-round</p>
          <p style={{ fontSize: 42, margin: 0 }}>
            Syncing in {joinCountdown.remaining}s
          </p>
        </div>
      )}
      {}
      <aside
        className={`leaderboard-container ${isLeaderboardCollapsed ? "collapsed" : ""} ${isDraggingLeaderboard ? "dragging" : ""}`}
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
            onMouseDown={(e) => e.stopPropagation()}
            aria-label={
              isLeaderboardCollapsed
                ? "Expand leaderboard"
                : "Collapse leaderboard"
            }
          >
            {isLeaderboardCollapsed ? "▲" : "▼"}
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
                  {}
                  <div className="leaderboard-row">
                    {medal ? (
                      <img src={medal} alt={`#${idx + 1} medal`} />
                    ) : (
                      <span className="leaderboard-rank">{idx + 1}</span>
                    )}
                    <span
                      className="leaderboard-name"
                      data-length={p.name.length > 18 ? "long" : "normal"}
                      title={p.name.length > 18 ? p.name : undefined}
                    >
                      {p.name}
                    </span>
                    <span
                      className={`leaderboard-score ${scoreHighlight[p.id] ? "score-bump" : ""}`}
                    >
                      {formatNumber(displayScores[p.id] ?? 0)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </aside>

      {}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 999 }}>
        <button
          onClick={toggleMusic}
          onMouseEnter={() => {}}
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
            transform: "translateY(-15px)",
          }}
        />

        <p className="timer">Time Left: {timeLeft}s</p>

        {}
        {currentQuestion ? (
          <>
            {}
            {isCardMode ? (
              <>
                <h2 className="question">What HC card is this?</h2>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {}
                  <div
                    style={{ position: "relative", width: 160, height: 160 }}
                  >
                    {cardImageUrl ? (
                      <img
                        src={cardImageUrl}
                        alt="HC card"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          borderRadius: 8,
                          boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 8,
                          boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
                          background:
                            "linear-gradient(135deg, #2c1810 0%, #4a3222 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#d4b887",
                          fontSize: "14px",
                          textAlign: "center",
                          border: "2px solid #8b6914",
                        }}
                      >
                        Loading card...
                      </div>
                    )}

                    {}
                    {revealActive && (
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
                        <div style={{ fontWeight: 700 }}>
                          Correct Answer: {currentQuestion.cardName}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
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
                      disabled={
                        showResult || selections[myPlayerId] !== undefined
                      }
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

                        backgroundImage: `url(${showResult || selections[myPlayerId] !== undefined ? nicknameBgOver : nicknameBg})`,
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",

                        backgroundColor: "transparent",
                        WebkitAppearance: "none",
                        MozAppearance: "none",

                        opacity:
                          showResult || selections[myPlayerId] !== undefined
                            ? 0.7
                            : 1,
                        filter:
                          showResult || selections[myPlayerId] !== undefined
                            ? "brightness(0.85)"
                            : "none",
                        transition: "opacity 0.3s ease, filter 0.3s ease",
                        pointerEvents:
                          showResult || selections[myPlayerId] !== undefined
                            ? "none"
                            : "auto",
                      }}
                    />

                    <button
                      onClick={() => {
                        if (
                          !showResult &&
                          selections[myPlayerId] === undefined
                        ) {
                          playClickSound();
                        }
                        onSubmitCardAnswer(myPlayerId, cardInput);
                      }}
                      onMouseEnter={
                        showResult || selections[myPlayerId] !== undefined
                          ? undefined
                          : playHoverSound
                      }
                      disabled={
                        showResult || selections[myPlayerId] !== undefined
                      }
                      style={{
                        height: 48,
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "none",
                        cursor:
                          showResult || selections[myPlayerId] !== undefined
                            ? "default"
                            : "pointer",
                        backgroundImage: `url(${btnNormal})`,
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        backgroundColor: "transparent",
                        color: "white",
                        textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                        fontSize: "1.4rem",
                        width: 320,

                        opacity:
                          showResult || selections[myPlayerId] !== undefined
                            ? 0.7
                            : 1,
                        filter:
                          showResult || selections[myPlayerId] !== undefined
                            ? "brightness(0.85)"
                            : "none",
                        transition: "opacity 0.3s ease, filter 0.3s ease",
                        pointerEvents:
                          showResult || selections[myPlayerId] !== undefined
                            ? "none"
                            : "auto",
                      }}
                    >
                      Submit!
                    </button>
                  </div>

                  {cardLastWrong && !showResult && (
                    <div style={{ color: "#ffb3b3", marginTop: 6 }}>
                      Incorrect — try again.
                    </div>
                  )}

                  {}
                </div>
              </>
            ) : (
              <>
                <h2 className="question">{currentQuestion.question}</h2>

                <div className="options-grid">
                  {currentQuestion.options.map((opt, i) => {
                    const reveal = revealActive;
                    const disableInteractions = showResult;
                    const isMySelected = i === mySelection;

                    const isMySelectionInRef =
                      currentSelectionRef.current === i;

                    const isMySelectionOnServer = selections[myPlayerId] === i;
                    const isLocked = isMySelected || isMySelectionOnServer;

                    let backgroundImage = `url(${btnNormal})`;
                    let boxShadow = "none";
                    let opacity = 1;
                    let cursor = "pointer";
                    let pointerEvents = "auto";
                    let filter = "none";

                    if (reveal) {
                      if (i === correctIndex) {
                        backgroundImage = `url(${btnHover})`;
                        boxShadow = "0 0 12px 4px gold";
                      } else {
                        backgroundImage = `url(${btnDisabled})`;
                      }
                    } else if (disableInteractions) {
                      backgroundImage = `url(${btnDisabled})`;
                      cursor = "default";
                      pointerEvents = "none";
                      opacity = 0.85;
                      filter = "brightness(0.9)";
                    } else if (isLocked) {
                      backgroundImage = `url(${btnHover})`;

                      opacity = 0.7;
                      cursor = "default";
                      pointerEvents = "none";
                      filter = "brightness(0.85)";
                    }

                    return (
                      <button
                        key={i}
                        disabled={disableInteractions}
                        className="option-button"
                        style={{
                          backgroundImage,
                          boxShadow,
                          opacity,
                          cursor: disableInteractions ? "default" : cursor,
                          pointerEvents: disableInteractions
                            ? "none"
                            : pointerEvents,
                          filter,
                          transition: "opacity 0.3s ease, filter 0.3s ease",
                        }}
                        onMouseEnter={
                          !isLocked && !disableInteractions
                            ? playHoverSound
                            : undefined
                        }
                        onClick={() => {
                          if (isLocked) return;

                          onSelectOption(myPlayerId, i);
                        }}
                      >
                        <span className="option-text">{opt}</span>

                        {}
                        {}
                        {!reveal && (isMySelected || isMySelectionInRef) && (
                          <>
                            {}
                            <span className="option-badge my-selection">
                              {currentUser?.username ||
                                currentUser?.global_name ||
                                "You"}
                            </span>
                          </>
                        )}

                        {}
                        {reveal &&
                          (() => {
                            const playersForOption = Object.entries(
                              selections,
                            ).filter(
                              ([playerId, optionIndex]) => optionIndex === i,
                            );

                            if (playersForOption.length === 0) {
                              return null;
                            }

                            const playerNames_display = playersForOption
                              .map(([playerId]) => {
                                let playerName = playerNames[playerId];

                                if (!playerName) {
                                  const player = players.find(
                                    (p) => p.id === playerId,
                                  );
                                  playerName = player?.name;
                                }

                                if (
                                  !playerName &&
                                  playerId === currentUser?.id
                                ) {
                                  playerName =
                                    currentUser?.username ||
                                    currentUser?.global_name;
                                }

                                const finalName =
                                  playerName || `Player ${playerId.slice(-4)}`;
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
            {socket && socket.connected && isInVoiceChannel ? (
              <div>
                <p>Ready to start the quiz?</p>
                <button
                  className="next-question-button"
                  disabled={!canControlQuestions}
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
                    cursor: canControlQuestions ? "pointer" : "not-allowed",
                    outline: "none",
                    filter: canControlQuestions
                      ? "drop-shadow(0 0 8px gold)"
                      : "grayscale(0.6)",
                    userSelect: "none",
                  }}
                  onMouseEnter={() => playHoverSound()}
                  onClick={async () => {
                    if (!canControlQuestions) {
                      console.log(
                        "Ignored start request from non-host participant",
                      );
                      return;
                    }

                    playClickSound();

                    try {
                      const response = await fetch(
                        `${API_BASE_URL}/start_question`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            roomId: roomId,
                            forceNew: false,
                            playerId: currentPlayerId,
                          }),
                        },
                      );

                      const result = await response.json();

                      const resolvedHostId =
                        result?.hostPlayerId ?? result?.data?.hostPlayerId;
                      if (resolvedHostId !== undefined) {
                        setHostPlayerId(resolvedHostId || null);
                      }

                      const startQuestion =
                        result?.question ?? result?.data?.question;

                      if (result && result.success && startQuestion) {
                        const question = startQuestion;
                        currentQuestionIdRef.current = question?.id ?? null;
                        if (resolvedHostId === undefined) {
                          setHostPlayerId(
                            hostPlayerId ?? currentPlayerId ?? null,
                          );
                        }
                        setCurrentQuestion(question);
                        setShowResult(false);
                        const serverSelections = normalizeServerSelections(
                          result?.data?.selections || result?.selections || {},
                        );
                        updateSelections(serverSelections, question?.id ?? null);
                        setMySelection(null, question?.id ?? null);
                        currentSelectionRef.current = null;
                        setTimeLeft(
                          result?.timeLeft ?? result?.data?.timeLeft ?? MAX_TIME,
                        );
                        answerTimesRef.current = {};
                        awardedDoneRef.current = false;
                      } else {
                      }
                    } catch (error) {}
                  }}
                >
                  Start Quiz
                </button>
                {!canControlQuestions && (
                  <p style={{ marginTop: 8, color: "#ffb347" }}>
                    Waiting for the host to start…
                  </p>
                )}
              </div>
            ) : (
              <p>No question loaded. Wait for the host to start the quiz.</p>
            )}
          </div>
        )}
      </div>

      {}
      <button
        className="next-question-button"
        onMouseEnter={() => {
          if (showResult && canControlQuestions) playHoverSound();
        }}
        onClick={() => {
          if (showResult && canControlQuestions) {
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
          cursor: showResult && canControlQuestions ? "pointer" : "default",
          outline: "none",
          filter:
            showResult && canControlQuestions
              ? "drop-shadow(0 0 8px gold)"
              : "none",
          visibility: showResult && canControlQuestions ? "visible" : "hidden",
          pointerEvents: showResult && canControlQuestions ? "auto" : "none",
          userSelect: "none",
        }}
      >
        Next Question
      </button>
      {showResult && !canControlQuestions && (
        <p style={{ marginTop: 8, color: "#ffb347" }}>
          Waiting for the host to pick the next question…
        </p>
      )}

      {}
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
