declare global {
  namespace NodeJS {
    export interface ProcessEnv {
      SERVER_PORT: string;
      VITE_BITCODEX_API_ENDPOINT: string;
      VITE_DEMO_WEB_ORIGIN: string;
    }
  }
}

// Ensures this file is treated as a module (necessary if esm)
export {};
