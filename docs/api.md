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
