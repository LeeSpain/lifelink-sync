// Bilingual Quick Notifications Library
// EN/ES templates with placeholder support

export interface NotificationTemplate {
  key: string;
  en: string;
  es: string;
  placeholders?: string[];
}

export const QUICK_NOTIFICATIONS: NotificationTemplate[] = [
  {
    key: 'emergency_services_contacted',
    en: 'Emergency services have been contacted for {client_first}. Location: {location}',
    es: 'Se ha contactado con los servicios de emergencia para {client_first}. Ubicación: {location}',
    placeholders: ['client_first', 'location']
  },
  {
    key: 'operator_responding',
    en: 'Our emergency operator is responding to {client_first}\'s alert. We will keep you updated.',
    es: 'Nuestro operador de emergencias está respondiendo a la alerta de {client_first}. Te mantendremos informado.',
    placeholders: ['client_first']
  },
  {
    key: 'false_alarm_confirmed',
    en: '{client_first} has confirmed this was a false alarm. No further action needed.',
    es: '{client_first} ha confirmado que fue una falsa alarma. No se necesita más acción.',
    placeholders: ['client_first']
  },
  {
    key: 'medical_assistance_dispatched',
    en: 'Medical assistance has been dispatched to {client_first} at {location}. ETA: {eta}',
    es: 'Se ha enviado asistencia médica a {client_first} en {location}. Tiempo estimado: {eta}',
    placeholders: ['client_first', 'location', 'eta']
  },
  {
    key: 'contact_primary_success',
    en: 'We have successfully contacted {contact_name}. They are aware of the situation.',
    es: 'Hemos contactado exitosamente con {contact_name}. Están al tanto de la situación.',
    placeholders: ['contact_name']
  },
  {
    key: 'en_route_hospital',
    en: '{client_first} is being transported to {hospital}. We will update you on arrival.',
    es: '{client_first} está siendo transportado a {hospital}. Te actualizaremos al llegar.',
    placeholders: ['client_first', 'hospital']
  },
  {
    key: 'situation_resolved',
    en: 'The situation with {client_first} has been resolved. All emergency contacts have been notified.',
    es: 'La situación con {client_first} ha sido resuelta. Todos los contactos de emergencia han sido notificados.',
    placeholders: ['client_first']
  },
  {
    key: 'advice_given',
    en: 'Emergency advice has been provided to {client_first}. Situation is being monitored.',
    es: 'Se ha proporcionado consejo de emergencia a {client_first}. La situación está siendo monitoreada.',
    placeholders: ['client_first']
  },
  {
    key: 'escalating_to_112',
    en: 'Escalating to 112 emergency services for {client_first}. Location confirmed: {location}',
    es: 'Escalando a servicios de emergencia 112 para {client_first}. Ubicación confirmada: {location}',
    placeholders: ['client_first', 'location']
  },
  {
    key: 'family_member_en_route',
    en: '{family_member} is on their way to assist {client_first}. ETA: {eta}',
    es: '{family_member} está en camino para ayudar a {client_first}. Tiempo estimado: {eta}',
    placeholders: ['family_member', 'client_first', 'eta']
  }
];

export interface TemplateVariables {
  client_first?: string;
  location?: string;
  contact_name?: string;
  hospital?: string;
  eta?: string;
  family_member?: string;
  [key: string]: string | undefined;
}

export function fillTemplate(
  template: string,
  variables: TemplateVariables
): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
  });
  
  return result;
}

export function getNotificationTemplate(
  key: string,
  language: 'en' | 'es' = 'en'
): string | null {
  const template = QUICK_NOTIFICATIONS.find(t => t.key === key);
  if (!template) return null;
  
  return template[language];
}

export function renderNotification(
  key: string,
  variables: TemplateVariables,
  language: 'en' | 'es' = 'en'
): string | null {
  const template = getNotificationTemplate(key, language);
  if (!template) return null;
  
  return fillTemplate(template, variables);
}

// Helper to get all available notification keys
export function getAvailableNotificationKeys(): string[] {
  return QUICK_NOTIFICATIONS.map(t => t.key);
}

// Helper to get placeholders for a notification
export function getNotificationPlaceholders(key: string): string[] {
  const template = QUICK_NOTIFICATIONS.find(t => t.key === key);
  return template?.placeholders || [];
}