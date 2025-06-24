// Main WinMix application class

import type { MatchSelection, PredictionResult, PredictionAlgorithm, UserSession } from "@/types"
import { MatchSelector } from "@/components/MatchSelector"
import { ChartRenderer } from "@/components/ChartRenderer"
import { apiService } from "@/services/api"
import { APP_CONFIG, PREDICTION_ALGORITHMS, DEFAULT_PREDICTION_SETTINGS } from "@/utils/constants"

export class WinMixApp {
  private matchSelector: MatchSelector | null = null
  private chartRenderer: ChartRenderer
  private predictions: PredictionResult[] = []
  private currentUser: UserSession | null = null

  // DOM elements
  private elements: {
    matchContainer?: HTMLElement
    algorithmSelect?: HTMLSelectElement
    predictionBtn?: HTMLButtonElement
    resultsContainer?: HTMLElement
    chartsContainer?: HTMLElement
    loadingOverlay?: HTMLElement
    errorContainer?: HTMLElement
  } = {}

  constructor() {
    this.chartRenderer = new ChartRenderer("dark")

    // Bind methods
    this.handleMatchSelection = this.handleMatchSelection.bind(this)
    this.handlePredictionRun = this.handlePredictionRun.bind(this)
  }

  public async initialize(): Promise<void> {
    try {
      this.setupDOMReferences()
      this.setupEventListeners()
      this.initializeComponents()

      console.log("WinMix App initialized successfully")
    } catch (error) {
      console.error("Failed to initialize WinMix App:", error)
      this.showError("Alkalmazás inicializálási hiba történt.")
    }
  }

  private setupDOMReferences(): void {
    this.elements = {
      matchContainer: document.getElementById("matchContainer") || undefined,
      algorithmSelect: (document.getElementById("algorithmSelect") as HTMLSelectElement) || undefined,
      predictionBtn: (document.getElementById("predictionBtn") as HTMLButtonElement) || undefined,
      resultsContainer: document.getElementById("resultsContainer") || undefined,
      chartsContainer: document.getElementById("chartsContainer") || undefined,
      loadingOverlay: document.getElementById("loadingOverlay") || undefined,
      errorContainer: document.getElementById("errorContainer") || undefined,
    }
  }

  private setupEventListeners(): void {
    // Prediction controls
    this.elements.predictionBtn?.addEventListener("click", this.handlePredictionRun)
    this.elements.algorithmSelect?.addEventListener("change", this.handleAlgorithmChange.bind(this))

    // Keyboard shortcuts
    document.addEventListener("keydown", this.handleKeyboardShortcuts.bind(this))
  }

  private initializeComponents(): void {
    // Initialize match selector
    if (this.elements.matchContainer) {
      this.matchSelector = new MatchSelector(this.elements.matchContainer, {
        maxMatches: APP_CONFIG.maxMatches,
        onSelectionChange: this.handleMatchSelection,
        onValidationError: this.handleValidationErrors.bind(this),
      })
    }

    // Initialize algorithm selector
    this.renderAlgorithmSelector()
  }

  // Event handlers
  private handleMatchSelection(selections: MatchSelection[]): void {
    this.updatePredictionButton()
  }

  private handleValidationErrors(errors: any[]): void {
    if (errors.length > 0) {
      this.showError(errors[0].message)
    } else {
      this.hideError()
    }
  }

  private async handlePredictionRun(): Promise<void> {
    if (!this.matchSelector?.isValid()) {
      this.showError("Kérjük, válasszon ki legalább egy mérkőzést!")
      return
    }

    const selectedMatches = this.matchSelector.getSelectedMatches()
    const algorithm = this.getSelectedAlgorithm()
    const settings = DEFAULT_PREDICTION_SETTINGS

    try {
      this.setLoading(true)

      const predictions = await apiService.getPredictions(selectedMatches, algorithm, settings)

      this.predictions = predictions
      this.renderResults()
      this.renderCharts()
      this.scrollToResults()
    } catch (error) {
      console.error("Prediction failed:", error)
      this.showError(error instanceof Error ? error.message : "Predikciós hiba történt.")
    } finally {
      this.setLoading(false)
    }
  }

  private handleAlgorithmChange(): void {
    const algorithm = this.getSelectedAlgorithm()
    this.updateAlgorithmDescription(algorithm)
  }

