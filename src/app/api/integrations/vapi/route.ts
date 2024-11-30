import { NextResponse } from 'next/server';
import { getAvailability, createBooking } from '@/lib/cal';
import { updateCallStatus } from '@/lib/supabase/service';
import { CallLogService } from '@/lib/services/call-logs';
import { createServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

// Schema for the Vapi tool call request
const requestSchema = z.object({
  message: z.object({
    type: z.enum(['tool-calls', 'end-of-call-report']),
    toolCalls: z.array(z.object({
      id: z.string(),
      type: z.literal('function'),
      function: z.object({
        name: z.enum(['checkAvailability', 'bookAppointment']),
        arguments: z.record(z.any())
      })
    })).optional(),
    endedReason: z.string().optional(),
    transcript: z.string().optional(),
    summary: z.string().optional(),
    messages: z.array(z.any()).optional()
  })
});

// Schema for booking arguments
const bookingArgsSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  company: z.string(),
  phone: z.string(),
  notes: z.string().optional(),
  startTime: z.string()
});

// Validate request authentication
function validateApiKey(request: Request) {
  const apiKey = request.headers.get('x-vapi-secret');
  if (!apiKey || apiKey !== process.env.VAPI_SECRET_KEY) {
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  try {
    // Log request details for debugging
    const requestBody = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    console.log('VAPI Request:', {
      method: request.method,
      url: request.url,
      headers,
      body: JSON.stringify(requestBody, null, 2)
    });

    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json({
        results: [{
          toolCallId: '',
          result: 'Error: Unauthorized: Invalid API key'
        }]
      }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate request body
    const parsedRequest = requestSchema.parse(requestBody);
    
    // Create service instances with the service role client
    const callLogService = new CallLogService(createServiceClient());

    // Handle end-of-call-report
    if (parsedRequest.message.type === 'end-of-call-report') {
      // Update call log with report asynchronously
      const callId = requestBody.call?.id;
      if (callId) {
        callLogService.updateWithReport(callId, requestBody)
          .catch(error => console.error('Error updating call log with report:', error));
      }

      // Process lead status update asynchronously
      const phoneNumber = requestBody.call?.to || requestBody.call?.from;
      if (phoneNumber) {
        const status = requestBody.message.analysis?.structuredData?.['Lead Status'];
        
        // Only update if we got a valid status
        if (status === 'no_answer' || status === 'scheduled' || status === 'not_interested') {
          // Fire and forget - we don't wait for this to complete
          updateCallStatus(phoneNumber, status)
            .catch(error => console.error('Error processing end-of-call report:', error));
        } else {
          console.warn('Invalid or missing Lead Status in end-of-call report:', status);
        }
      } else {
        console.warn('No phone number found in end-of-call report:', JSON.stringify(requestBody, null, 2));
      }
      
      return NextResponse.json({}, { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Handle tool calls format
    const toolCall = parsedRequest.message.toolCalls?.[0];
    if (!toolCall) {
      return NextResponse.json({
        results: [{
          toolCallId: '',
          result: 'Error: No tool calls found in request'
        }]
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const functionName = toolCall.function.name;
    const toolCallId = toolCall.id;

    // Handle different function calls
    switch (functionName) {
      case 'checkAvailability': {
        const result = await getAvailability(5);
        if (!result.success) {
          return NextResponse.json({
            results: [{
              toolCallId,
              result: `Error: ${result.error}`
            }]
          }, { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return NextResponse.json({
          results: [{
            toolCallId,
            result: {
              availableSlots: result.availability?.slots || []
            }
          }]
        }, { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      case 'bookAppointment': {
        let bookingDetails;
        try {
          const args = toolCall.function.arguments;
          bookingDetails = bookingArgsSchema.parse(args);
        } catch {
          return NextResponse.json({
            results: [{
              toolCallId,
              result: 'Error: Invalid booking details provided'
            }]
          }, { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const result = await createBooking(bookingDetails);
        if (!result.success) {
          return NextResponse.json({
            results: [{
              toolCallId,
              result: `Error: ${result.error}`
            }]
          }, { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return NextResponse.json({
          results: [{
            toolCallId,
            result: `Successfully booked appointment for ${bookingDetails.name} at ${bookingDetails.startTime}`
          }]
        }, { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      default:
        return NextResponse.json({
          results: [{
            toolCallId,
            result: 'Error: Invalid function name'
          }]
        }, { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({
      results: [{
        toolCallId: '',
        result: error instanceof Error ? error.message : 'An unexpected error occurred'
      }]
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
