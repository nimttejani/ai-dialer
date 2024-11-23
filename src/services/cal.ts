import { getAvailability as getCalAvailability, createBooking as createCalBooking, type BookingDetails } from '@/lib/cal';

export type AvailabilityResponse = {
  success: boolean;
  availability?: Awaited<ReturnType<typeof getCalAvailability>>;
  message?: string;
  error?: string;
};

export type BookingResponse = {
  success: boolean;
  booking?: Awaited<ReturnType<typeof createCalBooking>>;
  message?: string;
  error?: string;
};

export async function getAvailability(days: number = 5): Promise<AvailabilityResponse> {
  try {
    const availability = await getCalAvailability(days);
    return {
      success: true,
      availability
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
    const booking = await createCalBooking(details);
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
