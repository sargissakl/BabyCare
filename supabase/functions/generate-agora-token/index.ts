import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Agora RTC Token Builder (simplified implementation)
function generateRtcToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: number,
  expirationTimeInSeconds: number
): string {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // For demo purposes, we'll use a simplified token generation
  // In production, use the official Agora token generation library
  const message = `${appId}${channelName}${uid}${privilegeExpiredTs}`;
  
  // Create a simple hash (in production, use proper HMAC-SHA256)
  const encoder = new TextEncoder();
  const data = encoder.encode(message + appCertificate);
  
  return crypto.subtle.digest('SHA-256', data)
    .then(hash => {
      const hashArray = Array.from(new Uint8Array(hash));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `007${appId}${hashHex}`;
    })
    .then(token => token);
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get('AGORA_APP_ID');
    const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE');

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    const { channelName, uid, role } = await req.json();

    if (!channelName) {
      throw new Error('Channel name is required');
    }

    // role: 1 for publisher (monitor), 2 for subscriber (viewer)
    const tokenRole = role || 1;
    const uidNumber = uid || 0;
    const expirationTimeInSeconds = 3600; // 1 hour

    const token = await generateRtcToken(
      appId,
      appCertificate,
      channelName,
      uidNumber,
      tokenRole,
      expirationTimeInSeconds
    );

    return new Response(
      JSON.stringify({
        token,
        appId,
        channelName,
        uid: uidNumber,
        expiration: expirationTimeInSeconds,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
