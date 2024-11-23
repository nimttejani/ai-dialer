# HVAC Sales Automation

An automated outbound calling system for HVAC companies using AI-powered voice technology.

## Project Overview

This system automates the process of calling HVAC companies to book product demos. It leverages VAPI.ai for voice calls, Cal.com for appointment scheduling, and Resend for email communications.

### Key Features

- 🤖 Automated outbound calling with AI voice technology
- 📊 Lead management dashboard
- 📅 Automated appointment scheduling
- 📧 Automated email follow-ups
- 📈 Real-time status tracking
- 📁 Bulk lead import via CSV

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Database**: Supabase Postgres
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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
VAPI_API_KEY=your_vapi_key
VAPI_ASSISTANT_ID=your_assistant_id
VAPI_PHONE_NUMBER_ID=your_phone_number_id
CALCOM_API_KEY=your_calcom_key
RESEND_API_KEY=your_resend_key
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
curl http://localhost:3000/api/cron
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Documentation

- [Architecture Overview](/docs/architecture.md)
- [API Documentation](/docs/api.md)
- [Environment Setup](./docs/environment-setup.md)
- [Next.js 15 API Patterns](./docs/next-api-patterns.md)

## Development Workflow

1. Create feature branch from `main`
2. Make changes and test locally
3. Submit PR for review
4. Merge to `main` after approval

## Deployment

The application is automatically deployed to Vercel on merges to `main`.

## Success Metrics

1. Successful automated calls through VAPI
2. Accurate lead lifecycle tracking
3. Successful appointment scheduling
4. Timely follow-up emails
5. System reliability and uptime

## License

MIT
