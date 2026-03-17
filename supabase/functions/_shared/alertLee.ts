// Shared helper to send WhatsApp alerts to Lee
// Used by morning briefing, evening briefing, health check, trial/payment alerts

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_WHATSAPP_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
const LEE = Deno.env.get('TWILIO_WHATSAPP_LEE') || 'whatsapp:+34643706877';

export async function alertLee(message: string): Promise<boolean> {
  try {
    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_FROM,
          To: LEE,
          Body: message,
        }).toString(),
      }
    );
    const data = await resp.json();
    if (data.error_code) {
      console.error('alertLee Twilio error:', data.error_message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('alertLee error:', e);
    return false;
  }
}

export function cetTime(): string {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
}

export function cetDate(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' });
}
