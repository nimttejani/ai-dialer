import { z } from 'zod';

if (!process.env.CALCOM_API_KEY) throw new Error('CALCOM_API_KEY is required');
if (!process.env.CALCOM_EVENT_TYPE_ID) throw new Error('CALCOM_EVENT_TYPE_ID is required');
if (!process.env.CALCOM_EVENT_DURATION) throw new Error('CALCOM_EVENT_DURATION is required');
if (!process.env.CALCOM_USERNAME) throw new Error('CALCOM_USERNAME is required');
if (!process.env.CALCOM_EVENT_SLUG) throw new Error('CALCOM_EVENT_SLUG is required');

const BASE_URL = 'https://api.cal.com/v2';

const config = {
  apiKey: process.env.CALCOM_API_KEY,
  eventTypeId: parseInt(process.env.CALCOM_EVENT_TYPE_ID, 10),
  eventDuration: parseInt(process.env.CALCOM_EVENT_DURATION, 10),
  username: process.env.CALCOM_USERNAME,
  eventSlug: process.env.CALCOM_EVENT_SLUG,
} as const;

const slotSchema = z.object({
  time: z.string(),
  attendees: z.number().optional(),
  bookingId: z.string().optional(),
});

const availabilityResponseSchema = z.object({
  status: z.literal('success'),
  data: z.object({
    slots: z.record(z.string(), z.array(slotSchema))
  })
});

type Slot = z.infer<typeof slotSchema>;
type AvailabilityResponse = {
  slots: Slot[];
};

export type BookingDetails = {
  name: string;
  email: string;
  company: string;
  phone: string;
  notes?: string;
  startTime: string;
};

export async function getAvailability(days: number = 5): Promise<AvailabilityResponse> {
  const startTime = new Date().toISOString();
  const endTime = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  
  const params = new URLSearchParams({
    startTime,
    endTime,
    eventTypeId: config.eventTypeId.toString(),
    eventTypeSlug: config.eventSlug,
    duration: config.eventDuration.toString(),
  });

  // Add username list parameter
  params.append('usernameList[]', config.username);
  
  const url = `${BASE_URL}/slots/available?${params}`;

  console.log('Fetching availability from:', url);
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch availability:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`Failed to fetch availability: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Availability response:', JSON.stringify(data, null, 2));
  
  // Validate the response
  const parsed = availabilityResponseSchema.parse(data);
  
  // Convert the date-grouped slots into a flat array
  const slots = Object.values(parsed.data.slots).flat();
  
  return { slots };
}

export async function createBooking(details: BookingDetails) {
  const response = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'cal-api-version': '2024-08-13'
    },
    body: JSON.stringify({
      start: details.startTime,
      eventTypeId: config.eventTypeId,
      attendee: {
        name: details.name,
        email: details.email,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      metadata: {
        company: details.company,
        notes: details.notes || '',
        phone: details.phone
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create booking:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`Failed to create booking: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

export function formatAvailabilityForVAPI(availability: AvailabilityResponse): string {
  // Group slots by date
  const slotsByDate = availability.slots.reduce((acc, slot: Slot) => {
    const date = new Date(slot.time).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    
    if (!acc[date]) acc[date] = [];
    acc[date].push(new Date(slot.time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }));
    
    return acc;
  }, {} as Record<string, string[]>);

  return Object.entries(slotsByDate)
    .map(([date, times]) => `${date}: ${times.join(', ')}`)
    .join('\n');
}
