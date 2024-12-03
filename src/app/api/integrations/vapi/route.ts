import { NextResponse } from 'next/server';
import { getAvailability, createBooking } from '@/lib/cal';
import { CallLogService } from '@/lib/services/call-logs';
import { LeadsService } from '@/lib/services/leads';
import { EmailService } from '@/lib/services/email';
import { SettingsService } from '@/lib/services/settings';
import { createServiceClient } from '@/lib/supabase/service';
import { Database } from '@/lib/supabase/types';
import { z } from 'zod';

// Schema for the Vapi tool call request
const requestSchema = z.object({
  message: z.object({
    type: z.enum(['tool-calls', 'end-of-call-report']),
    toolCalls: z.array(z.object({
      id: z.string(),
      type: z.literal('function'),
      function: z.object({
        name: z.enum(['check_availability', 'book_appointment']),
        arguments: z.record(z.any())
      })
    })).optional(),
    endedReason: z.string().optional(),
    transcript: z.string().optional(),
    summary: z.string().optional(),
    messages: z.array(z.any()).optional(),
    call: z.object({
      id: z.string()
    }).optional()
  })
});

// Schema for booking arguments
const bookingArgsSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  company: z.string(),
  phone: z.string(),
  timezone: z.string(),
  notes: z.string().optional(),
  startTime: z.string()
});

// Schema for availability arguments
const availabilityArgsSchema = z.object({
  timezone: z.string()
});

// Helper function to convert local time to UTC
function localToUTC(dateStr: string, timezone: string): string {
  const date = new Date(dateStr);
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const diff = utcDate.getTime() - localDate.getTime();
  return new Date(date.getTime() + diff).toISOString();
}

// Helper function to convert UTC to local time
function utcToLocal(dateStr: string, timezone: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { timeZone: timezone });
}

// Validate request authentication
function validateApiKey(request: Request) {
  const apiKey = request.headers.get('x-vapi-secret');
  if (!apiKey || apiKey !== process.env.VAPI_SECRET_KEY) {
    return false;
  }
  return true;
}

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadStatus = Lead['status'];
type LeadUpdate = Partial<Pick<Lead, 'status' | 'cal_booking_uid' | 'follow_up_email_sent'>>;

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
    const supabaseServiceClient = createServiceClient();
    const callLogService = new CallLogService(supabaseServiceClient);
    const leadsService = new LeadsService(supabaseServiceClient);
    const settingsService = new SettingsService(supabaseServiceClient);

    // Handle end-of-call-report
    if (parsedRequest.message.type === 'end-of-call-report') {
      const callId = requestBody.message.call?.id;
      if (!callId) {
        console.warn('No call ID found in end-of-call report:', JSON.stringify(requestBody, null, 2));
        return NextResponse.json({}, { status: 200 });
      }

      // Update call log and get the lead_id
      const { data: updatedCallLog, error: updateError } = await callLogService.updateWithReport(callId, requestBody);
      if (updateError || !updatedCallLog) {
        console.error('Error updating call log with report:', updateError);
        return NextResponse.json({}, { status: 200 });
      }

      // Get the status from the report
      const status: LeadStatus = (requestBody.message.analysis?.structuredData?.['outcome'] ?? 'error') as LeadStatus;
      
      // Only update if we got a valid status and have a lead_id
      if (updatedCallLog.lead_id && (status === 'no_answer' || status === 'scheduled' || status === 'not_interested')) {
        // For scheduled status, extract booking UID from the report
        const updateData: LeadUpdate = { status };
        
        if (status === 'scheduled') {
          const bookingResult = requestBody.message.analysis?.structuredData?.['booking_result'];
          if (bookingResult?.status === 'success' && bookingResult?.data?.uid) {
            updateData.cal_booking_uid = bookingResult.data.uid;
            console.log(`Updating lead with Cal.com booking UID: ${bookingResult.data.uid}`);
          } else {
            console.warn('Scheduled status but no valid booking UID found:', bookingResult);
          }
        }

        const { success, error: leadUpdateError, data: lead } = await leadsService.updateLead(updatedCallLog.lead_id, updateData);
        if (!success) {
          console.error('Error updating lead status:', leadUpdateError);
        }

        // Get the current automation settings
        const settings = await settingsService.getAutomationSettings();

        // Send follow-up email for not_interested immediately, or for no_answer only when max attempts reached
        // Also ensure we haven't sent a follow-up email already
        if (lead && !lead.follow_up_email_sent && (
          status === 'not_interested' || 
          (status === 'no_answer' && lead.call_attempts >= settings.max_attempts)
        )) {
          try {
            const emailService = new EmailService();
            const emailResult = await emailService.sendFollowUpEmail({
              name: lead.contact_name,
              email: lead.email,
              company: lead.company_name
            }, status);

            // Only mark the email as sent if Resend confirms successful delivery
            if (emailResult.error === null) {
              const emailUpdate: LeadUpdate = { follow_up_email_sent: true };
              const { error: updateError } = await leadsService.updateLead(lead.id, emailUpdate);
              
              if (updateError) {
                console.error('Error updating follow_up_email_sent flag:', updateError);
              } else {
                console.log(`Follow-up email sent and flag updated for lead ${lead.email} with status ${status}`);
              }
            } else {
              console.error('Error sending follow-up email:', emailResult.error);
            }
          } catch (emailError) {
            console.error('Error in email sending process:', emailError);
          }
        } else if (status === 'no_answer') {
          const reason = lead?.follow_up_email_sent 
            ? 'follow-up email already sent'
            : `attempts (${lead?.call_attempts}/${settings.max_attempts}) not reached max`;
          console.log(`No follow-up email sent for ${lead?.email}: ${reason}`);
        }
      } else {
        console.warn('Invalid status or missing lead_id. Status:', status, 'Lead ID:', updatedCallLog.lead_id);
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
      case 'check_availability': {
        let availabilityArgs;
        try {
          const args = toolCall.function.arguments;
          availabilityArgs = availabilityArgsSchema.parse(args);
        } catch {
          return NextResponse.json({
            results: [{
              toolCallId,
              result: 'Error: Invalid availability arguments. Timezone is required.'
            }]
          }, { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

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
        
        // Convert UTC slots to local time
        const localSlots = result.availability?.slots.map(slot => ({
          ...slot,
          time: utcToLocal(slot.time, availabilityArgs.timezone)
        })) || [];

        return NextResponse.json({
          results: [{
            toolCallId,
            result: {
              availableSlots: localSlots,
              timezone: availabilityArgs.timezone
            }
          }]
        }, { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      case 'book_appointment': {
        let bookingDetails;
        try {
          const args = toolCall.function.arguments;
          const parsedArgs = bookingArgsSchema.parse(args);
          
          // Convert local time to UTC for cal.com
          bookingDetails = {
            ...parsedArgs,
            startTime: localToUTC(parsedArgs.startTime, parsedArgs.timezone)
          };
        } catch (error) {
          console.error('Error parsing booking details:', error);
          return NextResponse.json({
            results: [{
              toolCallId,
              result: 'Error: Invalid booking details provided. Required fields: name, email, company, phone, timezone, startTime'
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
