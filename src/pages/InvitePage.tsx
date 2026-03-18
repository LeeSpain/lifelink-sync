import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const fromName = searchParams.get('from') || 'Lee Wakeman';
  const toName = searchParams.get('name') || '';
  const ref = searchParams.get('ref') || '';
  const ch = searchParams.get('ch') || 'direct';

  const [leadName, setLeadName] = useState(toName);
  const [loaded, setLoaded] = useState(false);

  // Track click and resolve lead name from invite token
  useEffect(() => {
    if (!ref) { setLoaded(true); return; }

    (async () => {
      try {
        // Look up invite by token
        const { data: invite } = await supabase
          .from('lead_invites')
          .select('id, lead_id, clicked, click_count, expires_at')
          .eq('token', ref)
          .maybeSingle();

        if (!invite) { setLoaded(true); return; }

        // Check expiry
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
          setLoaded(true);
          return;
        }

        // Mark clicked and increment count
        await supabase
          .from('lead_invites')
          .update({
            clicked: true,
            clicked_at: new Date().toISOString(),
            clicked_channel: ch,
            click_count: (invite.click_count || 0) + 1,
          })
          .eq('id', invite.id);

        // Get lead name
        const { data: lead } = await supabase
          .from('leads')
          .select('first_name, full_name')
          .eq('id', invite.lead_id)
          .maybeSingle();

        if (lead) {
          setLeadName(lead.full_name || lead.first_name || toName);
        }
      } catch (e) {
        console.warn('Invite tracking failed:', e);
      }
      setLoaded(true);
    })();
  }, [ref, ch]);

  // Track channel choice and open deep link
  const trackChannel = async (channel: string) => {
    if (ref) {
      try {
        const updates: Record<string, any> = {};
        if (channel === 'whatsapp') {
          updates.whatsapp_started = true;
          updates.whatsapp_started_at = new Date().toISOString();
        } else if (channel === 'messenger') {
          updates.messenger_started = true;
          updates.messenger_started_at = new Date().toISOString();
        } else if (channel === 'sms') {
          updates.sms_replied = true;
          updates.sms_replied_at = new Date().toISOString();
        }
        await supabase
          .from('lead_invites')
          .update(updates)
          .eq('token', ref);

        // Update lead status to talking
        const { data: invite } = await supabase
          .from('lead_invites')
          .select('lead_id')
          .eq('token', ref)
          .maybeSingle();

        if (invite?.lead_id) {
          await supabase
            .from('leads')
            .update({
              invite_status: 'talking',
              preferred_channel: channel,
              first_reply_at: new Date().toISOString(),
            })
            .eq('id', invite.lead_id);
        }
      } catch (e) {
        console.warn('Channel tracking failed:', e);
      }
    }
  };

  const displayName = leadName || toName;

  const waMessage = encodeURIComponent(
    `Hi CLARA! I got an invite from Lee Wakeman.${displayName ? ` I'm ${displayName}.` : ''} I'd like to find out more about LifeLink Sync.`
  );
  const waLink = `https://wa.me/17277615366?text=${waMessage}`;
  const messengerLink = `https://m.me/1022860360912464${ref ? `?ref=invite_${ref}` : ''}`;
  const smsLink = `sms:+17277615366&body=${encodeURIComponent(`Hi CLARA! I got an invite from Lee Wakeman. I'd like to find out more about LifeLink Sync.`)}`;
  const signupLink = `https://lifelink-sync.com/onboarding${ref ? `?ref=${ref}` : ''}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">

        <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
          <span role="img" aria-label="shield">&#x1F6E1;&#xFE0F;</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {displayName ? `Hi ${displayName}!` : 'You\'re invited!'}
        </h1>
        <p className="text-base text-gray-500 mb-2">
          {fromName} asked CLARA to reach out about something he thought you'd love
        </p>
        <p className="text-sm text-gray-400 mb-6">
          CLARA is Lee's AI assistant — she'll introduce LifeLink Sync and answer any questions. Just tap below to start chatting:
        </p>

        <div className="text-left space-y-3 my-6">
          {[
            { emoji: '\u{1F6A8}', text: 'One-tap SOS — family alerted in seconds' },
            { emoji: '\u{1F4CD}', text: 'Live GPS shared during emergencies' },
            { emoji: '\u{1F916}', text: 'CLARA AI available 24/7 to help' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="text-base flex-shrink-0 mt-0.5">{item.emoji}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-6">
          <p className="text-green-800 text-sm font-semibold">7-day free trial</p>
          <p className="text-green-600 text-xs mt-0.5">No card needed &middot; 2 minutes to set up</p>
        </div>

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackChannel('whatsapp')}
          className="flex items-center justify-center gap-3 w-full bg-green-500 text-white rounded-2xl py-4 font-bold text-sm mb-3 hover:bg-green-600 transition-colors"
        >
          <span>&#x1F4AC;</span>
          Chat on WhatsApp
        </a>

        <a
          href={messengerLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackChannel('messenger')}
          className="flex items-center justify-center gap-3 w-full bg-blue-500 text-white rounded-2xl py-4 font-bold text-sm mb-3 hover:bg-blue-600 transition-colors"
        >
          <span>&#x1F4D8;</span>
          Chat on Messenger
        </a>

        <a
          href={smsLink}
          onClick={() => trackChannel('sms')}
          className="flex items-center justify-center gap-3 w-full bg-gray-500 text-white rounded-2xl py-4 font-bold text-sm mb-3 hover:bg-gray-600 transition-colors"
        >
          <span>&#x1F4F1;</span>
          Continue via SMS
        </a>

        <a
          href={signupLink}
          className="flex items-center justify-center gap-3 w-full bg-red-500 text-white rounded-2xl py-4 font-bold text-sm mb-4 hover:bg-red-600 transition-colors"
        >
          <span>&#x1F6E1;&#xFE0F;</span>
          Start free trial now
        </a>

        <p className="text-xs text-gray-400">
          By tapping, you consent to CLARA contacting you. Reply STOP to opt out.
        </p>

        <p className="text-xs text-gray-300 mt-3">
          LifeLink Sync &middot; lifelink-sync.com
        </p>
      </div>
    </div>
  );
}
