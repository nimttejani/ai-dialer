import { NextResponse } from 'next/server';
import { getAvailability, createBooking, type BookingDetails } from '@/lib/cal';

export async function GET() {
  try {
    const availability = await getAvailability();
    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Failed to fetch availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const booking = await createBooking(body as BookingDetails);
    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Failed to create booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
