import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Webhook event schema
const webhookEventSchema = z.object({
  triggerEvent: z.enum(['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED']),
  payload: z.object({
    uid: z.string(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    status: z.string(),
    cancellationReason: z.string().optional(),
    attendees: z.array(z.object({
      email: z.string().email(),
      name: z.string(),
      phone: z.string().optional()
    })).optional()
  })
});

// Verify Cal.com webhook signature
function verifyCalSignature(request: Request): boolean {
  const signature = request.headers.get('cal-signature');
  if (!signature || !process.env.CALCOM_WEBHOOK_SECRET) {
    return false;
  }

  // TODO: Implement proper signature verification
  // For MVP, we'll just check if the secret exists
  return true;
}

// Update appointment in database
async function updateAppointment(event: z.infer<typeof webhookEventSchema>) {
  const { triggerEvent, payload } = event;

  // Base appointment data
  const appointmentData: Record<string, any> = {
    cal_booking_uid: payload.uid,
    status: payload.status.toLowerCase(),
    updated_at: new Date().toISOString()
  };

  // Add event-specific data
  switch (triggerEvent) {
    case 'BOOKING_CREATED':
    case 'BOOKING_RESCHEDULED':
      if (payload.startTime && payload.endTime) {
        appointmentData.start_time = payload.startTime;
        appointmentData.end_time = payload.endTime;
      }
      if (payload.attendees?.[0]) {
        appointmentData.customer_email = payload.attendees[0].email;
        appointmentData.customer_name = payload.attendees[0].name;
        appointmentData.customer_phone = payload.attendees[0].phone;
      }
      break;
    case 'BOOKING_CANCELLED':
      appointmentData.cancellation_reason = payload.cancellationReason;
      break;
  }

  // Upsert appointment data
  const { error } = await supabase
    .from('appointments')
    .upsert(appointmentData, {
      onConflict: 'cal_booking_uid'
    });

  if (error) {
    console.error('Error updating appointment:', error);
    throw new Error('Failed to update appointment in database');
  }
}

export async function POST(request: Request) {
  try {
    // Verify Cal.com webhook signature
    if (!verifyCalSignature(request)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse and validate webhook event
    const body = await request.json();
    const event = webhookEventSchema.parse(body);

    // Update appointment in database
    await updateAppointment(event);

    // Send success response
    return NextResponse.json({
      success: true,
      message: `Successfully processed ${event.triggerEvent} event`
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}
