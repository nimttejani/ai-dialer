import { NextResponse } from 'next/server';
import { getAvailability, createBooking } from '@/services/cal';
import { formatAvailabilityForVAPI } from '@/lib/cal';
import { z } from 'zod';

// Schema for the booking request
const bookingRequestSchema = z.object({
  action: z.enum(['check_availability', 'book_appointment']),
  bookingDetails: z.object({
    name: z.string(),
    email: z.string().email(),
    company: z.string(),
    phone: z.string(),
    notes: z.string().optional(),
    startTime: z.string().optional(), // Required only for booking
  }).optional(), // Required only for booking
});

// Validate request authentication
function validateApiKey(request: Request) {
  const apiKey = request.headers.get('x-vapi-secret');
  if (!apiKey || apiKey !== process.env.VAPI_SECRET_KEY) {
    throw new Error('Unauthorized: Invalid API key');
  }
}

export async function POST(request: Request) {
  try {
    // Validate API key
    validateApiKey(request);

    // Parse and validate request body
    const body = await request.json();
    const { action, bookingDetails } = bookingRequestSchema.parse(body);

    // Handle different actions
    switch (action) {
      case 'check_availability': {
        const result = await getAvailability(5);
        if (!result.success) {
          throw new Error(result.error);
        }
        
        const formattedAvailability = formatAvailabilityForVAPI(result.availability!);
        
        return NextResponse.json({
          success: true,
          message: formattedAvailability ? 
            `Here are the available time slots:\n${formattedAvailability}` :
            "I apologize, but I don't see any available slots in the next 5 days. Would you like me to check further dates?",
          availability: result.availability // Raw data for VAPI to parse if needed
        });
      }

      case 'book_appointment': {
        if (!bookingDetails) {
          throw new Error('Booking details are required for appointment booking');
        }
        if (!bookingDetails.startTime) {
          throw new Error('Start time is required for appointment booking');
        }

        const result = await createBooking(bookingDetails);
        if (!result.success) {
          throw new Error(result.error);
        }
        
        return NextResponse.json({
          success: true,
          message: `Great! I've booked your demo for ${new Date(bookingDetails.startTime).toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          })}. You'll receive a confirmation email shortly with all the details.`,
          booking: result.booking
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in Cal.com API route:', error);
    
    // Format error message for VAPI
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return NextResponse.json({
      success: false,
      message: error instanceof z.ZodError ?
        "I couldn't process that request. Please make sure all required information is provided." :
        `I apologize, but I encountered an error: ${errorMessage}. Would you like to try again?`
    }, {
      status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500
    });
  }
}
