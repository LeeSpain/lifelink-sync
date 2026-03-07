import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Privacy Policy for LifeLink Sync
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Last Updated: February 27, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {/* Introduction */}
          <section id="introduction" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="mb-4">
              LifeLink Sync ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our emergency response platform.
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 mb-4">
              <p className="font-semibold mb-2">IMPORTANT: LifeLink Sync is an emergency assistance platform.</p>
              <p className="text-sm">By using our service, you understand that:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>Emergency information may be shared with emergency services and your designated contacts</li>
                <li>Location data is critical for emergency response</li>
                <li>Time is critical in emergencies - we prioritize rapid response over extensive consent processes</li>
              </ul>
            </div>
          </section>

          {/* Information We Collect */}
          <section id="information-collection" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
              <li><strong>Profile Information:</strong> Date of birth, medical information (optional), allergies, medications</li>
              <li><strong>Emergency Contacts:</strong> Names, phone numbers, email addresses, relationships</li>
              <li><strong>Location Data:</strong> GPS coordinates, address information during emergencies</li>
              <li><strong>Communication Data:</strong> Messages, voice call recordings, chat transcripts</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Device Information:</strong> Device type, operating system, browser type</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
              <li><strong>Location Data:</strong> Real-time location during emergency activations</li>
              <li><strong>Call Data:</strong> Call duration, participants, timestamps</li>
              <li><strong>Technical Data:</strong> IP address, cookies, log files</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section id="information-use" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>

            <h3 className="text-xl font-semibold mb-3">3.1 Emergency Response</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Notify your emergency contacts immediately</li>
              <li>Share your location with responders</li>
              <li>Coordinate emergency assistance</li>
              <li>Record emergency calls for quality assurance</li>
              <li>Provide context to emergency coordinators (AI and human)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.2 Service Operations</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Create and manage your account</li>
              <li>Process payments and subscriptions</li>
              <li>Send service-related notifications</li>
              <li>Provide customer support</li>
              <li>Improve our platform and develop new features</li>
            </ul>
          </section>

          {/* How We Share Your Information */}
          <section id="information-sharing" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. How We Share Your Information</h2>

            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
              <h3 className="text-xl font-semibold mb-2">4.1 Emergency Situations</h3>
              <p className="mb-2">When you activate emergency services, we immediately share:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your name and contact information</li>
                <li>Your current location (GPS coordinates and address)</li>
                <li>Your medical information (if provided)</li>
                <li>Your emergency contacts</li>
              </ul>
              <p className="mt-3 font-semibold">Recipients may include:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your designated emergency contacts</li>
                <li>Emergency services (911, 112, etc.) if you request</li>
                <li>Our AI coordinator (Clara) for emergency coordination</li>
                <li>Emergency dispatch centers</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3">4.2 Service Providers</h3>
            <p className="mb-2">We share information with trusted third-party providers:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Twilio:</strong> For voice calls and SMS messaging</li>
              <li><strong>OpenAI:</strong> For AI coordination (anonymized when possible)</li>
              <li><strong>Supabase:</strong> For secure data storage</li>
              <li><strong>Payment processors:</strong> For subscription management</li>
              <li><strong>Analytics providers:</strong> For platform improvement</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section id="data-retention" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Data Retention</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Account Data:</strong> Retained while your account is active + 7 years after deletion</li>
              <li><strong>Emergency Records:</strong> Retained for 7 years for legal and safety purposes</li>
              <li><strong>Call Recordings:</strong> Retained for 90 days for quality assurance</li>
              <li><strong>Location Data:</strong> Retained for 30 days after emergency incidents</li>
              <li><strong>Analytics Data:</strong> Aggregated data retained indefinitely</li>
            </ul>
            <p className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
              <strong>You can request data deletion</strong> by contacting{' '}
              <a href="mailto:privacy@lifelink-sync.com" className="text-blue-600 dark:text-blue-400 underline">
                privacy@lifelink-sync.com
              </a>
              . Note that some data must be retained for legal compliance.
            </p>
          </section>

          {/* Your Rights */}
          <section id="your-rights" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Your Rights (GDPR & CCPA)</h2>

            <h3 className="text-xl font-semibold mb-3">6.1 Access and Portability</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Request a copy of your personal data</li>
              <li>Download your data in a portable format</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">6.2 Correction and Deletion</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data (subject to legal retention requirements)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">6.3 Consent and Objection</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Withdraw consent for marketing communications</li>
              <li>Object to processing based on legitimate interests</li>
              <li>Opt-out of data sales (we do not sell your data)</li>
            </ul>

            <p className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4">
              <strong>To exercise your rights:</strong> Contact{' '}
              <a href="mailto:privacy@lifelink-sync.com" className="text-green-600 dark:text-green-400 underline">
                privacy@lifelink-sync.com
              </a>{' '}
              or use the settings in your account.
            </p>
          </section>

          {/* Security Measures */}
          <section id="security" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Security Measures</h2>
            <p className="mb-3">We implement industry-standard security measures:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Encryption:</strong> All data encrypted in transit (TLS/SSL) and at rest (AES-256)</li>
              <li><strong>Access Controls:</strong> Role-based access to sensitive information</li>
              <li><strong>Authentication:</strong> Multi-factor authentication available</li>
              <li><strong>Monitoring:</strong> 24/7 security monitoring and alerts</li>
              <li><strong>Audits:</strong> Regular security audits and penetration testing</li>
            </ul>
            <p className="italic text-gray-600 dark:text-gray-400">
              However, no system is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          {/* AI and Automated Decision Making */}
          <section id="ai-systems" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. AI and Automated Decision Making</h2>

            <h3 className="text-xl font-semibold mb-3">8.1 Clara AI Coordinator</h3>
            <p className="mb-2">Our AI coordinator (Clara) processes your emergency data to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Coordinate emergency response</li>
              <li>Capture responder confirmations and ETAs</li>
              <li>Reference your interaction history for personalization</li>
            </ul>
            <p className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4">
              <strong>Human Oversight:</strong> Clara's actions are logged and can be reviewed by human operators.
            </p>
          </section>

          {/* Contact Us */}
          <section id="contact" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Privacy Questions or Concerns:</h3>
                <ul className="space-y-1 text-sm">
                  <li>Email: <a href="mailto:privacy@lifelink-sync.com" className="text-blue-600 dark:text-blue-400 underline">privacy@lifelink-sync.com</a></li>
                  <li>Response Time: We aim to respond within 30 days</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">California Residents (CCPA):</h3>
                <p className="text-sm">California residents have additional rights including right to know, deletion, and non-discrimination.</p>
                <p className="text-sm mt-1">Contact: <a href="mailto:privacy@lifelink-sync.com" className="text-blue-600 dark:text-blue-400 underline">privacy@lifelink-sync.com</a></p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">European Union (GDPR):</h3>
                <p className="text-sm">EU residents have rights under GDPR including access, rectification, erasure, and data portability.</p>
                <p className="text-sm mt-1">Contact: <a href="mailto:dpo@lifelink-sync.com" className="text-blue-600 dark:text-blue-400 underline">dpo@lifelink-sync.com</a></p>
              </div>
            </div>
          </section>

          {/* Emergency Disclosure Notice */}
          <section id="emergency-disclosure" className="mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-red-900 dark:text-red-100">
                Emergency Disclosure Notice
              </h2>
              <p className="font-semibold mb-3">
                IMPORTANT: In life-threatening emergencies, we may disclose your information to emergency services, medical personnel, or law enforcement WITHOUT your explicit consent to protect your life and safety.
              </p>
              <p className="text-sm">
                This is necessary for our legitimate interest in preserving life. By using LifeLink Sync, you acknowledge and consent to this emergency disclosure practice.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">
              <strong>LifeLink Sync is committed to transparency and protecting your privacy while ensuring effective emergency response.</strong>
            </p>
            <p>© 2026 LifeLink Sync. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
