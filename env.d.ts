declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_APP_URL: string;

    DATABASE_URL: string;

    GITHUB_ID: string;
    GITHUB_SECRET: string;
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;

    N8N_JOB_WEBHOOK_URL?: string;

    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    EMAIL_FROM?: string;
  }
}
