// Core API service with error handling and retry logic

import type {
  ApiResponse,
  PredictionResult,
  Match,
  Team,
  UserSession,
  HeadToHeadStats,
  MatchSelection,
  PredictionAlgorithm,
} from "@/types"
import { API_ENDPOINTS } from "@/utils/constants"

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public data?: any,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

class ApiService {
  private baseUrl: string
  private authToken: string | null = null

  constructor(baseUrl: string = API_ENDPOINTS.base) {
    this.baseUrl = baseUrl
    this.loadAuthToken()
  }

  private loadAuthToken(): void {
    if (typeof window !== "undefined") {
      this.authToken = localStorage.getItem("winmix_auth_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status)
      }

      const data = await response.json()
      return data as ApiResponse<T>
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(error instanceof Error ? error.message : "Network error")
    }
  }

  // Authentication methods
  async login(username: string, password: string): Promise<UserSession> {
    const response = await this.request<{ user: UserSession; token: string }>(API_ENDPOINTS.auth.login, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })

    if (response.success && response.data) {
      this.authToken = response.data.token
      localStorage.setItem("winmix_auth_token", response.data.token)
      return response.data.user
    }

    throw new ApiError(response.error || "Login failed")
  }

  async logout(): Promise<void> {
    try {
      await this.request(API_ENDPOINTS.auth.logout, { method: "POST" })
    } finally {
      this.authToken = null
      localStorage.removeItem("winmix_auth_token")
    }
  }

  // Prediction methods
  async getPredictions(
    matches: MatchSelection[],
    algorithm: PredictionAlgorithm = "default",
    settings: Record<string, any> = {},
  ): Promise<PredictionResult[]> {
    const response = await this.request<PredictionResult[]>(API_ENDPOINTS.predictions, {
      method: "POST",
      body: JSON.stringify({
        matches: matches.filter((m) => m.selected),
        algorithm,
        settings,
      }),
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new ApiError(response.error || "Failed to get predictions")
  }

  // Match methods
  async getMatches(params?: {
    team?: string
    league?: string
    season?: string
    limit?: number
    offset?: number
  }): Promise<Match[]> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `${API_ENDPOINTS.matches}?${searchParams.toString()}`
    const response = await this.request<Match[]>(endpoint)

    if (response.success && response.data) {
      return response.data
    }

    throw new ApiError(response.error || "Failed to get matches")
  }

  async getHeadToHeadStats(homeTeam: string, awayTeam: string): Promise<HeadToHeadStats> {
    const response = await this.request<HeadToHeadStats>(
      `${API_ENDPOINTS.matches}/h2h?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}`,
    )

    if (response.success && response.data) {
      return response.data
    }

    throw new ApiError(response.error || "Failed to get head-to-head stats")
  }

  // Team methods
  async getTeams(league?: string): Promise<Team[]> {
    const endpoint = league ? `${API_ENDPOINTS.teams}?league=${encodeURIComponent(league)}` : API_ENDPOINTS.teams

    const response = await this.request<Team[]>(endpoint)

    if (response.success && response.data) {
      return response.data
    }

    throw new ApiError(response.error || "Failed to get teams")
  }
}

export const apiService = new ApiService()
export default apiService
