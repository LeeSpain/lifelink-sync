/**
 * Records a sent invite across all Growth tables.
 * Call this AFTER every successful WhatsApp/email send.
 */
export async function recordInvite(
  supabase: any,
  data: {
    contact_name: string;
    whatsapp?: string;
    email?: string;
    message: string;
    raw_note?: string;
    relationship?: string;
    who_for?: string;
    send_via?: string;
    sender_mode?: string;
    preferred_language?: string;
    twilio_sid?: string;
  }
) {
  try {
    // 1. Save to manual_invites
    const { data: invite } = await supabase
      .from('manual_invites')
      .insert({
        contact_name: data.contact_name,
        contact_whatsapp: data.whatsapp || null,
        contact_email: data.email || null,
        message_sent: data.message,
        personal_message: data.raw_note || data.message,
        relationship_tone: data.relationship || 'friendly',
        protection_for: data.who_for || null,
        send_via: data.send_via || 'whatsapp',
        clara_enhanced: data.sender_mode === 'clara',
        whatsapp_sent: !!data.whatsapp,
        email_sent: !!data.email,
        status: 'sent',
      })
      .select('id')
      .maybeSingle();

    // 2. Upsert to leads
    const nameParts = data.contact_name.trim().split(' ');
    const leadEmail = data.email || (data.whatsapp ? `${data.whatsapp.replace(/[^0-9]/g, '')}@invite.lifelink-sync.com` : null);

    const { data: lead } = await supabase
      .from('leads')
      .insert({
        first_name: nameParts[0] || data.contact_name,
        last_name: nameParts.slice(1).join(' ') || null,
        full_name: data.contact_name,
        email: leadEmail,
        phone: data.whatsapp || null,
        lead_source: data.sender_mode === 'clara' ? 'clara_invite' : 'manual_invite',
        status: 'new',
        interest_level: 5,
        lead_score: 30,
        language: data.preferred_language || 'en',
        notes: `Invite sent via ${data.send_via || 'whatsapp'}. ${data.who_for ? `Protection for: ${data.who_for}. ` : ''}${data.raw_note || ''}`.trim(),
        tags: [data.sender_mode === 'clara' ? 'clara-invite' : 'manual-invite', data.who_for].filter(Boolean),
        last_contacted_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();

    // 3. Log to lead_activities
    if (lead?.id) {
      await supabase.from('lead_activities').insert({
        lead_id: lead.id,
        activity_type: 'whatsapp',
        subject: `WhatsApp invite sent${data.sender_mode === 'clara' ? ' by CLARA' : ' by Lee'}`,
        content: data.message?.substring(0, 500),
        metadata: {
          channel: data.send_via || 'whatsapp',
          sender: data.sender_mode === 'clara' ? 'CLARA' : 'Lee',
          twilio_sid: data.twilio_sid || null,
          invite_id: invite?.id || null,
        },
      }).catch(() => {});
    }

    // Update manual_invite with lead_id
    if (invite?.id && lead?.id) {
      await supabase.from('manual_invites')
        .update({ lead_id: lead.id })
        .eq('id', invite.id)
        .catch(() => {});
    }

    return { invite_id: invite?.id, lead_id: lead?.id };
  } catch (err) {
    console.error('recordInvite error:', err);
    return { invite_id: null, lead_id: null };
  }
}
