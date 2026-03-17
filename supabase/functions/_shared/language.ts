// ─────────────────────────────────────
// LANGUAGE CONFIGURATION — Single source of truth
// ─────────────────────────────────────

export type Language = 'en' | 'es' | 'nl';

export const DEFAULT_LANGUAGE: Language = 'en';

// Lee's number — ALWAYS English regardless of +34 prefix
export const LEE_PHONE = '+34643706877';

export function isLeeNumber(phone: string): boolean {
  return phone.includes('34643706877');
}

// ─────────────────────────────────────
// GET CONTACT LANGUAGE FROM DB
// Falls back to phone prefix only if DB has no preference
// ─────────────────────────────────────

export async function getContactLanguage(
  supabase: any,
  options: {
    phone?: string;
    email?: string;
    userId?: string;
  }
): Promise<Language> {
  // 0. Lee Wakeman ALWAYS gets English (his +34 number is Spanish prefix but he's English)
  if (options.phone && isLeeNumber(options.phone)) {
    return 'en';
  }

  // 1. Check profiles table (for registered users)
  if (options.userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('user_id', options.userId)
        .single();
      if (data?.preferred_language && ['en', 'es', 'nl'].includes(data.preferred_language)) {
        return data.preferred_language as Language;
      }
    } catch { /* non-fatal */ }
  }

  // 2. Check leads table (for contacts/invites)
  if (options.phone || options.email) {
    try {
      const cleanPhone = options.phone?.replace('whatsapp:', '') || '';
      let query = supabase.from('leads').select('language');

      if (options.email) {
        query = query.eq('email', options.email);
      } else if (cleanPhone) {
        query = query.eq('phone', cleanPhone);
      }

      const { data } = await query.maybeSingle();
      if (data?.language && ['en', 'es', 'nl'].includes(data.language)) {
        return data.language as Language;
      }
    } catch { /* non-fatal */ }
  }

  // 3. Fallback to phone prefix detection (best guess for unknown contacts)
  const phone = options.phone || '';
  if (phone.startsWith('+34')) return 'es';
  if (phone.startsWith('+31')) return 'nl';

  return DEFAULT_LANGUAGE;
}

// ─────────────────────────────────────
// VOICE SETTINGS PER LANGUAGE
// ─────────────────────────────────────

export function getVoiceSettings(lang: Language) {
  const settings: Record<Language, { voice: string; language: string; greeting: string; claraSays: string }> = {
    en: {
      voice: 'Polly.Joanna',
      language: 'en-GB',
      greeting: 'Hello',
      claraSays: 'This is CLARA from LifeLink Sync.',
    },
    es: {
      voice: 'Polly.Conchita',
      language: 'es-ES',
      greeting: 'Hola',
      claraSays: 'Soy CLARA de LifeLink Sync.',
    },
    nl: {
      voice: 'Polly.Lotte',
      language: 'nl-NL',
      greeting: 'Hallo',
      claraSays: 'Ik ben CLARA van LifeLink Sync.',
    },
  };
  return settings[lang] || settings.en;
}

// ─────────────────────────────────────
// EMERGENCY MESSAGES PER LANGUAGE
// ─────────────────────────────────────

export function getEmergencyMessages(lang: Language, memberName: string, locationText: string) {
  const n = memberName;
  const loc = locationText;

  if (lang === 'es') {
    const locEs = loc ? `Su ultima ubicacion conocida es ${loc}.` : 'Se esta determinando su ubicacion.';
    return {
      contactAlert: `Mensaje urgente de CLARA en LifeLink Sync. ${n} ha activado una alerta de emergencia. ${locEs} Por favor contactele inmediatamente o llame al 1 1 2 si cree que es una emergencia grave.`,
      confirmPrompt: 'Pulse 1 para confirmar que ha recibido esta alerta.',
      memberCheck: `Soy CLARA de LifeLink Sync. Su alerta de emergencia ha sido activada. Se esta contactando a su familia ahora. Pulse 1 si esta a salvo y fue un accidente. Pulse 2 si necesita servicios de emergencia.`,
      noResponse: 'No se ha detectado respuesta. Se esta alertando a sus contactos de emergencia. Por favor llame al 1 1 2 si necesita ayuda inmediata.',
    };
  }

  if (lang === 'nl') {
    const locNl = loc ? `De laatst bekende locatie is ${loc}.` : 'De locatie wordt bepaald.';
    return {
      contactAlert: `Dringend bericht van CLARA bij LifeLink Sync. ${n} heeft een nood SOS alarm geactiveerd. ${locNl} Neem onmiddellijk contact op of bel 1 1 2 als u denkt dat het een levensbedreigende noodsituatie is.`,
      confirmPrompt: 'Druk 1 om te bevestigen dat u dit alarm heeft ontvangen.',
      memberCheck: `Dit is CLARA van LifeLink Sync. Uw noodalarm is geactiveerd. Uw familie wordt nu gecontacteerd. Druk 1 als u veilig bent. Druk 2 als u hulpdiensten nodig heeft.`,
      noResponse: 'Geen reactie gedetecteerd. Uw noodcontacten worden gewaarschuwd. Bel 1 1 2 als u onmiddellijk hulp nodig heeft.',
    };
  }

  const locEn = loc ? `Their last known location is ${loc}.` : 'Location is being determined.';
  return {
    contactAlert: `Urgent message from CLARA at LifeLink Sync. ${n} has triggered an emergency SOS alert. ${locEn} Please check on them immediately or call 1 1 2 if you believe this is a life threatening emergency.`,
    confirmPrompt: 'Press 1 to confirm you have received this alert.',
    memberCheck: `This is CLARA from LifeLink Sync. Your emergency alert has been triggered. Your family is being contacted now. Press 1 if you are safe and this was an accident. Press 2 if you need emergency services.`,
    noResponse: 'No response detected. Your emergency contacts are being alerted now. Please call 1 1 2 if you need immediate help.',
  };
}

