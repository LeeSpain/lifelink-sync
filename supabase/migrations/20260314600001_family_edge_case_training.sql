-- CLARA training data for family seat edge cases
INSERT INTO public.training_data (question, answer, category, status, audience, tags, confidence_score) VALUES
('What happens if the person who pays for my CLARA stops paying?',
 'If the billing owner''s payment fails, your CLARA access may be temporarily suspended. You will see a notification in your dashboard. The owner has a grace period to update their payment details. If the payment is not resolved, you can start your own Individual Plan at 9.99 EUR/month to keep your protection active.',
 'billing', 'active', 'customer', '{"family","billing","payment-failure"}', 1.0),
('Can I leave a family plan?',
 'Yes, you can leave a family circle anytime from your dashboard. Your personal data and CLARA conversation history will be preserved. After leaving, you can start your own Individual Plan if you want to keep your emergency protection active. The family circle owner will be notified that you have left.',
 'family', 'active', 'customer', '{"family","leave","plan"}', 1.0),
('What if my invite link expired?',
 'Family invite links are valid for 7 days. If yours has expired, simply ask the person who invited you to resend the invitation from their dashboard. They can do this with one click and you will receive a fresh link by email.',
 'family', 'active', 'customer', '{"family","invite","expired"}', 1.0)
ON CONFLICT DO NOTHING;
