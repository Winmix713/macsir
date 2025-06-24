// Chart rendering component using Chart.js

import { Chart, type ChartConfiguration, registerables } from "chart.js"
import type { PredictionResult } from "@/types"
import { CHART_COLORS } from "@/utils/constants"

// Register Chart.js components
Chart.register(...registerables)

export class ChartRenderer {
  private charts = new Map<string, Chart>()
  private theme: "dark" | "light" = "dark"

  constructor(theme: "dark" | "light" = "dark") {
    this.theme = theme
  }

  /**
   * Render prediction results overview chart
   */
  renderPredictionOverview(container: HTMLCanvasElement, predictions: PredictionResult[]): Chart {
    const chartId = this.getChartId(container)
    this.destroyChart(chartId)

    const data = {
      labels: predictions.map((p) => `${p.homeTeam} vs ${p.awayTeam}`),
      datasets: [
        {
          label: "Hazai győzelem",
          data: predictions.map((p) => p.predictions.homeWin),
          backgroundColor: CHART_COLORS.homeWin,
          borderColor: CHART_COLORS.homeWin,
          borderWidth: 1,
        },
        {
          label: "Döntetlen",
          data: predictions.map((p) => p.predictions.draw),
          backgroundColor: CHART_COLORS.draw,
          borderColor: CHART_COLORS.draw,
          borderWidth: 1,
        },
        {
          label: "Vendég győzelem",
          data: predictions.map((p) => p.predictions.awayWin),
          backgroundColor: CHART_COLORS.awayWin,
          borderColor: CHART_COLORS.awayWin,
          borderWidth: 1,
        },
      ],
    }

    const options = {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Prediction Overview",
          color: this.getTextColor(),
          font: {
            size: 16,
            weight: "bold",
          },
        },
        legend: {
          labels: {
            color: this.getTextColor(),
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value: any) => `${value}%`,
            color: this.getTextColor(),
          },
          grid: {
            color: this.getGridColor(),
          },
        },
        x: {
          ticks: {
            color: this.getTextColor(),
          },
          grid: {
            color: this.getGridColor(),
          },
        },
      },
    }

    const config: ChartConfiguration = {
      type: "bar",
      data,
      options,
    }

    const chart = new Chart(container, config)
    this.charts.set(chartId, chart)
    return chart
  }

  /**
   * Render confidence distribution chart
   */
  renderConfidenceDistribution(container: HTMLCanvasElement, predictions: PredictionResult[]): Chart {
    const chartId = this.getChartId(container)
    this.destroyChart(chartId)

    const confidenceRanges = [
      { label: "Alacsony (0-30%)", min: 0, max: 30 },
      { label: "Közepes (30-60%)", min: 30, max: 60 },
      { label: "Magas (60-80%)", min: 60, max: 80 },
      { label: "Nagyon magas (80-100%)", min: 80, max: 100 },
    ]

    const data = confidenceRanges.map(
      (range) => predictions.filter((p) => p.confidence >= range.min && p.confidence < range.max).length,
    )

    const chartData = {
      labels: confidenceRanges.map((r) => r.label),
      datasets: [
        {
          data,
          backgroundColor: [
            "rgba(239, 68, 68, 0.8)", // Red for low
            "rgba(245, 158, 11, 0.8)", // Orange for medium
            "rgba(34, 197, 94, 0.8)", // Green for high
            "rgba(204, 255, 0, 0.8)", // Primary for very high
          ],
          borderColor: ["rgb(239, 68, 68)", "rgb(245, 158, 11)", "rgb(34, 197, 94)", "rgb(204, 255, 0)"],
          borderWidth: 2,
        },
      ],
    }

    const config: ChartConfiguration = {
      type: "doughnut",
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Confidence Distribution",
            color: this.getTextColor(),
          },
          legend: {
            display: true,
            position: "bottom",
            labels: {
              color: this.getTextColor(),
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
        },
      },
    }

    const chart = new Chart(container, config)
    this.charts.set(chartId, chart)
    return chart
  }

  /**
   * Render goals prediction chart
   */
  renderGoalsPrediction(container: HTMLCanvasElement, predictions: PredictionResult[]): Chart {
    const chartId = this.getChartId(container)
    this.destroyChart(chartId)

    const data = {
      labels: predictions.map((p) => `${p.homeTeam} vs ${p.awayTeam}`),
      datasets: [
        {
          label: "Várható gólok száma",
          data: predictions.map((p) => p.predictions.totalGoals),
          borderColor: CHART_COLORS.primary,
          backgroundColor: "rgba(204, 255, 0, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    }

    const config: ChartConfiguration = {
      type: "line",
      data,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Goals Prediction",
            color: this.getTextColor(),
          },
          legend: {
            labels: {
              color: this.getTextColor(),
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: this.getTextColor(),
            },
            grid: {
              color: this.getGridColor(),
            },
          },
          x: {
            ticks: {
              color: this.getTextColor(),
            },
            grid: {
              color: this.getGridColor(),
            },
          },
        },
        elements: {
          point: {
            radius: 6,
            hoverRadius: 8,
          },
          line: {
            tension: 0.4,
          },
        },
      },
    }

    const chart = new Chart(container, config)
    this.charts.set(chartId, chart)
    return chart
  }

  // Helper methods
  private getTextColor(): string {
    return this.theme === "dark" ? "#ffffff" : "#000000"
  }

  private getGridColor(): string {
    return this.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
  }

  private getChartId(container: HTMLCanvasElement): string {
    return container.id || `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private destroyChart(chartId: string): void {
    const existingChart = this.charts.get(chartId)
    if (existingChart) {
      existingChart.destroy()
      this.charts.delete(chartId)
    }
  }

  // Public methods
  public setTheme(theme: "dark" | "light"): void {
    this.theme = theme
    // Redraw all charts with new theme
    this.charts.forEach((chart) => chart.update())
  }

  public destroyAll(): void {
    this.charts.forEach((chart) => chart.destroy())
    this.charts.clear()
  }
}