  private handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Ctrl/Cmd + Enter: Run predictions
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault()
      this.handlePredictionRun()
    }
  }

  // UI Update methods
  private renderAlgorithmSelector(): void {
    if (!this.elements.algorithmSelect) return

    const currentValue = this.elements.algorithmSelect.value
    this.elements.algorithmSelect.innerHTML = ""

    Object.entries(PREDICTION_ALGORITHMS).forEach(([key, label]) => {
      const option = document.createElement("option")
      option.value = key
      option.textContent = label
      option.selected = key === currentValue
      this.elements.algorithmSelect!.appendChild(option)
    })
  }

  private renderResults(): void {
    if (!this.elements.resultsContainer || this.predictions.length === 0) return

    const html = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-white">Predikciós eredmények</h2>
        
        <div class="grid gap-4">
          ${this.predictions.map((prediction) => this.renderPredictionCard(prediction)).join("")}
        </div>
        
        <div class="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 class="text-lg font-semibold text-white mb-4">Összefoglaló</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-400">${this.predictions.length}</div>
              <div class="text-gray-400">Mérkőzés</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-400">
                ${(this.predictions.reduce((sum, p) => sum + p.confidence, 0) / this.predictions.length).toFixed(1)}%
              </div>
              <div class="text-gray-400">Átlagos megbízhatóság</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-400">
                ${(this.predictions.reduce((sum, p) => sum + p.predictions.totalGoals, 0) / this.predictions.length).toFixed(1)}
              </div>
              <div class="text-gray-400">Átlagos gólszám</div>
            </div>
          </div>
        </div>
      </div>
    `

    this.elements.resultsContainer.innerHTML = html
  }

  private renderPredictionCard(prediction: PredictionResult): string {
    return `
      <div class="prediction-card bg-gray-800 rounded-lg p-6 border border-gray-600">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">
            ${prediction.homeTeam} vs ${prediction.awayTeam}
          </h3>
          <button class="favorite-btn text-gray-400 hover:text-yellow-400">
            <i class="ri-star-line"></i>
          </button>
        </div>
        
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-green-500">${prediction.predictions.homeWin.toFixed(1)}%</div>
            <div class="text-sm text-gray-400">Hazai</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-yellow-500">${prediction.predictions.draw.toFixed(1)}%</div>
            <div class="text-sm text-gray-400">Döntetlen</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-500">${prediction.predictions.awayWin.toFixed(1)}%</div>
            <div class="text-sm text-gray-400">Vendég</div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-400">BTTS:</span>
            <span class="text-white ml-2">${prediction.predictions.bothTeamsScore.toFixed(1)}%</span>
          </div>
          <div>
            <span class="text-gray-400">Gólok:</span>
            <span class="text-white ml-2">${prediction.predictions.totalGoals.toFixed(1)}</span>
          </div>
          <div>
            <span class="text-gray-400">Megbízhatóság:</span>
            <span class="text-white ml-2">${prediction.confidence.toFixed(1)}%</span>
          </div>
          <div>
            <span class="text-gray-400">Algoritmus:</span>
            <span class="text-white ml-2">${PREDICTION_ALGORITHMS[prediction.algorithm as keyof typeof PREDICTION_ALGORITHMS]}</span>
          </div>
        </div>
      </div>
    `
  }

  private renderCharts(): void {
    if (!this.elements.chartsContainer || this.predictions.length === 0) return

    this.elements.chartsContainer.innerHTML = `
      <div class="space-y-8">
        <h2 class="text-2xl font-bold text-white">Vizualizációk</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-gray-800 rounded-lg p-6">
            <canvas id="overviewChart" width="400" height="300"></canvas>
          </div>
          <div class="bg-gray-800 rounded-lg p-6">
            <canvas id="confidenceChart" width="400" height="300"></canvas>
          </div>
          <div class="bg-gray-800 rounded-lg p-6">
            <canvas id="goalsChart" width="400" height="300"></canvas>
          </div>
        </div>
      </div>
    `

    // Render charts
    setTimeout(() => {
      const overviewCanvas = document.getElementById("overviewChart") as HTMLCanvasElement
      const confidenceCanvas = document.getElementById("confidenceChart") as HTMLCanvasElement
      const goalsCanvas = document.getElementById("goalsChart") as HTMLCanvasElement

      if (overviewCanvas) this.chartRenderer.renderPredictionOverview(overviewCanvas, this.predictions)
      if (confidenceCanvas) this.chartRenderer.renderConfidenceDistribution(confidenceCanvas, this.predictions)
      if (goalsCanvas) this.chartRenderer.renderGoalsPrediction(goalsCanvas, this.predictions)
    }, 100)
  }

  // Helper methods
  private setLoading(loading: boolean): void {
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.style.display = loading ? "flex" : "none"
    }

    if (this.elements.predictionBtn) {
      this.elements.predictionBtn.disabled = loading
      this.elements.predictionBtn.textContent = loading ? "Predikciók futtatása..." : "Predikciók futtatása"
    }
  }

  private showError(message: string): void {
    if (this.elements.errorContainer) {
      this.elements.errorContainer.innerHTML = `
        <div class="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 flex items-center">
          <i class="ri-error-warning-line text-red-500 mr-3"></i>
          <span class="text-red-200">${message}</span>
          <button class="ml-auto text-red-200 hover:text-white" onclick="this.parentElement.style.display='none'">
            <i class="ri-close-line"></i>
          </button>
        </div>
      `
      this.elements.errorContainer.style.display = "block"
    }
  }

  private hideError(): void {
    if (this.elements.errorContainer) {
      this.elements.errorContainer.style.display = "none"
    }
  }

  private updatePredictionButton(): void {
    if (!this.elements.predictionBtn || !this.matchSelector) return

    const selectedCount = this.matchSelector.getSelectedMatches().length
    const isValid = this.matchSelector.isValid()

    this.elements.predictionBtn.disabled = !isValid || selectedCount === 0
    this.elements.predictionBtn.textContent = `Predikciók futtatása (${selectedCount})`
  }

  private updateAlgorithmDescription(algorithm: PredictionAlgorithm): void {
    const descriptions = {
      default: "Alapértelmezett algoritmus form és H2H statisztikák alapján",
      "attack-defense": "Támadó és védekező erősségek elemzése",
      "seasonal-trends": "Szezonális trendek és minták figyelembevétele",
      "machine-learning": "Gépi tanulási modellek kombinációja",
      "random-forest": "Random Forest döntési fa algoritmus",
      poisson: "Poisson eloszlás alapú gólpredikció",
      "elo-rating": "ELO értékelési rendszer alapú számítás",
    }

    const descContainer = document.getElementById("algorithmDescription")
    if (descContainer) {
      descContainer.textContent = descriptions[algorithm] || ""
    }
  }

  private getSelectedAlgorithm(): PredictionAlgorithm {
    return (this.elements.algorithmSelect?.value as PredictionAlgorithm) || "default"
  }

  private scrollToResults(): void {
    this.elements.resultsContainer?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  public destroy(): void {
    // Clean up resources
    this.chartRenderer.destroyAll()
    this.matchSelector = null
  }
}
