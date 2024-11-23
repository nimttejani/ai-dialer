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
- **Key Tables**:
  - `leads`: Stores lead information and status
  - `lead_status`: Enum type for tracking lead lifecycle

### Integration Layer
- **VAPI.ai Integration**
  - Handles outbound voice calls
  - Manages conversation flow
  - Reports call outcomes
  
- **Cal.com Integration**
  - Manages appointment scheduling
  - Syncs calendar availability
  
- **Resend Integration**
  - Handles email communications
  - Sends follow-up emails
  - Delivers appointment confirmations

### Automation Layer
- **Vercel Cron Jobs**
  - 5-minute interval scheduling
  - Lead qualification logic
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
