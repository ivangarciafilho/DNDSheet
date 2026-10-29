# ADR-0002: PWA Offline-First and Multi-Tier Storage Architecture

## Status
Accepted

## Date
2026-10-24

## Context
The original application relied exclusively on browser `localStorage` directly accessed through Pinia persisted state and browser file downloads for `.5emm.json` files. This created several key limitations:
1. **Quota Ceiling**: `localStorage` has a strict quota (~5MB depending on browser), which quickly exhausts when storing dozens of detailed monster statblocks, high-resolution portrait images, or extensive spell/action libraries.
2. **No Offline PWA Shell**: Accessing the tool in disconnected environments (e.g., in-person convention games or table setups without Wi-Fi) failed if the browser cache was cleared or unavailable.
3. **No Centralized Local Monster Library**: Users had to keep separate individual `.5emm.json` files on disk rather than organizing an in-app library with search, filtering, and bulk management.

## Decision
We implement a robust, offline-first multi-tier storage and PWA architecture:

1. **Storage Port Contract (`src/core/ports/StoragePort.ts`)**:
   - `getMonster(id: string): Promise<Monster | null>`
   - `saveMonster(monster: Monster): Promise<void>`
   - `listMonsters(): Promise<MonsterSummary[]>`
   - `deleteMonster(id: string): Promise<void>`
   - `exportAll(): Promise<string>`
   - `importAll(jsonString: string): Promise<number>`
   - `clearAll(): Promise<void>`

2. **Multi-Tier Adapters**:
   - `IndexedDbStorageAdapter.ts`: Primary high-capacity storage using IndexedDB (`DndSheetDB`, store `monsters` with `id`, `name`, and `updatedAt` indexes). Supports hundreds of monsters and large attachments.
   - `LocalStorageAdapter.ts`: Lightweight fallback adapter with pluggable storage backends (including `MemoryStorageBackend` for zero-DOM unit test environments).
   - Both adapters automatically execute `migrateMonsterSchema()` upon retrieval to guarantee continuous schema resilience (v1 through v11).

3. **PWA Service Worker & Workbox (`src-pwa/custom-service-worker.ts`)**:
   - Mode set to `injectManifest` in `quasar.config.js`.
   - Complete application shell precaching (`precacheAndRoute(self.__WB_MANIFEST)`).
   - Stale-While-Revalidate caching for Google Fonts stylesheets.
   - Cache-First caching (1-year expiration) for Google Fonts webfont files.
   - Immediate activation via `skipWaiting()` and `clientsClaim()`.

## Consequences

### Positive
- **100% Offline Independence**: The entire application loads and operates offline indefinitely after initial install.
- **Scalable Local Library**: Monster creators can maintain hundreds of statblocks locally without storage quota warnings.
- **Seamless Portability**: Full bulk export/import allows easy backups and migration across devices.

### Negative / Trade-offs
- Service worker caching requires active cache invalidation routines during production updates (`skipWaiting` and `cleanupOutdatedCaches`).
