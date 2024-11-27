# AI Dialer

> ⚠️ **Proof of Concept**: This is a demonstration project showcasing AI-powered voice technology for automated calling. It is not intended for production use.

A proof-of-concept system that demonstrates autonomous voice agent capabilities for automated outbound calling. Built with VAPI.ai for voice synthesis, this project explores the potential of AI agents in handling automated phone conversations.

## Project Overview

This demonstration system shows how AI can automate outbound calls to schedule appointments. It leverages:
- VAPI.ai for voice synthesis and conversation
- Cal.com for appointment scheduling
- Resend for email communications

### Key Features

- 🤖 AI voice agent with natural conversation capabilities
- 📊 Lead management dashboard
- 📅 Automated appointment scheduling
- 📧 Automated email follow-ups
- 📈 Real-time status tracking
- 📁 Bulk lead import via CSV

## Project Structure

- `src/` - Main application code
- `docs/` - Project documentation
- `supabase/` - Database migrations and types
- `vapi/` - Voice AI integration and call scripts

## Tech Stack

- **Frontend**: 
  - Next.js 15 with App Router
  - TanStack Query (React Query) for data fetching
  - shadcn/ui component library
  - Tailwind CSS with class-variance-authority
- **Database**: Supabase Postgres
- **Authentication**: Supabase Auth
- **Package Manager**: pnpm
- **Automation**: Vercel Cron
- **External Services**:
  - VAPI.ai - Voice calls
  - Cal.com - Appointment scheduling
  - Resend - Email communications

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Supabase account
- VAPI.ai account
- Cal.com account
- Resend account

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Fill in your environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# VAPI Integration
VAPI_API_KEY=your_vapi_key
VAPI_ASSISTANT_ID=your_assistant_id
VAPI_PHONE_NUMBER_ID=your_phone_number_id
VAPI_WEBHOOK_SECRET=your_webhook_secret

# Cal.com Integration
CALCOM_API_KEY=your_calcom_key
CALCOM_WEBHOOK_SECRET=your_webhook_secret

# Resend
RESEND_API_KEY=your_resend_key

# Auth
AUTH_SECRET=your_auth_secret
AUTH_URL=your_auth_url
```

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

### Testing the Cron Job

1. Start the development server:
```bash
pnpm dev
```

2. Add a test lead to your database through Supabase:
```sql
INSERT INTO leads (company_name, phone, email, status)
VALUES ('Test Company', '+1234567890', 'test@example.com', 'pending');
```

3. Trigger the cron job:
```bash
curl -H "Authorization: Bearer your_cron_secret" http://localhost:3000/api/cron
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Documentation

- [Architecture Overview](/docs/architecture.md)
- [API Documentation](/docs/api.md)
- [Environment Setup](./docs/environment-setup.md)
- [Next.js 15 API Patterns](./docs/next-api-patterns.md)

## License

MIT
