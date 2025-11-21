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
import { DiscordProxySocket } from "./socket";
import { safeLog } from "./utils/logger";

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

const API_BASE_URL = "/api";

const MAX_TIME = 20;

const NORMAL_VOLUME = 0.3;
const FADED_VOLUME = 0.04;
const FADE_DURATION = 800;

const MAX_POINTS = 150;

const SCORING_EXPONENT = 2;

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

  let roomId = channelId;

  if (!roomId && instanceId) {
    const instanceParts = instanceId.split("-");
    if (instanceParts.length >= 4) {
      roomId = instanceParts[instanceParts.length - 1];
    } else {
      roomId = instanceId;
    }
  }

  if (!roomId) {
    roomId = "fallback-quiz-room";
  }

  safeLog.room("🏠 Using room ID:", roomId);

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
    [currentQuestion]
  );

  const beginRevealPhase = (explicitQuestionId) => {
    let resolvedQuestionId =
      explicitQuestionId ?? currentQuestionIdRef.current ?? null;

    if (resolvedQuestionId == null && currentQuestion?.id) {
      resolvedQuestionId = currentQuestion.id;
    }

    setRevealPhaseQuestionId(resolvedQuestionId ?? null);
    setShowResult(true);
  };

  const answerTimesRef = useRef({});

  const hcCardAnswersRef = useRef({});

  const lastClearedQuestionRef = useRef(null);

  const activityRestartedRef = useRef(false);
  const lastReadyStateRef = useRef(null);
  const hasInitializedRef = useRef(false);

  const clickSound = useRef(new Audio(clickSoundFile));
  const hoverSound = useRef(new Audio(hoverSoundFile));

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

      if (socket && roomId) {
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

  useEffect(() => {
    if (!socket || !currentUser) return;

    socket.on("gameState", (gameState) => {
      const isNewQuestion =
        currentQuestion?.id !== gameState.currentQuestion?.id;

      setCurrentQuestion(gameState.currentQuestion);

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

      setShowResult(gameState.showResult);
      setTimeLeft(gameState.timeLeft);
      setScores(gameState.scores);
    });

    socket.on("question_started", (data) => {
      if (data.question) {
        const isNewQuestion =
          !currentQuestion || currentQuestion.id !== data.question.id;

        currentQuestionIdRef.current = data.question.id ?? null;
        setCurrentQuestion(data.question);
        setShowResult(false);
        setRevealPhaseQuestionId(null);

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

    if (socket.connected && !socket.localMode) {
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
    if (currentUser?.username && !socket) {
      const initSocket = async () => {
        try {
          const newSocket = new DiscordProxySocket();

          newSocket.onStateChange(() => {
            setSocketStateVersion((prev) => prev + 1);
          });

          const connected = await newSocket.connect();

          if (connected && !newSocket.localMode) {
            let joinAttempts = 0;
            const maxAttempts = 3;

            const joinRoom = async () => {
              try {
                await newSocket.emit("join_room", {
                  room: roomId,
                  username: currentUser.username,
                });

                if (activityRestartedRef.current) {
                  try {
                    await fetch(`${API_BASE_URL}/game-event`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        event: "reset_scores",
                        data: { roomId },
                      }),
                    });
                    activityRestartedRef.current = false;
                  } catch (error) {
                    console.error("❌ Failed to reset scores:", error);
                  }
                }
              } catch (error) {
                joinAttempts++;

                if (joinAttempts < maxAttempts) {
                  setTimeout(joinRoom, 2000);
                } else {
                }
              }
            };

            await joinRoom();
          } else {
          }

          setSocket(newSocket);
        } catch (error) {}
      };

      initSocket();
    }
  }, [currentUser, roomId, socket]);

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
    };
  }, []);

  useEffect(() => {
    if (participants && participants.length > 0 && currentUser) {
      const discordPlayers = participants.map((participant) => {
        const user = participant.user || participant;

        const displayName = user.global_name || user.username || "Discord User";

        let avatarUrl = "";
        if (user.avatar) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
        } else {
          const defaultAvatarIndex = (BigInt(user.id) >> 22n) % 6n;
          avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        }

        return {
          id: user.id,
          name: displayName,
          avatar: avatarUrl,
        };
      });

      if (currentUser && !discordPlayers.find((p) => p.id === currentUser.id)) {
        const currentUserDisplayName =
          currentUser.global_name || currentUser.username || "You";
        let currentUserAvatar = "";
        if (currentUser.avatar) {
          currentUserAvatar = `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=256`;
        } else {
          const defaultAvatarIndex = (BigInt(currentUser.id) >> 22n) % 6n;
          currentUserAvatar = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        }

        discordPlayers.unshift({
          id: currentUser.id,
          name: currentUserDisplayName,
          avatar: currentUserAvatar,
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
        let currentUserAvatar = "";
        if (currentUser.avatar) {
          currentUserAvatar = `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=256`;
        } else {
          const defaultAvatarIndex = (BigInt(currentUser.id) >> 22n) % 6n;
          currentUserAvatar = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        }

        const singlePlayer = {
          id: currentUser.id,
          name: currentUserDisplayName,
          avatar: currentUserAvatar,
        };
        setPlayers([singlePlayer]);
        setScores({ [singlePlayer.id]: 0 });
      }
    }
  }, [participants, currentUser]);

  useEffect(() => {
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
    } catch (err) {}

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
        } catch (err) {}
      })();
    } catch (e) {}

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

    clickSound.current.currentTime = 0;
    clickSound.current.play().catch(() => {});
  };

  const playHoverSound = () => {
    hoverSound.current.currentTime = 0;
    hoverSound.current.play().catch(() => {});
  };

  useEffect(() => {
    const initializeQuestion = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const getQuestionFromServer = async () => {
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
  }, [roomId]);

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
    if (
      !socket ||
      socket.localMode ||
      !socket.connected ||
      !currentUser ||
      !roomId
    ) {
      return;
    }

    const syncGameState = async () => {
      if (questionFetchInProgressRef.current) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/game-state/${roomId}`);
        const data = await response.json();

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

    setTimeout(syncGameState, 3000);

    const syncInterval = setInterval(syncGameState, 3000);

    return () => {
      clearInterval(syncInterval);

      window.syncGameStateFunc = null;
    };
  }, [socket, socket?.connected, socket?.localMode, currentUser, roomId]);

  useEffect(() => {
    if (!currentQuestion) return;
    if (showResult) return;

    setServerScoredThisRound(false);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);

          if (socket && !socket.localMode) {
            const endRoundRequest = async () => {
              try {
                const response = await fetch(`${API_BASE_URL}/game-event`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    event: "end_round",
                    data: {
                      roomId: roomId,
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
  }, [currentQuestion?.id, showResult, socket, roomId]);

  const myPlayerId = currentUser?.id || "player1";

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
      if (socket && !socket.localMode) {
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
        if (socket?.localMode) {
          players.forEach(({ id }) => {
            if (selections[id] === true) {
              const timeAtAnswer = answerTimesRef.current[id];
              const points = timeAtAnswer
                ? computePointsFromTime(timeAtAnswer)
                : 0;
              newScores[id] = (newScores[id] || 0) + points;
            }
          });
        } else {
        }
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

      const nextQuestion = result?.question ?? result?.data?.question;

      if (result && result.success && nextQuestion) {
        const question = nextQuestion;
        currentQuestionIdRef.current = question?.id ?? null;
        setCurrentQuestion(question);
        setShowResult(false);
        setRevealPhaseQuestionId(null);
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
                  }),
                });

                const result = await response.json();

                const restartQuestion = result?.question ?? result?.data?.question;

                if (result.success && restartQuestion) {
                  currentQuestionIdRef.current = restartQuestion?.id ?? null;
                  setCurrentQuestion(restartQuestion);
                  setTimeLeft(
                    result?.timeLeft ?? result?.data?.timeLeft ?? MAX_TIME,
                  );
                  setShowResult(false);
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
            {socket &&
            !socket.localMode &&
            socket.connected &&
            isInVoiceChannel ? (
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

                    try {
                      const response = await fetch(
                        `${API_BASE_URL}/start_question`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            roomId: roomId,
                            forceNew: false,
                          }),
                        },
                      );

                      const result = await response.json();

                      const startQuestion =
                        result?.question ?? result?.data?.question;

                      if (result && result.success && startQuestion) {
                        const question = startQuestion;
                        currentQuestionIdRef.current = question?.id ?? null;
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
