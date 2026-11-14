export interface HistoryEntry<T> {
  snapshot: T
  description: string
  timestamp: number
}

export class HistoryLedger<T> {
  private undoStack: HistoryEntry<T>[] = []
  private redoStack: HistoryEntry<T>[] = []
  private maxDepth: number

  constructor(maxDepth = 50) {
    this.maxDepth = maxDepth
  }

  public pushSnapshot(state: T, description: string, options: { historySilent?: boolean } = {}): void {
    if (options.historySilent) return
    const serialized = JSON.stringify(state)
    const last = this.undoStack[this.undoStack.length - 1]
    if (last && JSON.stringify(last.snapshot) === serialized) return
    const clone: T = JSON.parse(serialized)
    this.undoStack.push({
      snapshot: clone,
      description,
      timestamp: Date.now(),
    })

    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift()
    }

    // New action invalidates the redo branch
    this.redoStack = []
  }

  public undo(currentState: T): HistoryEntry<T> | null {
    // Debounced UI snapshots may already contain the current state. Skip those
    // without creating a redundant redo step.
    const currentJson = JSON.stringify(currentState)
    while (this.undoStack.length && JSON.stringify(this.undoStack[this.undoStack.length - 1].snapshot) === currentJson) this.undoStack.pop()
    if (this.undoStack.length === 0) {
      return null
    }

    const previous = this.undoStack.pop()!
    const currentClone: T = JSON.parse(JSON.stringify(currentState))
    this.redoStack.push({
      snapshot: currentClone,
      description: previous.description,
      timestamp: Date.now(),
    })

    return previous
  }

  public redo(currentState: T): HistoryEntry<T> | null {
    if (this.redoStack.length === 0) {
      return null
    }

    const next = this.redoStack.pop()!
    const currentClone: T = JSON.parse(JSON.stringify(currentState))
    this.undoStack.push({
      snapshot: currentClone,
      description: next.description,
      timestamp: Date.now(),
    })

    return next
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0
  }

  public getUndoCount(): number {
    return this.undoStack.length
  }

  public getRedoCount(): number {
    return this.redoStack.length
  }

  public clear(): void {
    this.undoStack = []
    this.redoStack = []
  }
}