// ─────────────────────────────────────
// WELLBEING SCRIPTS PER LANGUAGE
// ─────────────────────────────────────

export function getWellbeingScripts(lang: Language, name: string) {
  if (lang === 'es') return {
    wellbeingGreeting: `Hola ${name}, soy CLARA de LifeLink Sync con tu revision diaria de bienestar.`,
    wellbeingQuestion: 'Como te encuentras hoy en general? Pulsa 1 para muy bien, 2 para bien, 3 para regular, 4 para no muy bien, o 5 para mal.',
    wellbeingNoResponse: 'No he recibido tu respuesta. Se notificara a tu familia de la revision perdida. Cuidate, adios.',
    medicationPrompt: `Hola ${name}, soy CLARA con tu recordatorio de medicacion. Has tomado tu medicacion hoy? Pulsa 1 para si, o 2 para todavia no.`,
    medicationNoResponse: 'No se ha recibido respuesta. Se notificara a tu familia. Cuidate, adios.',
  };

  if (lang === 'nl') return {
    wellbeingGreeting: `Hallo ${name}, ik ben CLARA van LifeLink Sync met uw dagelijkse welzijnscontrole.`,
    wellbeingQuestion: 'Hoe voelt u zich vandaag? Druk 1 voor heel goed, 2 voor goed, 3 voor oke, 4 voor niet zo goed, of 5 voor slecht.',
    wellbeingNoResponse: 'Ik heb geen reactie ontvangen. Uw familie wordt op de hoogte gebracht. Pas goed op uzelf, tot ziens.',
    medicationPrompt: `Hallo ${name}, ik ben CLARA met uw medicatieherinnering. Heeft u vandaag uw medicatie ingenomen? Druk 1 voor ja, of 2 voor nog niet.`,
    medicationNoResponse: 'Geen reactie ontvangen. Uw familie wordt op de hoogte gebracht. Pas goed op uzelf, tot ziens.',
  };

  return {
    wellbeingGreeting: `Hello ${name}, this is CLARA, your LifeLink Sync assistant, with your daily wellbeing check-in.`,
    wellbeingQuestion: 'How are you feeling today overall? Press 1 for very well, 2 for good, 3 for okay, 4 for not great, or 5 for unwell.',
    wellbeingNoResponse: 'I did not catch your response. Your family will be notified of the missed check-in. Take care, goodbye.',
    medicationPrompt: `Hello ${name}, this is CLARA, your LifeLink Sync assistant, with your medication reminder. Have you taken your medication today? Press 1 for yes, or 2 for not yet.`,
    medicationNoResponse: 'No response received. Your family will be notified. Take care, goodbye.',
  };
}

// ─────────────────────────────────────
// CONFERENCE GREETINGS PER LANGUAGE
// ─────────────────────────────────────

export function getConferenceGreeting(lang: Language, isMember: boolean, memberName: string) {
  if (lang === 'es') {
    return isMember
      ? 'Soy CLARA de LifeLink Sync. Sus contactos de emergencia se estan uniendo a una llamada con usted ahora.'
      : `CLARA de LifeLink Sync le esta conectando ahora. Puente de emergencia urgente. ${memberName} le necesita ahora.`;
  }
  if (lang === 'nl') {
    return isMember
      ? 'Dit is CLARA van LifeLink Sync. Uw noodcontacten worden nu met u verbonden.'
      : `CLARA van LifeLink Sync verbindt u nu. Dringende noodbrug. ${memberName} heeft u nu nodig.`;
  }
  return isMember
    ? 'This is CLARA from LifeLink Sync. Your emergency contacts are joining a call with you now.'
    : `CLARA from LifeLink Sync is connecting you now. Urgent emergency bridge. ${memberName} needs you now.`;
}

// ─────────────────────────────────────
// CLARA SPEAK GREETING PER LANGUAGE
// ─────────────────────────────────────

export function getClaraSpeakGreeting(lang: Language) {
  if (lang === 'es') return { greeting: 'Hola. Soy CLARA, tu asistente de seguridad personal de LifeLink Sync.', noResponse: 'No se ha recibido respuesta. Se esta alertando a sus contactos de emergencia.', pressPrompt: 'Pulse 1 para confirmar que esta bien. Pulse 2 para activar respuesta de emergencia.' };
  if (lang === 'nl') return { greeting: 'Hallo. Ik ben CLARA, uw persoonlijke veiligheidsassistent van LifeLink Sync.', noResponse: 'Geen reactie ontvangen. Uw noodcontacten worden nu gewaarschuwd.', pressPrompt: 'Druk 1 om te bevestigen dat u veilig bent. Druk 2 voor noodhulp.' };
  return { greeting: 'Hello. This is CLARA, your personal safety assistant from LifeLink Sync.', noResponse: 'No response received. Alerting your emergency contacts now.', pressPrompt: 'Press 1 to confirm you are safe. Press 2 to trigger emergency response.' };
}

// ─────────────────────────────────────
// DISPLAY HELPERS
// ─────────────────────────────────────

export const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  nl: '🇳🇱',
};

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Español',
  nl: 'Nederlands',
};
