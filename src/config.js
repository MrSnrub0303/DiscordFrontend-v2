// App-wide settings shared across screens

// Discord's URL mapping forwards /api/* to the backend (with the /api prefix stripped)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const MAX_TIME = 20;
export const JOIN_COUNTDOWN_SECONDS = 3;

export const NORMAL_VOLUME = 0.15;

export const MAX_POINTS = 150;

export const SCORING_EXPONENT = 2;

// Authorized Discord usernames for the Monitor screen (checked client-side via SDK user data)
export const MONITOR_AUTHORIZED_USERNAMES = ["barronh", "mclovin111.", "joshua667746", "grimescene"];
// ESO-COMMUNITY.NET Producer (1106560581835706428) or Caster (940967920459198495) roles also grant access
export const MONITOR_AUTHORIZED_ROLE_IDS = ["1106560581835706428", "940967920459198495"];

// Authorized Discord usernames for the Ranked screen
export const RANKED_AUTHORIZED_USERNAMES = ["joshua667746", "doppelsolna", "jaeger_007.", "andreaslubitz.", "grimescene", "barronh", "mclovin111.", "chieftishomingo", "_m0s_", "deityofdeath", "the7apples", "theonlybaus", "igorgrego", "furyau"];
