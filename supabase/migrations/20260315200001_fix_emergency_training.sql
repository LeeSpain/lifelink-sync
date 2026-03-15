-- Fix emergency training data: remove any implication that LifeLink calls emergency services
-- Also add explicit Q&A about emergency services

UPDATE training_data
SET answer = REPLACE(
  answer,
  'automated phone calls',
  'instant alerts to your family circle'
)
WHERE answer ILIKE '%automated phone calls%';

UPDATE training_data
SET answer = REPLACE(
  answer,
  'calling emergency services',
  'alerting your family circle'
)
WHERE answer ILIKE '%calling emergency services%'
  AND answer NOT ILIKE '%call 112%'
  AND answer NOT ILIKE '%call 999%';

INSERT INTO training_data
  (question, answer, category, is_active)
VALUES (
  'Do you call 999 or 112 for me?',
  'No — LifeLink Sync never calls emergency services on your behalf. In any emergency, always call 112 (Spain/Netherlands) or 999 (UK) yourself first. What we do is instantly alert your family circle with your GPS location, coordinate your family response in real time, and make sure the people who love you know exactly what is happening and where you are. We support the emergency response — we never replace calling the services yourself.',
  'emergency',
  true
),
(
  'Will you contact the ambulance?',
  'No — we never contact emergency services directly. Always call 112 or 999 yourself immediately. LifeLink Sync makes sure your family is alerted instantly and has your exact location — so they can coordinate and support you while you wait for help.',
  'emergency',
  true
);
