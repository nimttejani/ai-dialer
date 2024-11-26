# API Documentation

## Authentication

All API endpoints require authentication via Supabase Auth except:
- `/api/cron` (requires CRON_SECRET)
- `/api/integrations/vapi` (requires VAPI authentication)

Unauthorized requests will receive:
```typescript
{
  error: "Unauthorized"
}
```

## Endpoints Overview

### Lead Management

#### GET `/api/leads`
Retrieves all leads from the system.

**Response:**
```typescript
[
  {
    id: string;
    company_name: string;
    phone: string;
    email: string;
    status: 'pending' | 'calling' | 'no_answer' | 'scheduled' | 'not_interested';
    call_attempts: number;
    last_called_at: string | null;
    created_at: string;
    updated_at: string;
  }
]
```

#### POST `/api/leads`
Add new leads to the system. Accepts single lead or array of leads.

**Request Body:**
```typescript
{
  company_name: string;
  phone: string;
  email: string;
}
```
or
```typescript
Array<{
  company_name: string;
  phone: string;
  email: string;
}>
```

#### POST `/api/leads/import`
Bulk import leads via CSV.

**Request Body:**
```typescript
FormData with 'file' field containing CSV file
```

#### PUT `/api/leads/[id]`
Update lead details.

**Request Body:**
```typescript
{
  company_name?: string;
  phone?: string;
  email?: string;
  status?: 'pending' | 'calling' | 'no_answer' | 'scheduled' | 'not_interested';
  call_attempts?: number;
  last_called_at?: string | null;
}
```

#### DELETE `/api/leads/[id]`
Remove a lead from the system.

### Automation Control

#### GET `/api/automation/status`
Get current automation system status.

**Response:**
```typescript
{
  automation_enabled: boolean;
  max_calls_batch: number;
  retry_interval: number;
  max_attempts: number;
}
```

#### POST `/api/automation/toggle`
Enable or disable the automation system.

**Request Body:**
```typescript
{
  automation_enabled: boolean;
}
```

### Cron Job

#### GET `/api/cron`
Trigger the automation system to process pending leads.

**Authentication:**
```http
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```typescript
{
  message: string; // Status message about the automation run
}
```

### Integrations

#### VAPI Integration

##### POST `/api/integrations/vapi`
Endpoint for VAPI agent to interact with the system.

**Authentication:**
```http
Authorization: Bearer YOUR_VAPI_SECRET
```

**Request Body:**
```typescript
{
  action: 'check_availability' | 'book_appointment';
  bookingDetails?: {
    name: string;
    email: string;
    company: string;
    phone: string;
    notes?: string;
    startTime: string; // ISO string
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  data?: {
    availability?: Array<{
      date: string;
      slots: string[];
    }>;
    booking?: {
      id: string;
      startTime: string;
    };
  };
}
```

#### Cal.com Integration

##### POST `/api/integrations/cal`
Endpoint for Cal.com API integration.

**Request Body:**
```typescript
{
  action: string;
  payload: {
    uid?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
    attendees?: Array<{
      email: string;
      name: string;
      phone?: string;
    }>;
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

## Error Handling

API errors follow this format:
```typescript
{
  error: string;
}
```

Common HTTP Status Codes:
- 200: Success
- 401: Unauthorized
- 400: Bad Request
- 500: Internal Server Error
