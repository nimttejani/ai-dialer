# API Documentation

## Endpoints Overview

### Lead Management

#### GET `/api/leads`
Retrieves all leads from the system.

**Response:**
```typescript
{
  leads: {
    id: string;
    company_name: string;
    phone: string;
    email: string;
    status: 'pending' | 'no_answer' | 'scheduled' | 'not_interested';
    call_attempts: number;
    last_called_at: string | null;
  }[]
}
```

#### POST `/api/leads`
Add a new lead to the system.

**Request Body:**
```typescript
{
  company_name: string;
  phone: string;
  email: string;
}
```

#### POST `/api/leads/import`
Bulk import leads via CSV.

**Request Body:**
```typescript
{
  file: File; // CSV file
}
```

#### PUT `/api/leads/:id`
Update lead details.

**Request Body:**
```typescript
{
  company_name?: string;
  phone?: string;
  email?: string;
}
```

#### DELETE `/api/leads/:id`
Remove a lead from the system.

### Automation Control

#### GET `/api/automation/status`
Get current automation system status.

**Response:**
```typescript
{
  active: boolean;
  next_run: string;
  leads_in_queue: number;
}
```

#### POST `/api/automation/toggle`
Enable or disable the automation system.

**Request Body:**
```typescript
{
  active: boolean;
}
```

### Cal.com Integration API

#### POST `/api/cal`
Endpoint for Cal.com operations, protected by our API key and called by VAPI.

**Authentication:**
```http
x-vapi-secret: YOUR_GENERATED_API_KEY
```

**Environment Variables:**
```bash
VAPI_SECRET_KEY=your_generated_api_key  # API key for authenticating VAPI requests
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
    startTime: string; // ISO string, required for booking
  };
}
```

**Responses:**

1. Check Availability
```typescript
{
  success: true;
  message: string; // Formatted availability for VAPI to read
  availability: {
    date: string;
    slots: string[];
  }[];
}
```

2. Book Appointment
```typescript
{
  success: true;
  message: string; // Confirmation message for VAPI to read
  booking: {
    id: string;
    startTime: string;
    // Other booking details from Cal.com
  };
}
```

3. Error Response
```typescript
{
  success: false;
  message: string; // Error message formatted for VAPI to read
}
```

**Example Usage:**
```typescript
// Check Availability
const availabilityResponse = await fetch('/api/cal', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-vapi-secret': process.env.VAPI_SECRET_KEY
  },
  body: JSON.stringify({
    action: 'check_availability'
  })
});

// Book Appointment
const bookingResponse = await fetch('/api/cal', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-vapi-secret': process.env.VAPI_SECRET_KEY
  },
  body: JSON.stringify({
    action: 'book_appointment',
    bookingDetails: {
      name: 'John Smith',
      email: 'john@hvaccompany.com',
      company: 'HVAC Solutions Inc',
      phone: '+1234567890',
      startTime: '2024-03-25T09:00:00Z'
    }
  })
});
```

Note: This endpoint is exclusively for use by the VAPI agent during calls. It is not intended for direct frontend use.

## Real-time Subscriptions

### Lead Status Updates
```typescript
supabase
  .from('leads')
  .on('UPDATE', (payload) => {
    // Handle lead status change
  })
  .subscribe()
```

## Error Responses

All endpoints follow this error format:
```typescript
{
  error: {
    message: string;
    code: string;
  }
}
```

Common error codes:
- `INVALID_INPUT`: Request validation failed
- `NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMITED`: Too many requests
- `INTEGRATION_ERROR`: External service error
