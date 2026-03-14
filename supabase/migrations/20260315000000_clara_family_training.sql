-- ── CLARA training data: Family Seats billing knowledge ──────────
-- Adds Q&A rows so CLARA can answer family billing questions

INSERT INTO public.training_data (question, answer, category, status, audience, tags, confidence_score)
VALUES

('How does family billing work?',
 'Your Individual Plan (€9.99/month) includes one free Family Link. Each extra family member is €2.99/month. You choose who pays — either you cover their seat (owner-paid) or they create their own subscription (self-paid). You can manage everything from your Family dashboard.',
 'pricing', 'active', 'customer', '{"family","billing","seats"}', 1.0),

('How do I add a family member?',
 'Go to your dashboard, open the Family tab, and tap "Invite Family." Enter their name, email, phone, and relationship. Choose whether you pay for their seat or they pay themselves. They will receive an email invitation with a link to join your family circle.',
 'family', 'active', 'customer', '{"family","invite","add-member"}', 1.0),

('How do I remove a family member?',
 'In your Family dashboard, find the member you want to remove and tap the remove icon. Confirm the action. Their seat will be cancelled immediately and they will lose access to your family circle. If you were paying for their seat, the charge stops at the next billing cycle.',
 'family', 'active', 'customer', '{"family","remove","cancel-seat"}', 1.0),

('What does the first free seat mean?',
 'Every Individual Plan includes one free Family Link — that means your first family member costs nothing extra. From the second member onwards, each additional seat is €2.99/month. This applies whether you pay for them or they pay for themselves.',
 'pricing', 'active', 'customer', '{"family","free-seat","pricing"}', 1.0),

('Can family members pay for themselves?',
 'Yes — when you invite someone, you choose the billing type. "Owner-paid" means the seat appears on your bill. "Self-paid" means they get a separate payment link and manage their own subscription. Either way, they get the same family access: SOS alerts, live map, and emergency coordination.',
 'pricing', 'active', 'customer', '{"family","self-paid","billing-type"}', 1.0)

ON CONFLICT DO NOTHING;
