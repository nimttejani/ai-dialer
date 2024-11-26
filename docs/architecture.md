# HVAC Sales Automation Architecture

## System Overview
The HVAC Sales Automation system is designed to automate outbound sales calls to HVAC companies using AI-powered voice technology. The system manages leads, schedules calls, and handles appointment booking automatically.

## Technical Architecture

### Frontend Layer
- **Framework**: Next.js 15 with App Router
- **Key Components**:
  - Lead Management Table
  - Automation Control Panel
  - Real-time Status Updates
  - CSV Import Interface

### Database Layer
- **Platform**: Supabase Postgres
- **Client Strategy**:
  - Frontend: Uses `createClientComponentClient()` for authenticated user operations
  - Server (API Routes): Uses `createClient()` with service role key for privileged operations
  - Authentication handled via Next.js Auth Helpers and Supabase Auth
  - Row Level Security (RLS) policies enforce access control

- **Services Layer**:
  - Structure:
    ```
    /src/lib/
    ├── services/
    │   ├── leads.ts       # Lead management operations
    │   └── settings.ts    # System settings and automation config
    ├── cal.ts            # Cal.com API integration
    ├── supabase.ts       # Supabase client configuration
    └── utils/            # Shared utilities
    ```
  - Each service encapsulates:
    - Database operations
    - Business logic
    - Error handling
    - Type definitions

- **Schema**:
  - `leads` table:
    - `id`: UUID (primary key, default: uuid_generate_v4())
    - `company_name`: text (not null)
    - `phone`: text (not null)
    - `email`: text (not null)
    - `status`: lead_status enum ('pending', 'calling', 'no_answer', 'scheduled', 'not_interested')
    - `call_attempts`: integer (default: 0)
    - `last_called_at`: timestamp with time zone
    - `created_at`: timestamp with time zone (default: now())
    - `updated_at`: timestamp with time zone (default: now())
    - Indexes:
      - idx_leads_status on status
      - idx_leads_last_called_at on last_called_at
  
  - `settings` table:
    - `id`: UUID (primary key, default: gen_random_uuid())
    - `automation_enabled`: boolean (default: false)
    - `max_calls_batch`: integer (default: 5)
    - `retry_interval`: integer (default: 4)
    - `max_attempts`: integer (default: 3)
    - `created_at`: timestamp with time zone (default: now())
    - `updated_at`: timestamp with time zone (default: now())

  - `appointments` table:
    - `id`: UUID (primary key, default: gen_random_uuid())
    - `cal_booking_uid`: text (unique, not null)
    - `customer_name`: text
    - `customer_email`: text
    - `customer_phone`: text
    - `start_time`: timestamptz
    - `end_time`: timestamptz
    - `status`: text (not null)
    - `cancellation_reason`: text
    - `created_at`: timestamptz (default: now())
    - `updated_at`: timestamptz (default: now())
    - Indexes:
      - idx_appointments_cal_booking_uid on cal_booking_uid
      - idx_appointments_status on status

### Integration Layer
- **VAPI.ai Integration**
  - Handles outbound voice calls
  - Manages conversation flow
  - Reports call outcomes
  
- **Cal.com Integration**
  - Structure:
    ```
    /src/lib/cal.ts              # Low-level Cal.com API client
    /src/services/cal.ts         # Business logic and error handling
    /api/webhook/vapi/route.ts   # Endpoint for VAPI to call
    /api/webhook/cal/route.ts    # Endpoint for Cal.com webhooks
    ```
  - Webhook Flow:
    1. VAPI Flow:
       - VAPI agent discusses scheduling with caller
       - Agent calls `/api/webhook/vapi` endpoint to:
         - Check available time slots
         - Book appointments when caller confirms
       - Endpoint validates VAPI secret and handles request
       - Response formatted for VAPI to relay to caller

    2. Cal.com Flow:
       - Cal.com sends webhook events to `/api/webhook/cal`
       - Events include: created, rescheduled, cancelled bookings
       - Endpoint validates Cal.com signature
       - Updates appointment status in database
       - Triggers any necessary notifications

  - Security:
    - VAPI endpoint protected by our generated API key (x-vapi-secret header)
    - Cal.com endpoint protected by webhook signature verification
    - All credentials stored in environment variables

- **Resend Integration**
  - Handles email communications
  - Sends follow-up emails
  - Delivers appointment confirmations

### Automation Layer
- **Vercel Cron Jobs**
  - 5-minute interval scheduling
  - Lead qualification logic:
    ```sql
    SELECT * FROM leads 
    WHERE status = 'pending'
      AND (last_called_at IS NULL OR last_called_at < now() - interval '4 hours')
      AND call_attempts < 2
    LIMIT 5;
    ```
  - Status transition flow:
    ```
    pending -> calling -> (no_answer | scheduled | not_interested)
    ```
  - Rate limiting (5 leads per run)

## Data Flow

1. **Lead Ingestion**
   ```
   CSV Import/Manual Entry → Supabase leads table → Real-time UI update
   ```

2. **Automated Calling**
   ```
   Vercel Cron → Lead Selection → VAPI Call → Status Update → Email Follow-up
   ```

3. **Appointment Booking**
   ```
   Successful Call → Cal.com Scheduling → Email Confirmation → Lead Status Update
   ```

## Security Considerations
- Authentication implemented via Supabase Auth
- Row Level Security (RLS) policies ensure data isolation between users
- Rate limiting on API endpoints
- Webhook signature verification for Cal.com and VAPI integrations
- Secure environment variables for integration keys
- CORS configuration in middleware.ts
- API route protection via Next.js middleware

## Monitoring
- Real-time lead status tracking
- Automation system status monitoring
- Call attempt tracking
- Success rate metrics
