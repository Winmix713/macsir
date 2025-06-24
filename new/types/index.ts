// Core data types for the WinMix prediction system

export interface Team {
  id: string
  name: string
  displayName: string
  league: string
  country: string
}

export interface MatchScore {
  home: number
  away: number
}

export interface Match {
  id: string
  date: string
  homeTeam: string
  awayTeam: string
  score: MatchScore
  league: string
  season: string
  matchday?: number
}

export interface MatchSelection {
  id: string
  homeTeam: string
  awayTeam: string
  selected: boolean
  disabled: boolean
}

export interface PredictionResult {
  matchId: string
  homeTeam: string
  awayTeam: string
  predictions: {
    homeWin: number
    draw: number
    awayWin: number
    bothTeamsScore: number
    totalGoals: number
  }
  confidence: number
  algorithm: string
}

export interface HeadToHeadStats {
  totalMatches: number
  homeWins: number
  draws: number
  awayWins: number
  averageGoals: {
    home: number
    away: number
    total: number
  }
  bothTeamsScored: number
}

export type PredictionAlgorithm =
  | "default"
  | "attack-defense"
  | "seasonal-trends"
  | "machine-learning"
  | "random-forest"
  | "poisson"
  | "elo-rating"

export interface UserSession {
  id: string
  username: string
  isAuthenticated: boolean
  preferences: UserPreferences
  favoritesPredictions: string[]
  recentPredictions: PredictionResult[]
}

export interface UserPreferences {
  defaultAlgorithm: PredictionAlgorithm
  language: "hu" | "en"
  theme: "dark" | "light"
  notifications: {
    email: boolean
    push: boolean
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}
