-- Insert new comprehensive email automation sequences

-- 1. Welcome Series (Multi-step)
INSERT INTO email_automation_settings (name, description, trigger_type, trigger_config, email_template, is_enabled, recipient_filter) VALUES
('Welcome Series - Day 1', 'Immediate welcome email with setup guide', 'user_signup', '{"delay_minutes": 0}', 'welcome_day1', true, 'all'),
('Welcome Series - Day 3', 'Follow-up with safety tips', 'user_signup', '{"delay_hours": 72}', 'welcome_day3', true, 'all'),
('Welcome Series - Day 7', 'One week check-in and feature highlights', 'user_signup', '{"delay_hours": 168}', 'welcome_day7', true, 'all');

-- 2. Onboarding Completion
INSERT INTO email_automation_settings (name, description, trigger_type, trigger_config, email_template, is_enabled, recipient_filter) VALUES
('Profile Completion - 24h', 'Reminder to complete profile after 24 hours', 'profile_incomplete', '{"delay_hours": 24, "check_fields": ["emergency_contacts", "medical_conditions"]}', 'profile_reminder_24h', true, 'all'),
('Profile Completion - 72h', 'Second reminder to complete profile', 'profile_incomplete', '{"delay_hours": 72, "check_fields": ["emergency_contacts", "medical_conditions"]}', 'profile_reminder_72h', true, 'all'),
('Profile Completion - Success', 'Congratulations on completing profile', 'profile_completed', '{"delay_minutes": 0}', 'profile_completed', true, 'all');

-- 3. Engagement & Safety
INSERT INTO email_automation_settings (name, description, trigger_type, trigger_config, email_template, is_enabled, recipient_filter) VALUES
('Monthly Safety Tips', 'Monthly newsletter with safety tips', 'scheduled_monthly', '{"day_of_month": 1, "hour": 9}', 'monthly_safety_tips', true, 'active_users'),
('Emergency Contact Verification', 'Quarterly reminder to verify emergency contacts', 'scheduled_quarterly', '{"month_offset": 0, "day": 15, "hour": 10}', 'contact_verification', true, 'all'),
('Safety Equipment Check', 'Bi-annual reminder to check safety equipment', 'scheduled_biannual', '{"months": [3, 9], "day": 1, "hour": 9}', 'equipment_check', true, 'product_owners');

-- 4. Retention & Re-engagement
INSERT INTO email_automation_settings (name, description, trigger_type, trigger_config, email_template, is_enabled, recipient_filter) VALUES
('Inactive User - 30 days', 'Re-engagement email for 30-day inactive users', 'user_inactive', '{"inactive_days": 30}', 'reengagement_30d', true, 'inactive_users'),
('Inactive User - 90 days', 'Final re-engagement attempt for 90-day inactive users', 'user_inactive', '{"inactive_days": 90}', 'reengagement_90d', true, 'inactive_users'),
('Win-back Offer', 'Special offer for users inactive over 6 months', 'user_inactive', '{"inactive_days": 180}', 'winback_offer', false, 'inactive_users');

-- 5. Subscription & Billing
INSERT INTO email_automation_settings (name, description, trigger_type, trigger_config, email_template, is_enabled, recipient_filter) VALUES
('Subscription Renewal - 7 days', 'Subscription renewal reminder 7 days before', 'subscription_expiring', '{"days_before": 7}', 'renewal_reminder_7d', true, 'subscribers'),
('Subscription Renewal - 1 day', 'Final subscription renewal reminder', 'subscription_expiring', '{"days_before": 1}', 'renewal_reminder_1d', true, 'subscribers'),
('Subscription Expired', 'Subscription expired notification', 'subscription_expired', '{"delay_hours": 0}', 'subscription_expired', true, 'expired_subscribers'),
('Payment Failed', 'Payment failure notification and retry instructions', 'payment_failed', '{"delay_minutes": 30}', 'payment_failed', true, 'subscribers');

