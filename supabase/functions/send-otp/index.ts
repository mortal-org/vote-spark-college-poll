
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOTPRequest {
  mobile: string;
  otp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mobile, otp }: SendOTPRequest = await req.json();
    
    console.log(`Sending OTP ${otp} to mobile: ${mobile}`);
    
    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Twilio credentials missing:', {
        accountSid: !!twilioAccountSid,
        authToken: !!twilioAuthToken,
        phoneNumber: !!twilioPhoneNumber
      });
      throw new Error('Twilio credentials not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to your Supabase Edge Function secrets.');
    }

    // Create Twilio API URL
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    // Prepare SMS message
    const message = `Your College Election verification code is: ${otp}. Do not share this code with anyone. Valid for 10 minutes.`;
    const toNumber = `+91${mobile}`;
    
    console.log(`Sending SMS to ${toNumber} from ${twilioPhoneNumber}`);
    
    // Send SMS via Twilio API
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: toNumber,
        Body: message
      })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('Twilio API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      throw new Error(`Twilio API error: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    console.log('SMS sent successfully:', {
      sid: result.sid,
      status: result.status,
      to: result.to
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully via SMS',
        sid: result.sid 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send OTP',
        details: 'Please check your mobile number and try again. Make sure Twilio credentials are configured.'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
