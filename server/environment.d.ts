declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      FRONTEND_ORIGIN: string;
      CLIENT_ID: string;
      CLIENT_SECRET: string;
      REDIRECT_URL: string;
      DATABASE_URL: string;
      ACCESS_TOKEN_PRIVATE: string;
      REFRESH_TOKEN_PRIVATE: string;
      ACCESS_TOKEN_PUBLIC: string;
      REFRESH_TOKEN_PUBLIC: string;
      ACCESS_TOKEN_TTL: string;
      REFRESH_TOKEN_TTL: string;
    }
  }
}

export {};
