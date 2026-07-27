/**
 * Build version — injected at build time via Vite define.
 * Falls back to a dev marker when not set (e.g. in `vite dev`).
 */
export const BUILD_VERSION: string =
  (import.meta.env.VITE_BUILD_VERSION as string | undefined) ?? 'dev';
export const BUILD_DATE: string =
  (import.meta.env.VITE_BUILD_DATE as string | undefined) ?? '';
