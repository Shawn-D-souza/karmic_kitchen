// supabase/functions/send-food-reminders/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import dayjs from 'npm:dayjs@1.11.10';
import utc from 'npm:dayjs@1.11.10/plugin/utc';
import timezone from 'npm:dayjs@1.11.10/plugin/timezone';
import webpush from 'npm:web-push@3.6.7';

// Setup dayjs for IST
dayjs.extend(utc);
dayjs.extend(timezone);

// Get VAPID keys from Vault
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

webpush.setVapidDetails(
  'mailto:admin@karmic.co.in', // IMPORTANT: Change to your admin email
  vapidPublicKey,
  vapidPrivateKey
);

// Create a Supabase admin client to bypass RLS
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! 
);

Deno.serve(async (req) => {
  try {
    const todayIST = dayjs().tz('Asia/Kolkata').format('YYYY-MM-DD');

    // 1. Get users at 'Main Office' who HAVE a push subscription
    const { data: officeUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, push_subscriptions ( subscription )')
      .eq('work_location', 'Main Office')
      .not('push_subscriptions', 'is', null); // Only get users with a subscription

    if (usersError) throw usersError;

    // 2. Find users who have *already* confirmed food for today
    const { data: confirmedUsers, error: confirmedError } = await supabaseAdmin
      .from('confirmations')
      .select('user_id')
      .eq('menu_date', todayIST);

    if (confirmedError) throw confirmedError;
    const confirmedUserIdSet = new Set(confirmedUsers.map(u => u.user_id));

    // 3. Filter to find users who are at the office BUT have not confirmed
    const usersToNotify = officeUsers.filter(
      user => !confirmedUserIdSet.has(user.id)
    );

    if (usersToNotify.length === 0) {
      return new Response("All users have confirmed. No notifications sent.", { status: 200 });
    }

    // 4. Send a PUSH NOTIFICATION to each user
    const notificationPayload = JSON.stringify({
      title: 'Karmic Kitchen Reminder',
      body: 'Are you working from home today? If not, please register for food before 12:30 PM.'
    });

    const notificationPromises = usersToNotify.map(user => {
      const subscription = user.push_subscriptions.subscription;
      return webpush.sendNotification(subscription, notificationPayload);
    });

    await Promise.all(notificationPromises);

    return new Response(JSON.stringify({ message: `Sent ${usersToNotify.length} push reminders.` }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});