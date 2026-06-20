/// <reference types="vite/client" />

// Ensure import.meta.env is recognized even across workspace boundaries
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
