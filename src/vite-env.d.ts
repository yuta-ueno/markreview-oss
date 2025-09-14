/// <reference types="vite/client" />

declare global {
  interface Window {
    __TAURI__?: Record<string, unknown>
  }
}

interface ImportMetaEnv {
  readonly MARKREVIEW_PRO: boolean | string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
