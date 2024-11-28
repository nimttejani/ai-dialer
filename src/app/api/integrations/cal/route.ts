import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';
import * as crypto from 'crypto';

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
async function verifyCalSignature(request: Request): Promise<boolean> {
  const signature = request.headers.get('x-cal-signature-256');
  if (!signature || !process.env.CALCOM_WEBHOOK_SECRET) {
    return false;
  }

  try {
    // Clone the request since we need to read the body twice
    const clonedRequest = request.clone();
    const rawBody = await clonedRequest.text();

    // Create HMAC using the webhook secret
    const hmac = crypto.createHmac('sha256', process.env.CALCOM_WEBHOOK_SECRET);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest('hex');

    // Compare signatures using timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Define a precise type for appointment data
interface AppointmentData {
  cal_booking_uid: string;
  status: string;
  updated_at: string;
  start_time?: string;
  end_time?: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  cancellation_reason?: string;
}

// Update appointment in database
async function updateAppointment(event: z.infer<typeof webhookEventSchema>) {
  const { triggerEvent, payload } = event;

  // Base appointment data
  const appointmentData: AppointmentData = {
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
    if (!await verifyCalSignature(request)) {
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
