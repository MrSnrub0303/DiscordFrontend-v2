const SOLO_ROOM_KEY_PREFIX = "aoe3-quiz-solo-room";

export const ensureSoloRoomId = (userId) => {
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

export const deriveInstanceRoomId = (instanceId) => {
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
