// Application constants and configuration

export const APP_CONFIG = {
  name: "WinMix Prediction System",
  version: "2.0.0",
  maxMatches: 8,
  defaultLanguage: "hu" as const,
  apiTimeout: 30000,
  retryAttempts: 3,
  cacheExpiry: 300000, // 5 minutes
} as const

export const API_ENDPOINTS = {
  base: "/api",
  predictions: "/api/predictions",
  matches: "/api/matches",
  teams: "/api/teams",
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
  },
} as const

export const PREMIER_LEAGUE_TEAMS = [
  { id: "arsenal", name: "Arsenal", displayName: "Arsenal FC" },
  { id: "aston_villa", name: "Aston Villa", displayName: "Aston Villa FC" },
  { id: "brighton", name: "Brighton", displayName: "Brighton & Hove Albion" },
  { id: "chelsea", name: "Chelsea", displayName: "Chelsea FC" },
  { id: "crystal_palace", name: "Crystal Palace", displayName: "Crystal Palace FC" },
  { id: "everton", name: "Everton", displayName: "Everton FC" },
  { id: "fulham", name: "Fulham", displayName: "Fulham FC" },
  { id: "liverpool", name: "Liverpool", displayName: "Liverpool FC" },
  { id: "manchester_city", name: "Manchester City", displayName: "Manchester City FC" },
  { id: "manchester_united", name: "Manchester United", displayName: "Manchester United FC" },
  { id: "newcastle", name: "Newcastle United", displayName: "Newcastle United FC" },
  { id: "tottenham", name: "Tottenham", displayName: "Tottenham Hotspur FC" },
  { id: "west_ham", name: "West Ham", displayName: "West Ham United FC" },
] as const

export const PREDICTION_ALGORITHMS = {
  default: "Alapértelmezett",
  "attack-defense": "Támadás-védelem analízis",
  "seasonal-trends": "Szezonális trendek",
  "machine-learning": "Gépi tanulás",
  "random-forest": "Random Forest",
  poisson: "Poisson eloszlás",
  "elo-rating": "ELO értékelés",
} as const

export const DEFAULT_PREDICTION_SETTINGS = {
  homeAdvantage: 1.3,
  formWeight: 0.4,
  h2hWeight: 0.3,
  seasonalWeight: 0.3,
  recentMatchesCount: 6,
} as const

export const STORAGE_KEYS = {
  userSession: "winmix_user_session",
  favorites: "winmix_favorites",
  recentPredictions: "winmix_recent_predictions",
  settings: "winmix_settings",
  theme: "winmix_theme",
  authToken: "winmix_auth_token",
} as const

export const CHART_COLORS = {
  primary: "#CCFF00",
  secondary: "#141414",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  homeWin: "#10B981",
  draw: "#F59E0B",
  awayWin: "#EF4444",
} as const
