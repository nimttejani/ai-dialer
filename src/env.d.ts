declare namespace NodeJS {
  interface ProcessEnv {
    // Cal.com Configuration
    CALCOM_API_KEY: string;
    CALCOM_USER_ID: string;
    CALCOM_EVENT_TYPE_ID: string;
    CALCOM_EVENT_DURATION: string;
    CALCOM_WEBHOOK_SECRET: string;

    // Database Configuration
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

    // VAPI Configuration
    VAPI_API_KEY: string;
    VAPI_AGENT_ID: string;

    // Email Configuration (Resend)
    RESEND_API_KEY: string;

    // Node Environment
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
