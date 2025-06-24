// Main application entry point

import { WinMixApp } from "./app/WinMixApp"

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the main application
  const app = new WinMixApp()
  app.initialize()
})

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason)
})

// Handle global errors
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error)
})
