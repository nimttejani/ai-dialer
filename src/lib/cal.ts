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

export type BookingDetails = {
  name: string;
  email: string;
  company: string;
  phone: string;
  notes?: string;
  startTime: string;
};

export type AvailabilityResponse = {
  success: boolean;
  availability?: {
    slots: Slot[];
  };
  message?: string;
  error?: string;
};

export type BookingResponse = {
  success: boolean;
  booking?: any;
  message?: string;
  error?: string;
};

export async function getAvailability(days: number = 5): Promise<AvailabilityResponse> {
  try {
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
    
    return {
      success: true,
      availability: { slots }
    };
  } catch (error) {
    console.error('Failed to fetch availability:', error);
    return {
      success: false,
      error: 'Failed to fetch availability'
    };
  }
}

export async function createBooking(details: BookingDetails): Promise<BookingResponse> {
  try {
    const response = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13'
      },
      body: JSON.stringify({
        eventTypeId: config.eventTypeId,
        responses: {
          name: details.name,
          email: details.email,
          company: details.company,
          phone: details.phone,
          notes: details.notes,
        },
        timeZone: 'America/Los_Angeles',
        startTime: details.startTime,
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

    const booking = await response.json();
    return {
      success: true,
      booking
    };
  } catch (error) {
    console.error('Failed to create booking:', error);
    return {
      success: false,
      error: 'Failed to create booking'
    };
  }
}
