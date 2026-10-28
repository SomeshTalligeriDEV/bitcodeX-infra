declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SERVER_PORT: string;
      NEXT_PUBLIC_BITCODEX_SDK_ENDPOINT: string;
      NEXT_PUBLIC_BITCODEX_DOCS_ENDPOINT: string;
    }
  }
}

// Ensures this file is treated as a module (necessary if esm)
export {};
