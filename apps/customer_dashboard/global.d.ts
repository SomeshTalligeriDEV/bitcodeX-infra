declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SERVER_PORT: string;
      NEXT_PUBLIC_BITCODEX_API_ENDPOINT: string;
      NEXT_PUBLIC_BITCODEX_DOCS_ENDPOINT: string;
      NEXT_PUBLIC_BITCODEX_DEMO_ENDPOINT: string;
      NEXT_PUBLIC_BITCODEX_FEATURE_REQUEST_ENDPOINT: string;
      NEXT_PUBLIC_BITCODEX_GET_SUPPORT_ENDPOINT: string;
    }
  }
}

// Ensures this file is treated as a module (necessary if esm)
export {};