-- 6. Emergency & Safety Events
INSERT INTO email_automation_settings (name, description, trigger_type, trigger_config, email_template, is_enabled, recipient_filter) VALUES
('SOS Follow-up', 'Follow-up email after SOS activation', 'sos_activated', '{"delay_hours": 24}', 'sos_followup', true, 'all'),
('Safety Drill Reminder', 'Monthly safety drill reminder', 'scheduled_monthly', '{"day_of_month": 15, "hour": 14}', 'safety_drill', true, 'active_users'),
('Emergency Contact Added', 'Confirmation when emergency contact is added', 'emergency_contact_added', '{"delay_minutes": 5}', 'contact_added_confirmation', true, 'all');

-- 7. Family & Care Features
INSERT INTO email_automation_settings (name, description, trigger_type, trigger_config, email_template, is_enabled, recipient_filter) VALUES
('Family Invite Sent', 'Confirmation email when family invite is sent', 'family_invite_sent', '{"delay_minutes": 0}', 'family_invite_confirmation', true, 'all'),
('Family Member Joined', 'Notification when family member accepts invite', 'family_member_joined', '{"delay_minutes": 0}', 'family_member_joined', true, 'all'),
('Carer Access Granted', 'Notification when carer access is granted', 'carer_access_granted', '{"delay_minutes": 0}', 'carer_access_notification', true, 'all');

-- Create comprehensive email templates
INSERT INTO email_templates (name, description, subject_template, body_template, template_type, variables) VALUES
('welcome_day1', 'Day 1 welcome email with setup guide', '🛡️ Welcome to ICE SOS - Your Safety Network Starts Now!', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #1f2937; text-align: center;">Welcome to ICE SOS!</h1>
  <p>Hi {{first_name}},</p>
  <p>Welcome to ICE SOS - your personal safety network is now active! We''re thrilled to have you join our community dedicated to keeping you and your loved ones safe.</p>
  
  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #059669; margin-top: 0;">🚀 Get Started in 3 Simple Steps:</h3>
    <ol style="line-height: 1.8;">
      <li><strong>Complete Your Profile:</strong> Add your emergency contacts and medical information</li>
      <li><strong>Download Our App:</strong> Install the ICE SOS mobile app for on-the-go protection</li>
      <li><strong>Test Your Setup:</strong> Familiarize yourself with the SOS features</li>
    </ol>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_url}}" style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Your Dashboard</a>
  </div>
  
  <p>Questions? Our support team is here to help at support@icesosglobal.com</p>
  <p>Stay safe,<br>The ICE SOS Team</p>
</div>', 'automation', '["first_name", "dashboard_url"]'),

('welcome_day3', 'Day 3 follow-up with safety tips', '🔒 Your ICE SOS Safety Tips - Day 3', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #1f2937; text-align: center;">Essential Safety Tips</h1>
  <p>Hi {{first_name}},</p>
  <p>How are you finding ICE SOS so far? Here are some essential safety tips to maximize your protection:</p>
  
  <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
    <h3 style="color: #92400e; margin-top: 0;">💡 Pro Safety Tips:</h3>
    <ul style="line-height: 1.8;">
      <li>Keep your emergency contacts updated and verify they can receive calls</li>
      <li>Share your location preferences with trusted family members</li>
      <li>Practice using the SOS button in a safe environment</li>
      <li>Keep your medical information current, especially medications</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_url}}/profile" style="background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Update Your Profile</a>
  </div>
  
  <p>Remember: Your safety network is only as strong as the information you provide!</p>
  <p>Best regards,<br>The ICE SOS Team</p>
</div>', 'automation', '["first_name", "dashboard_url"]'),

('welcome_day7', 'Day 7 check-in with feature highlights', '🌟 Week 1 Complete - Discover ICE SOS Features', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #1f2937; text-align: center;">You''ve Made it Through Your First Week!</h1>
  <p>Hi {{first_name}},</p>
  <p>Congratulations on completing your first week with ICE SOS! Let''s explore some powerful features you might have missed:</p>
  
  <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #1d4ed8; margin-top: 0;">🚀 Advanced Features:</h3>
    <div style="display: grid; gap: 15px;">
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <h4 style="margin: 0 0 10px 0; color: #1f2937;">Family Dashboard</h4>
        <p style="margin: 0; color: #6b7280;">Invite family members to access your safety information securely</p>
      </div>
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <h4 style="margin: 0 0 10px 0; color: #1f2937;">Location Sharing</h4>
        <p style="margin: 0; color: #6b7280;">Share your real-time location during emergencies</p>
      </div>
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <h4 style="margin: 0 0 10px 0; color: #1f2937;">Medical Information</h4>
        <p style="margin: 0; color: #6b7280;">Store critical medical details for first responders</p>
      </div>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_url}}/features" style="background: #7C3AED; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Explore Features</a>
  </div>
  
  <p>We''re here to support you every step of the way. Feel free to reach out with any questions!</p>
  <p>Stay protected,<br>The ICE SOS Team</p>
