import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Convert a canvas or video element to base64
 * @param {HTMLCanvasElement|HTMLVideoElement} element
 * @param {string} type - 'image/jpeg' or 'image/png'
 * @param {number} quality - 0 to 1 for JPEG
 * @returns {string} base64 encoded image
 */
export function elementToBase64(element, type = 'image/jpeg', quality = 0.8) {
  const canvas = element instanceof HTMLCanvasElement
    ? element
    : document.createElement('canvas')

  if (element instanceof HTMLVideoElement) {
    canvas.width = element.videoWidth
    canvas.height = element.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(element, 0, 0)
  }

  return canvas.toDataURL(type, quality)
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
