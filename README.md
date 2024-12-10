# 🤖 AI Dialer ☎️ – Autonomous Voice Agent for Appointment Scheduling 🗓️

> ⚠️ **Proof of Concept**: This is a demonstration project showcasing AI-powered voice technology for automated calling. It is not intended for production use.

A proof-of-concept system that demonstrates autonomous voice agent capabilities for automated outbound calling. Built with VAPI.ai for voice synthesis, this project explores the potential of AI agents in handling automated phone conversations.

## Demo

[![Voice AI dialer agent built with #Windsurf and #Vapi](https://img.youtube.com/vi/Lws32HyvQq4/maxresdefault.jpg)](https://www.youtube.com/watch?v=Lws32HyvQq4)

## Credits

Special thanks to Justin Hughes, founder of Firebringer AI, for providing valuable sales training methodology that has been incorporated into the system's conversational AI prompts.

This project was developed as a submission for the Voice AI Accelerator's boot camp programme. Special thanks to Terrell Gentry and Lenny Cowans for specifying the functional requirements through their challenging project brief.

## Project Overview

This demonstration system shows how AI can automate outbound calls to schedule appointments. The system manages leads, schedules calls, and handles appointment booking through an autonomous voice agent. It leverages:

- VAPI.ai for voice synthesis and conversation
- Cal.com for appointment scheduling
- Resend for email communications
- Supabase for database and authentication

### Key Features

- 🤖 AI voice agent with natural conversation capabilities
- 📊 Lead management dashboard with sorting and filtering
- 📅 Automated appointment scheduling
- 📧 Automated email follow-ups
- 📈 Real-time call status tracking
- 📁 Bulk lead import via CSV
- 🎨 Theme support (light/dark mode)

## Project Structure

```
/src
├── app/           # Next.js app router pages
├── components/    # React components
├── hooks/         # React hooks
├── lib/
│   ├── services/  # Core business logic
│   ├── supabase/  # Database clients and types
│   ├── cal.ts     # Cal.com integration
│   ├── types.ts   # Shared types
│   └── utils.ts   # Shared utilities
└── middleware.ts  # Auth middleware

/docs             # Project documentation
/supabase         # Database migrations and types
/vapi             # Voice assistant configuration
├── prompts/      # Assistant prompt templates
├── tools/        # Custom assistant tools
├── publish-vapi-config.js  # Assistant deployment script
└── prompt-manager.js       # Prompt management utilities
```

## Tech Stack

- **Frontend**: 
  - Next.js 15.0.3 with App Router
  - shadcn/ui component library
  - Tailwind CSS with class-variance-authority

- **Backend**:
  - Next.js API Routes
  - Supabase Postgres with Row Level Security
  - Supabase Auth with Next.js middleware
  - Vercel Cron for automation

- **External Services**:
  - VAPI.ai - Voice synthesis and call handling
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

2. Configure the following environment variables:

```env
# Cal.com Configuration
CALCOM_API_KEY=cal_xxxx_xxxxxxxxxxxxxxxx             # Your Cal.com API key
CALCOM_EVENT_TYPE_ID=123456                          # The numeric ID of your event type
CALCOM_EVENT_DURATION=30                             # Duration of the event in minutes
CALCOM_USERNAME=your-username                        # Your Cal.com username
CALCOM_EVENT_SLUG=meeting                            # The slug of your event type

# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key          # For client-side auth
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key      # For server-side operations

# VAPI Configuration
VAPI_API_KEY=vapi_xxxx_xxxxxxxxxxxxxxxx
VAPI_ASSISTANT_ID=asst_xxxx_xxxxxxxxxxxxxxxx
VAPI_PHONE_NUMBER_ID=phn_xxxx_xxxxxxxxxxxxxxxx

# VAPI Integration Webhook
VAPI_SECRET_KEY=your_generated_webhook_secret_here   # For authenticating webhooks
AI_DIALER_URL=https://your-domain.com                # Your app's base URL

# Cron Configuration
CRON_SECRET=your-secret-here                         # For authenticating cron jobs

# Email Configuration (Resend)
RESEND_API_KEY=re_xxxx_xxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=team@example.com                   # Sender email address
RESEND_FROM_NAME=AI Dialer Team                      # Sender name
```

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

### Database Setup

1. Create a new Supabase project and get your project URL and API keys.

2. Initialize the database schema by running the SQL script in `supabase/init.sql`. This will:
   - Create all required tables (leads, call_logs, settings)
   - Set up indexes and relationships
   - Configure row-level security policies
   - Enable realtime subscriptions for the leads table

3. Verify the setup by:
   - Checking that all tables are created in the Supabase dashboard
   - Confirming the realtime functionality is working by checking the Network tab in your browser's developer tools for WebSocket connections

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

- [Architecture Overview](docs/architecture.md) - Detailed system design and components
- [API Documentation](docs/api.md) - API endpoints and usage
- [Development Roadmap](docs/ROADMAP.md) - Upcoming features and priorities

## License

MIT