</div>', 'automation', '["first_name", "dashboard_url"]'),

('monthly_safety_tips', 'Monthly safety newsletter', '🛡️ Monthly Safety Tips from ICE SOS', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #1f2937; text-align: center;">Monthly Safety Newsletter</h1>
  <p>Hi {{first_name}},</p>
  <p>Here are this month''s essential safety tips to keep you and your family protected:</p>
  
  <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
    <h3 style="color: #166534; margin-top: 0;">🌟 This Month''s Focus: Emergency Preparedness</h3>
    <ul style="line-height: 1.8;">
      <li><strong>Home Safety Kit:</strong> Check your emergency supplies - water, flashlight, first aid</li>
      <li><strong>Communication Plan:</strong> Ensure all family members know the emergency meeting point</li>
      <li><strong>Digital Safety:</strong> Backup important documents to secure cloud storage</li>
      <li><strong>Health Updates:</strong> Review and update medical information in your ICE SOS profile</li>
    </ul>
  </div>
  
  <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; color: #991b1b;"><strong>⚡ Quick Reminder:</strong> Test your SOS button functionality monthly to ensure it''s working properly.</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_url}}/safety-tips" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">More Safety Resources</a>
  </div>
  
  <p>Stay safe and prepared!</p>
  <p>The ICE SOS Safety Team</p>
</div>', 'automation', '["first_name", "dashboard_url"]'),

('reengagement_30d', '30-day inactive user re-engagement', '😊 We Miss You at ICE SOS', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #1f2937; text-align: center;">We Miss You!</h1>
  <p>Hi {{first_name}},</p>
  <p>We noticed you haven''t been active on ICE SOS lately. Your safety is important to us, and we want to make sure you''re getting the most out of your account.</p>
  
  <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #92400e; margin-top: 0;">🔄 What''s New Since You''ve Been Away:</h3>
    <ul style="line-height: 1.8;">
      <li>Enhanced family sharing features</li>
      <li>Improved emergency response times</li>
      <li>New mobile app updates</li>
      <li>Additional safety resources and tips</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_url}}" style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Welcome Back</a>
  </div>
  
  <p>If you''re having any issues or need help, our support team is here for you at support@icesosglobal.com</p>
  <p>We hope to see you back soon!</p>
  <p>The ICE SOS Team</p>
</div>', 'automation', '["first_name", "dashboard_url"]'),

('sos_followup', 'Follow-up after SOS activation', '🚨 ICE SOS Follow-up - We''re Here for You', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #1f2937; text-align: center;">We''re Checking In On You</h1>
  <p>Hi {{first_name}},</p>
  <p>We wanted to follow up after your recent SOS activation. Your safety and well-being are our top priority.</p>
  
  <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #1d4ed8; margin-top: 0;">💙 How Are You Doing?</h3>
    <p>We hope everything is okay now. If you need any additional support or have feedback about your experience, please don''t hesitate to reach out.</p>
  </div>
  
  <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #166534; margin-top: 0;">📋 Post-Incident Checklist:</h3>
    <ul style="line-height: 1.8;">
      <li>Review and update your emergency contacts if needed</li>
      <li>Check that your medical information is current</li>
      <li>Consider if any safety procedures need adjustment</li>
      <li>Share feedback to help us improve our service</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_url}}/support" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Contact Support</a>
  </div>
  
  <p>Remember, we''re here 24/7 for any emergency. Stay safe!</p>
  <p>With care,<br>The ICE SOS Response Team</p>
</div>', 'automation', '["first_name", "dashboard_url"]');