-- Replace all old ICE SOS plans with correct LifeLink Sync plans
-- This deletes ALL existing plans and inserts the correct ones

DELETE FROM subscription_plans;

INSERT INTO subscription_plans
  (name, description, price, currency, billing_interval, is_active, features, is_popular, sort_order)
VALUES
(
  'Individual Plan',
  'Complete emergency protection with CLARA AI, instant SOS alerts, GPS tracking and 1 Family Link included free.',
  9.99,
  'EUR',
  'month',
  true,
  '["CLARA AI 24/7 assistant","App SOS button","Bluetooth pendant support","Voice activation emergency trigger","Live GPS location sharing","Family circle notifications","Medical profile for first responders","Conference bridge","Instant callback","1 Family Link included free","7-day free trial included"]'::jsonb,
  true,
  1
),
(
  'Extra Family Link',
  'Add another family member to your protection circle.',
  2.99,
  'EUR',
  'month',
  true,
  '["Full family circle access","Real-time emergency alerts","Live GPS location updates","CLARA AI notifications","Wellbeing report access"]'::jsonb,
  false,
  2
),
(
  'Daily Wellbeing Add-On',
  'CLARA makes daily check-in calls, tracks mood, sleep and pain levels, and sends a digest to your family circle.',
  2.99,
  'EUR',
  'month',
  true,
  '["Daily CLARA check-in call","Mood, sleep and pain tracking","Family digest report","Safety check-in included","Wellbeing history timeline"]'::jsonb,
  false,
  3
),
(
  'Medication Reminder Add-On',
  'CLARA reminds you to take medication based on your profile, logs confirmation and notifies family if a dose is missed.',
  2.99,
  'EUR',
  'month',
  true,
  '["AI medication reminders","Dose confirmation logging","Family notification if missed","Medication schedule management","Integrated with medical profile"]'::jsonb,
  false,
  4
);
