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
- **Schema**:
  - `leads` table:
    - `id`: UUID (primary key)
    - `company_name`: text
    - `phone`: text
    - `email`: text
    - `status`: enum ('pending', 'calling', 'no_answer', 'scheduled', 'not_interested')
    - `call_attempts`: integer
    - `last_called_at`: timestamp
    - `created_at`: timestamp
    - `updated_at`: timestamp

### Integration Layer
- **VAPI.ai Integration**
  - Handles outbound voice calls
  - Manages conversation flow
  - Reports call outcomes
  
- **Cal.com Integration**
  - Structure:
    ```
    /src/lib/cal.ts        # Low-level Cal.com API client
    /src/services/cal.ts   # Business logic and error handling
    /api/cal/route.ts      # VAPI-authenticated endpoint
    ```
  - Flow:
    1. VAPI agent discusses scheduling with caller
    2. Agent calls `/api/cal` endpoint to:
       - Check available time slots
       - Book appointments when caller confirms
    3. Endpoint authenticates VAPI request
    4. Service layer handles Cal.com API interaction
    5. Response formatted for VAPI to relay to caller
  - Security:
    - Endpoint protected by our generated API key (x-vapi-secret header)
    - Cal.com credentials stored in environment variables
    - VAPI configured to include our API key in tool requests
  
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
- Open policy for MVP (no auth required)
- Rate limiting on API endpoints
- Secure environment variables for integration keys

## Monitoring
- Real-time lead status tracking
- Automation system status monitoring
- Call attempt tracking
- Success rate metrics
