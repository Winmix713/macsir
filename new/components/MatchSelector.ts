// Match selection component with filtering and validation

import type { Team, MatchSelection, ValidationError } from "@/types"
import { PREMIER_LEAGUE_TEAMS, APP_CONFIG } from "@/utils/constants"

export interface MatchSelectorConfig {
  maxMatches?: number
  onSelectionChange?: (selections: MatchSelection[]) => void
  onValidationError?: (errors: ValidationError[]) => void
  teams?: Team[]
}

export class MatchSelector {
  private container: HTMLElement
  private matchSlots: MatchSelection[] = []
  private config: MatchSelectorConfig
  private teams: Team[] = []

  constructor(container: HTMLElement, config: MatchSelectorConfig = {}) {
    this.container = container
    this.config = {
      maxMatches: APP_CONFIG.maxMatches,
      ...config,
    }

    this.teams = config.teams || this.getDefaultTeams()
    this.initializeMatchSlots()
    this.render()
    this.setupEventListeners()
  }

  private getDefaultTeams(): Team[] {
    return PREMIER_LEAGUE_TEAMS.map((team) => ({
      id: team.id,
      name: team.name,
      displayName: team.displayName,
      league: "Premier League",
      country: "England",
    }))
  }

  private initializeMatchSlots(): void {
    this.matchSlots = Array.from({ length: this.config.maxMatches! }, (_, index) => ({
      id: `match_${index}`,
      homeTeam: "",
      awayTeam: "",
      selected: false,
      disabled: false,
    }))
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="match-selector">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-white mb-2">Mérkőzés kiválasztás</h2>
          <p class="text-gray-400">
            Válasszon ki maximum ${this.config.maxMatches} mérkőzést a predikciókhoz.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          ${this.matchSlots.map((slot, index) => this.renderMatchSlot(slot, index)).join("")}
        </div>

        <div class="mt-6 p-4 bg-gray-800 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-gray-300">Kiválasztott mérkőzések:</span>
              <span class="ml-2 text-yellow-400 font-bold" id="selectedCount">0</span>
              <span class="text-gray-400">/${this.config.maxMatches}</span>
            </div>
            <button
              id="clearAllBtn"
              class="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              <i class="ri-close-circle-line mr-2"></i>
              Összes törlése
            </button>
          </div>
          
          <div id="validationErrors" class="mt-3 hidden">
            <div class="text-red-400 text-sm">
              <i class="ri-error-warning-line mr-2"></i>
              <span id="errorMessage"></span>
            </div>
          </div>
        </div>
      </div>
    `

    this.updateSelectionSummary()
  }

  private renderMatchSlot(slot: MatchSelection, index: number): string {
    return `
      <div class="match-slot bg-gray-800 rounded-lg p-4 border-2 border-gray-600 transition-all duration-300 ${slot.selected ? "border-yellow-400 bg-opacity-80" : ""}" data-slot-id="${slot.id}">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-400">Mérkőzés ${index + 1}</span>
          <div class="flex items-center space-x-2">
            <button
              class="clear-slot-btn text-gray-400 hover:text-red-400 transition-colors opacity-0 ${slot.selected ? "opacity-100" : ""}"
              data-slot-id="${slot.id}"
              aria-label="Mérkőzés törlése"
            >
              <i class="ri-close-line"></i>
            </button>
            <div class="w-4 h-4 rounded-full border-2 border-gray-600 transition-all ${slot.selected ? "bg-yellow-400 border-yellow-400" : ""}"></div>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Hazai csapat</label>
            <select
              class="home-team-select w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
              data-slot-id="${slot.id}"
              ${slot.disabled ? "disabled" : ""}
            >
              <option value="">Válasszon csapatot...</option>
              ${this.teams
                .map(
                  (team) => `
                <option value="${team.name}" ${slot.homeTeam === team.name ? "selected" : ""}>
                  ${team.displayName}
                </option>
              `,
                )
                .join("")}
            </select>
          </div>

          <div class="flex items-center justify-center">
            <div class="text-gray-500 font-bold text-lg">VS</div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Vendég csapat</label>
            <select
              class="away-team-select w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
              data-slot-id="${slot.id}"
              ${slot.disabled ? "disabled" : ""}
            >
              <option value="">Válasszon csapatot...</option>
              ${this.teams
                .map(
                  (team) => `
                <option value="${team.name}" ${slot.awayTeam === team.name ? "selected" : ""}>
                  ${team.displayName}
                </option>
              `,
                )
                .join("")}
            </select>
          </div>
        </div>

        <div class="mt-3 text-xs text-center text-gray-500 match-preview ${slot.selected ? "text-yellow-400" : "opacity-0"}">
          ${slot.homeTeam && slot.awayTeam ? `${slot.homeTeam} - ${slot.awayTeam}` : ""}
        </div>
      </div>
    `
  }

  private setupEventListeners(): void {
    // Team selection listeners
    this.container.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLSelectElement
      if (target.matches(".home-team-select, .away-team-select")) {
        this.handleTeamSelection(target)
      }
    })

    // Clear slot listeners
    this.container.addEventListener("click", (e: Event) => {
      const target = e.target as HTMLElement

      if (target.matches(".clear-slot-btn") || target.closest(".clear-slot-btn")) {
        const button = target.closest(".clear-slot-btn") as HTMLElement
        const slotId = button.dataset.slotId!
        this.clearSlot(slotId)
      }
    })

    // Clear all button
    const clearAllBtn = this.container.querySelector("#clearAllBtn")
    clearAllBtn?.addEventListener("click", () => this.clearAllSlots())
  }

  private handleTeamSelection(select: HTMLSelectElement): void {
    const slotId = select.dataset.slotId!
    const isHomeTeam = select.classList.contains("home-team-select")
    const slot = this.matchSlots.find((s) => s.id === slotId)

    if (!slot) return

    if (isHomeTeam) {
      slot.homeTeam = select.value
    } else {
      slot.awayTeam = select.value
    }

    // Update slot state
    const wasSelected = slot.selected
    slot.selected = Boolean(slot.homeTeam && slot.awayTeam && slot.homeTeam !== slot.awayTeam)

    // Update UI
    this.updateSlotUI(slot)
    this.updateTeamAvailability()
    this.validateSelections()
    this.updateSelectionSummary()

    // Trigger callback if selection changed
    if (wasSelected !== slot.selected) {
      this.config.onSelectionChange?.(this.getSelectedMatches())
    }
  }

  private updateSlotUI(slot: MatchSelection): void {
    const slotElement = this.container.querySelector(`[data-slot-id="${slot.id}"]`) as HTMLElement
    if (!slotElement) return

    const indicator = slotElement.querySelector(".w-4.h-4") as HTMLElement
    const clearBtn = slotElement.querySelector(".clear-slot-btn") as HTMLElement
    const preview = slotElement.querySelector(".match-preview") as HTMLElement

    if (slot.selected) {
      slotElement.classList.add("border-yellow-400", "bg-opacity-80")
      slotElement.classList.remove("border-gray-600")
      indicator.classList.add("bg-yellow-400", "border-yellow-400")
      indicator.classList.remove("border-gray-600")
      clearBtn.classList.add("opacity-100")
      clearBtn.classList.remove("opacity-0")
      preview.classList.remove("opacity-0")
      preview.classList.add("text-yellow-400")

      // Update preview text
      preview.textContent = `${slot.homeTeam} - ${slot.awayTeam}`
    } else {
      slotElement.classList.remove("border-yellow-400", "bg-opacity-80")
      slotElement.classList.add("border-gray-600")
      indicator.classList.remove("bg-yellow-400", "border-yellow-400")
      indicator.classList.add("border-gray-600")
      clearBtn.classList.remove("opacity-100")
      clearBtn.classList.add("opacity-0")
      preview.classList.add("opacity-0")
      preview.classList.remove("text-yellow-400")
    }
  }

  private updateTeamAvailability(): void {
    const selectedTeams = new Set<string>()
    this.matchSlots.forEach((slot) => {
      if (slot.selected) {
        selectedTeams.add(slot.homeTeam)
        selectedTeams.add(slot.awayTeam)
      }
    })

    // Update all selects
    this.matchSlots.forEach((slot) => {
      const slotElement = this.container.querySelector(`[data-slot-id="${slot.id}"]`)
      if (!slotElement) return

      const homeSelect = slotElement.querySelector(".home-team-select") as HTMLSelectElement
      const awaySelect = slotElement.querySelector(".away-team-select") as HTMLSelectElement
      ;[homeSelect, awaySelect].forEach((select) => {
        const options = select.querySelectorAll("option")
        options.forEach((option) => {
          const value = (option as HTMLOptionElement).value
          if (value && selectedTeams.has(value) && value !== slot.homeTeam && value !== slot.awayTeam) {
            option.disabled = true
            option.classList.add("text-gray-500")
          } else {
            option.disabled = false
            option.classList.remove("text-gray-500")
          }
        })
      })
    })
  }

  private clearSlot(slotId: string): void {
    const slot = this.matchSlots.find((s) => s.id === slotId)
    if (!slot) return

    slot.homeTeam = ""
    slot.awayTeam = ""
    slot.selected = false

    // Update UI
    const slotElement = this.container.querySelector(`[data-slot-id="${slotId}"]`)
    if (slotElement) {
      const homeSelect = slotElement.querySelector(".home-team-select") as HTMLSelectElement
      const awaySelect = slotElement.querySelector(".away-team-select") as HTMLSelectElement

      homeSelect.value = ""
      awaySelect.value = ""
    }

    this.updateSlotUI(slot)
    this.updateTeamAvailability()
    this.validateSelections()
    this.updateSelectionSummary()
    this.config.onSelectionChange?.(this.getSelectedMatches())
  }

  private clearAllSlots(): void {
    this.matchSlots.forEach((slot) => {
      slot.homeTeam = ""
      slot.awayTeam = ""
      slot.selected = false
    })

    // Update all selects
    const selects = this.container.querySelectorAll("select")
    selects.forEach((select) => {
      ;(select as HTMLSelectElement).value = ""
    })

    // Update UI
    this.matchSlots.forEach((slot) => this.updateSlotUI(slot))
    this.updateTeamAvailability()
    this.validateSelections()
    this.updateSelectionSummary()
    this.config.onSelectionChange?.(this.getSelectedMatches())
  }

  private validateSelections(): void {
    const selectedMatches = this.getSelectedMatches()
    const errors: ValidationError[] = []

    if (selectedMatches.length === 0) {
      errors.push({
        field: "matches",
        message: "Kérjük, válasszon ki legalább egy mérkőzést.",
        code: "no_matches_selected",
      })
    }

    if (selectedMatches.length > this.config.maxMatches!) {
      errors.push({
        field: "matches",
        message: `Legfeljebb ${this.config.maxMatches} mérkőzést választhat ki.`,
        code: "max_matches_exceeded",
      })
    }

    const errorContainer = this.container.querySelector("#validationErrors") as HTMLElement
    const errorMessage = this.container.querySelector("#errorMessage") as HTMLElement

    if (errors.length > 0) {
      errorMessage.textContent = errors[0].message
      errorContainer.classList.remove("hidden")
      this.config.onValidationError?.(errors)
    } else {
      errorContainer.classList.add("hidden")
      this.config.onValidationError?.([])
    }
  }

  private updateSelectionSummary(): void {
    const selectedCount = this.getSelectedMatches().length
    const countElement = this.container.querySelector("#selectedCount") as HTMLElement
    const clearAllBtn = this.container.querySelector("#clearAllBtn") as HTMLButtonElement

    countElement.textContent = selectedCount.toString()
    clearAllBtn.disabled = selectedCount === 0
  }

  // Public methods
  public getSelectedMatches(): MatchSelection[] {
    return this.matchSlots.filter((slot) => slot.selected)
  }

  public isValid(): boolean {
    const selectedMatches = this.getSelectedMatches()
    return selectedMatches.length > 0 && selectedMatches.length <= this.config.maxMatches!
  }

  public clearAll(): void {
    this.clearAllSlots()
  }
}
