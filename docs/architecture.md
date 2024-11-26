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
    ├── database.types.ts # Supabase database type definitions
    ├── supabase.ts       # Supabase client configuration
    ├── types.ts          # Shared type definitions
    └── utils.ts          # Shared utilities
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
  - Handles outbound voice calls via `/api/integrations/vapi` endpoint
  - Manages conversation flow
  - Reports call outcomes
  
- **Cal.com Integration**
  - Structure:
    ```
    /src/lib/cal.ts         # Cal.com API client and business logic
    ```
  - Integration Flow:
    1. VAPI Flow:
       - VAPI agent discusses scheduling with caller
       - Agent interacts with integration endpoint
       - Endpoint validates VAPI secret and handles request
       - Response formatted for VAPI to relay to caller

    2. Cal.com Flow:
       - Integration with Cal.com API for appointment scheduling
       - Handles booking creation and management
       - Updates appointment status in database
       - Triggers any necessary notifications

  - Security:
    - VAPI endpoint protected by authentication header
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
- Authentication implemented via Supabase Auth and Next.js Auth Helpers
- Middleware protection for API routes:
  - All `/api/*` routes require authentication except:
    - `/api/cron` (protected by secret)
    - `/api/integrations/vapi` (protected by VAPI secret)
- Row Level Security (RLS) policies ensure data isolation
- Secure environment variables for all integration keys
- CORS configuration in middleware.ts
- API route protection via Next.js middleware

## Monitoring
- Real-time lead status tracking
- Automation system status monitoring
- Call attempt tracking
- Success rate metrics
