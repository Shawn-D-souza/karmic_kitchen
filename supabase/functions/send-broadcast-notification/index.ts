// supabase/functions/send-broadcast-notification/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

// Get VAPID keys from Vault
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

webpush.setVapidDetails(
  'mailto:admin@karmic.co.in', // IMPORTANT: Change to your admin email
  vapidPublicKey,
  vapidPrivateKey
);

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// --- ADD THESE HEADERS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or your specific website URL for better security
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // --- Respond to OPTIONS preflight request (for CORS) ---
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the custom message from the admin
    const { message } = await req.json();
    if (!message) throw new Error('Message content is required.');

    // Get all subscriptions from the database
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription');

    if (subError) throw subError;

    const notificationPayload = JSON.stringify({
      title: 'Karmic Kitchen Alert',
      body: message
    });

    // Send a notification to every user who is subscribed
    const broadcastPromises = subscriptions.map(s => {
      return webpush.sendNotification(s.subscription, notificationPayload);
    });

    await Promise.all(broadcastPromises);

    return new Response(JSON.stringify({ message: `Sent broadcast to ${subscriptions.length} users.` }), {
      // --- ADD HEADERS TO SUCCESS RESPONSE ---
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      // --- ADD HEADERS TO ERROR RESPONSE ---
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});