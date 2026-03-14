-- CLARA Training Data: Gift Subscriptions
-- Helps CLARA answer questions about gift purchases and redemption

INSERT INTO training_data (category, question, answer, is_active) VALUES
(
  'billing',
  'How do gift subscriptions work?',
  'LifeLink Sync offers 4 gift packages: Monthly Gift (€9.99 for 1 month), Annual Gift (€99.90 for 12 months), Bundle with ICE SOS Pendant (€149.00 for 12 months plus the pendant device), and a flexible Gift Voucher (default €99.90). The purchaser pays once — no recurring charges. The recipient receives an email with a redemption code to activate their gift. No credit card is needed to redeem.',
  true
),
(
  'billing',
  'How do I redeem a gift code?',
  'To redeem a LifeLink Sync gift: 1) Visit lifelink-sync.com/gift/redeem or click the "Activate Your Gift" button in your gift email. 2) Enter your redemption code (format: LL-XXXX-XXXX-XXXX). 3) Create an account or log in. 4) Accept the GDPR consent. 5) Your subscription activates immediately — no credit card needed!',
  true
),
(
  'billing',
  'Can I gift LifeLink to someone in another country?',
  'Yes! LifeLink Sync gifts work across all our supported markets — Spain, United Kingdom, and the Netherlands. The recipient just needs an email address to receive and redeem their gift. The gift email and redemption page are available in English, Spanish, and Dutch.',
  true
),
(
  'billing',
  'What happens when a gift subscription expires?',
  'When your gifted subscription period ends, you will be notified in advance. You can then choose to subscribe on your own to continue your protection, or your account will revert to limited access. Your emergency contacts and medical information are preserved so you can reactivate anytime.',
  true
),
(
  'billing',
  'Can I get a refund on a gift subscription?',
  'Gift subscriptions can be refunded if the gift has not yet been redeemed by the recipient. Once a gift code has been activated, refunds are not available as the subscription has already been provisioned. If you need help, contact support@lifelink-sync.com.',
  true
);
