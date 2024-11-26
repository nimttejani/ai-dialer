import { z } from 'zod';

if (!process.env.CALCOM_API_KEY) throw new Error('CALCOM_API_KEY is required');
if (!process.env.CALCOM_EVENT_TYPE_ID) throw new Error('CALCOM_EVENT_TYPE_ID is required');
if (!process.env.CALCOM_EVENT_DURATION) throw new Error('CALCOM_EVENT_DURATION is required');

const BASE_URL = 'https://api.cal.com/v2';

const config = {
  apiKey: process.env.CALCOM_API_KEY,
  eventTypeId: process.env.CALCOM_EVENT_TYPE_ID,
  eventDuration: parseInt(process.env.CALCOM_EVENT_DURATION, 10),
} as const;

const slotSchema = z.object({
  time: z.string(),
  attendees: z.number().optional(),
  bookingId: z.string().optional(),
});

const availabilityResponseSchema = z.object({
  slots: z.array(slotSchema)
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
  
  const url = `${BASE_URL}/slots?${new URLSearchParams({
    eventTypeId: config.eventTypeId,
    startTime,
    endTime
  })}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch availability: ${response.statusText}`);
  }

  const data = await response.json();
  return availabilityResponseSchema.parse(data);
}

export async function createBooking(details: BookingDetails) {
  const response = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventTypeId: config.eventTypeId,
      start: details.startTime,
      end: new Date(new Date(details.startTime).getTime() + config.eventDuration * 60000).toISOString(),
      attendees: [
        {
          email: details.email,
          name: details.name,
          phone: details.phone,
        }
      ],
      metadata: {
        company: details.company,
        notes: details.notes || '',
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create booking: ${response.statusText}`);
  }

  return response.json();
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
