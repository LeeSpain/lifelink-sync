-- Referral Training Boost: 5 additional Q&A rows (total 9)
-- Covers: how it works, sharing, referral code, timing, lapse handling

INSERT INTO public.training_data (question, answer, category, status, audience, tags, confidence_score) VALUES
('How does the referral programme work?',
 'The LifeLink Sync 5-Star Referral Programme rewards you for sharing. You get a unique referral link (like lifelink-sync.com/join?ref=CLARAXXXX). When someone signs up through your link and becomes a paying subscriber, one of your 5 stars turns gold. When all 5 friends are active paying members at the same time, you earn 12 months of CLARA completely free — applied automatically to your next billing cycle. Track your progress in the Refer & Earn section of your dashboard.',
 'referral', 'active', 'customer', '{"referral","programme","how","stars"}', 1.0),
('How do I share my referral link?',
 'Go to your dashboard and tap Refer & Earn in the sidebar. You will see your unique referral link and code. You can share it three ways: tap Copy to copy the link to your clipboard, tap WhatsApp to send a pre-written message to a contact, or tap Email to open a ready-made email. Your referral code looks like CLARA followed by 4 characters, for example CLARA7XK.',
 'referral', 'active', 'customer', '{"referral","share","link","whatsapp","email"}', 1.0),
('What is my referral code?',
 'Your personal referral code is shown in the Refer & Earn section of your dashboard. It starts with CLARA followed by 4 unique characters, for example CLARA7XK. Your full referral link is lifelink-sync.com/join?ref= followed by your code. Anyone who signs up through that link is tracked as your referral.',
 'referral', 'active', 'customer', '{"referral","code","link","find"}', 1.0),
('When do I get my free year from referrals?',
 'Your free year is applied automatically when all 5 of your referred friends are active paying members at the same time. You do not need to do anything — the 12-month credit is added to your account on your next billing cycle. You can check your progress on the 5-star tracker in your dashboard under Refer & Earn. Each gold star represents one active referral.',
 'referral', 'active', 'customer', '{"referral","reward","free","year","when"}', 1.0),
('What happens if one of my referrals cancels?',
 'If a friend you referred cancels their subscription, their star reverts from gold back to silver. If you had already earned your free year, the reward pauses until you get a replacement referral. The good news is your friend can always re-subscribe, which would light their star back up again. You can also refer someone new to fill the spot. Your Refer & Earn dashboard always shows your current status.',
 'referral', 'active', 'customer', '{"referral","cancel","lapse","star","revert"}', 1.0)
ON CONFLICT DO NOTHING;
