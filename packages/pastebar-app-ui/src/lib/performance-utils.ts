/**
 * Performance utility functions for optimizing virtual lists and caching
 */

/**
 * LRU (Least Recently Used) Cache implementation
 * Automatically evicts least recently used items when reaching max size
 */
export class LRUCache<K, V> {
  private maxSize: number
  private cache: Map<K, V>

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize
    this.cache = new Map()
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: K, value: V): void {
    // Remove if exists to re-add at the end
    this.cache.delete(key)

    // Check if we need to evict
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey!)
    }

    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

/**
 * Calculate dynamic overscan count based on scroll velocity
 * Higher velocity = more items pre-rendered for smoother scrolling
 */
export function calculateDynamicOverscan(scrollVelocity: number): number {
  const BASE_OVERSCAN = 5
  const MAX_OVERSCAN = 20
  const VELOCITY_THRESHOLD = 50 // pixels per frame

  // Calculate velocity factor (0 to 1)
  const velocityFactor = Math.min(Math.abs(scrollVelocity) / VELOCITY_THRESHOLD, 1)

  // Calculate overscan with exponential growth for high velocities
  const dynamicOverscan =
    BASE_OVERSCAN + Math.floor(velocityFactor * (MAX_OVERSCAN - BASE_OVERSCAN))

  return dynamicOverscan
}

/**
 * Debounced scroll velocity tracker
 * Tracks scroll velocity over time for dynamic overscan calculation
 */
export class ScrollVelocityTracker {
  private lastPosition: number = 0
  private lastTime: number = Date.now()
  private velocity: number = 0
  private updateTimer: number | null = null

  update(currentPosition: number): number {
    const now = Date.now()
    const timeDelta = now - this.lastTime

    if (timeDelta > 0) {
      const positionDelta = currentPosition - this.lastPosition
      this.velocity = (positionDelta / timeDelta) * 16.67 // Convert to pixels per frame (60fps)
    }

    this.lastPosition = currentPosition
    this.lastTime = now

    // Reset velocity after scrolling stops
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
    }
    this.updateTimer = window.setTimeout(() => {
      this.velocity = 0
    }, 150)

    return this.velocity
  }

  getVelocity(): number {
    return this.velocity
  }

  reset(): void {
    this.velocity = 0
    this.lastPosition = 0
    this.lastTime = Date.now()
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
      this.updateTimer = null
    }
  }
}

/**
 * Efficient row height cache using Map instead of object spread
 */
export class RowHeightCache {
  private heights: Map<number, number>
  private defaultHeight: number

  constructor(defaultHeight: number = 60) {
    this.heights = new Map()
    this.defaultHeight = defaultHeight
  }

  get(index: number): number {
    return this.heights.get(index) ?? this.defaultHeight
  }

  set(index: number, height: number): void {
    // Only update if height actually changed
    if (this.heights.get(index) !== height) {
      this.heights.set(index, height)
    }
  }

  clear(): void {
    this.heights.clear()
  }

  clearAfterIndex(index: number): void {
    const keysToDelete: number[] = []
    for (const key of this.heights.keys()) {
      if (key >= index) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.heights.delete(key))
  }

  get size(): number {
    return this.heights.size
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()

  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark)
    if (!start) {
      console.warn(`Performance mark "${startMark}" not found`)
      return 0
    }

    const duration = performance.now() - start
    // if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
    // }

    return duration
  }

  clear(): void {
    this.marks.clear()
  }
}

/**
 * Batch processor for expensive operations
 */
export class BatchProcessor<T> {
  private queue: T[] = []
  private processing = false
  private batchSize: number
  private processFunction: (items: T[]) => void | Promise<void>
  private delay: number

  constructor(
    processFunction: (items: T[]) => void | Promise<void>,
    batchSize: number = 50,
    delay: number = 16 // ~1 frame at 60fps
  ) {
    this.processFunction = processFunction
    this.batchSize = batchSize
    this.delay = delay
  }

  add(item: T): void {
    this.queue.push(item)
    this.processNextBatch()
  }

  addMultiple(items: T[]): void {
    this.queue.push(...items)
    this.processNextBatch()
  }

  private async processNextBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    // Process in chunks to avoid blocking the main thread
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize)
      await this.processFunction(batch)

      // Yield to browser for smooth scrolling
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }

    this.processing = false
  }

  clear(): void {
    this.queue = []
  }

  get pending(): number {
    return this.queue.length
  }
}
