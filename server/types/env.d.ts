// Ambient declaration of the environment variables this server reads.
// Validated at boot in server.ts; typed as string here for ergonomics.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: "development" | "production" | "test";
      PORT?: string;

      MONGODB_URI: string;
      JWT_SECRET: string;

      ALLOWED_ORIGINS?: string;

      OPENAI_API_KEY?: string;
      PINECONE_API_KEY?: string;

      AWS_REGION?: string;
      AWS_ACCESS_KEY_ID?: string;
      AWS_SECRET_ACCESS_KEY?: string;
      AWS_S3_BUCKET_NAME?: string;
      AWS_CLOUDFRONT_DOMAIN?: string;
    }
  }
}

export {};
