-- CLARA Training Data: Extended Gift Q&A
-- Conversational gift queries covering buying, redeeming, and bundle details

INSERT INTO training_data (category, question, answer, is_active) VALUES
(
  'billing',
  'I want to buy CLARA as a gift for my mum',
  'That is a lovely idea! You can gift LifeLink Sync with CLARA protection to your mum in just a few clicks. Visit lifelink-sync.com/gift to choose from 4 gift packages: a 1-month gift (€9.99), a 12-month gift (€99.90 — most popular), a bundle with the ICE SOS Pendant (€149), or a flexible voucher. You can add a personal message and choose to send it now or schedule it for a special date. Your mum will receive a beautiful email with a one-click activation link. No credit card needed on her end — it is all paid for by you.',
  true
),
(
  'billing',
  'Can I buy a gift without having an account?',
  'Yes! You do not need a LifeLink Sync account to purchase a gift. Simply visit lifelink-sync.com/gift, choose your package, enter the recipient details and your email address, and complete the payment with Stripe. You will receive an order confirmation email with the redemption code. If you do have an account, your details will be pre-filled to make it even faster.',
  true
),
(
  'billing',
  'What is included in the gift bundle with the pendant?',
  'The Gift Bundle (€149) includes 12 months of full LifeLink Sync protection plus the ICE SOS Pendant device. The pendant features GPS tracking, a one-touch SOS button, 72-hour battery life, and is waterproof. It connects to the recipient''s smartphone for complete emergency protection. The subscription activates when the recipient redeems the gift code, and the pendant will be shipped to the address they provide during setup.',
  true
),
(
  'billing',
  'My gift code is not working',
  'I am sorry to hear that. Here are a few things to check: 1) Make sure the code is entered exactly as shown, in the format LL-XXXX-XXXX-XXXX. 2) Check that the gift has not already been redeemed — each code can only be used once. 3) Gift codes expire 12 months after purchase — check if the code is still valid. 4) Make sure you are logged in or have created an account before trying to redeem. If you are still having trouble, please contact support@lifelink-sync.com with your redemption code and we will help you right away.',
  true
);
