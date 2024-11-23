import { z } from 'zod';

if (!process.env.CALCOM_API_KEY) throw new Error('CALCOM_API_KEY is required');
if (!process.env.CALCOM_USER_ID) throw new Error('CALCOM_USER_ID is required');
if (!process.env.CALCOM_EVENT_TYPE_ID) throw new Error('CALCOM_EVENT_TYPE_ID is required');
if (!process.env.CALCOM_EVENT_DURATION) throw new Error('CALCOM_EVENT_DURATION is required');

const config = {
  apiKey: process.env.CALCOM_API_KEY,
  userId: process.env.CALCOM_USER_ID,
  eventTypeId: process.env.CALCOM_EVENT_TYPE_ID,
  eventDuration: parseInt(process.env.CALCOM_EVENT_DURATION, 10),
} as const;

const availabilitySchema = z.array(z.object({
  date: z.string(),
  slots: z.array(z.string())
}));

type Availability = z.infer<typeof availabilitySchema>;

export async function getAvailability(days: number = 5): Promise<Availability> {
  const response = await fetch(
    `https://api.cal.com/v1/availability/${config.userId}/${config.eventTypeId}?days=${days}&duration=${config.eventDuration}`,
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch availability: ${response.statusText}`);
  }

  const data = await response.json();
  return availabilitySchema.parse(data);
}

export type BookingDetails = {
  name: string;
  email: string;
  company: string;
  phone: string;
  notes?: string;
  startTime: string;
};

export async function createBooking(details: BookingDetails) {
  const response = await fetch(
    `https://api.cal.com/v1/bookings/${config.userId}/${config.eventTypeId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: details.startTime,
        duration: config.eventDuration,
        attendees: [
          {
            name: details.name,
            email: details.email,
            phone: details.phone,
          },
        ],
        responses: {
          company: details.company,
          notes: details.notes || '',
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create booking: ${response.statusText}`);
  }

  return response.json();
}

export function formatAvailabilityForVAPI(availability: Availability): string {
  return availability
    .map(day => {
      const date = new Date(day.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      
      const slots = day.slots
        .map(slot => new Date(slot).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }))
        .join(', ');

      return `${date}: ${slots}`;
    })
    .join('\n');
}
