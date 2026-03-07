import React from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TermsOfService: React.FC = () => {
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
            Terms of Service for LifeLink Sync
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Last Updated: February 27, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {/* Critical Notice */}
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold mb-2 text-red-900 dark:text-red-100">CRITICAL NOTICE</h2>
                <p className="font-semibold mb-2">
                  LifeLink Sync is a supplementary emergency coordination platform. It is NOT a replacement for official emergency services (911, 112, etc.).
                </p>
                <p className="text-sm">
                  In life-threatening emergencies, <strong>always call official emergency services first</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Acceptance of Terms */}
          <section id="acceptance" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using LifeLink Sync ("Service," "Platform," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          {/* Service Description */}
          <section id="service-description" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Service Description</h2>

            <h3 className="text-xl font-semibold mb-3">LifeLink Sync provides:</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Emergency alert system to notify your designated contacts</li>
              <li>Conference calling to coordinate emergency response</li>
              <li>AI-powered emergency coordination (Clara)</li>
              <li>Location sharing during emergencies</li>
              <li>Instant callback system for sales inquiries</li>
              <li>Emergency contact management</li>
            </ul>

            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4">
              <h3 className="font-semibold mb-2">The Service does NOT:</h3>
              <ul className="space-y-1 text-sm">
                <li>✗ Dispatch official emergency services directly</li>
                <li>✗ Replace 911/112 or other emergency numbers</li>
                <li>✗ Provide medical, legal, or professional advice</li>
                <li>✗ Guarantee response from your contacts</li>
              </ul>
            </div>
          </section>

          {/* Emergency Services - Critical Terms */}
          <section id="emergency-services" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. Emergency Services - Critical Terms</h2>

            <h3 className="text-xl font-semibold mb-3">3.1 How It Works</h3>
            <p className="mb-2">When you activate emergency SOS:</p>
            <ol className="list-decimal pl-6 mb-4 space-y-2">
              <li>Your emergency contacts are immediately notified</li>
              <li>A conference call may be initiated</li>
              <li>Clara (AI coordinator) may join to assist</li>
              <li>Your location is shared with contacts</li>
              <li className="font-bold text-red-600 dark:text-red-400">Emergency services (911/112) are NOT automatically called</li>
            </ol>

            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
              <h3 className="text-xl font-semibold mb-3">3.2 Your Responsibilities</h3>

              <p className="font-bold mb-2">YOU MUST:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Keep emergency contact information current</li>
                <li>Test the system periodically</li>
                <li>Ensure contacts know they're listed</li>
                <li className="font-bold">Call 911/112 directly in life-threatening emergencies</li>
                <li>Verify your phone number is correct</li>
              </ul>

              <p className="font-bold mb-2">DO NOT:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Rely solely on LifeLink Sync in true emergencies</li>
                <li>Use the Service for non-emergency situations</li>
                <li>Abuse the emergency alert system</li>
                <li>Provide false emergency information</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3">3.3 Limitations and Disclaimers</h3>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <p className="font-bold mb-2">WE DO NOT GUARANTEE:</p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Your contacts will answer</li>
                <li>Calls will connect successfully</li>
                <li>Location accuracy</li>
                <li>Service availability (network outages, etc.)</li>
                <li>Emergency response times</li>
                <li>AI coordinator performance</li>
              </ul>
            </div>
          </section>

          {/* AI Coordinator (Clara) */}
          <section id="clara-ai" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. AI Coordinator (Clara)</h2>

            <h3 className="text-xl font-semibold mb-3">4.1 Clara's Role</h3>
            <p className="mb-2">Clara is an AI-powered coordinator that:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Joins emergency conferences</li>
              <li>Greets and coordinates responders</li>
              <li>Captures confirmations and ETAs</li>
              <li>Shares updates among participants</li>
              <li>Has memory of your past interactions</li>
            </ul>

            <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4">
              <h3 className="text-xl font-semibold mb-2">4.2 Clara Limitations</h3>
              <p className="font-semibold mb-2">Clara is AI software and may:</p>
              <ul className="list-disc pl-6 mb-3 space-y-1 text-sm">
                <li>Make mistakes or misunderstand speech</li>
                <li>Fail to capture important information</li>
                <li>Experience technical issues</li>
                <li>Not understand all languages or accents</li>
              </ul>
              <p className="font-semibold">Clara is NOT:</p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>A medical professional</li>
                <li>A legal advisor</li>
                <li>An official emergency dispatcher</li>
                <li>Infallible or perfect</li>
              </ul>
            </div>
          </section>

          {/* Payment and Subscriptions */}
          <section id="payment" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Payment and Subscriptions</h2>

            <h3 className="text-xl font-semibold mb-3">5.1 Pricing</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Free tier available with limitations</li>
              <li>Paid subscriptions for premium features</li>
              <li>Prices subject to change with 30-day notice</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">5.2 Billing</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Subscriptions auto-renew unless cancelled</li>
              <li>Payment processed through third-party providers</li>
              <li>You authorize recurring charges</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">5.3 Cancellation</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Cancel anytime through account settings</li>
              <li>Cancellation effective at end of billing period</li>
              <li>No refunds for unused time</li>
            </ul>
          </section>

          {/* Disclaimers and Limitations */}
          <section id="disclaimers" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Disclaimers and Limitations</h2>

            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-4">
              <h3 className="text-xl font-semibold mb-3">6.1 Service "AS IS"</h3>
              <p className="font-bold mb-2">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, INCLUDING:</p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>MERCHANTABILITY</li>
                <li>FITNESS FOR A PARTICULAR PURPOSE</li>
                <li>NON-INFRINGEMENT</li>
                <li>RELIABILITY</li>
                <li>AVAILABILITY</li>
                <li>ACCURACY</li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
              <h3 className="text-xl font-semibold mb-3">6.2 Limitation of Liability</h3>
              <p className="font-bold mb-2">TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE ARE NOT LIABLE FOR:</p>
              <ul className="list-disc pl-6 mb-3 space-y-1 text-sm">
                <li>Injury, death, or property damage resulting from emergency situations</li>
                <li>Failure to receive emergency assistance</li>
                <li>Inaccurate location information</li>
                <li>Service outages or technical failures</li>
                <li>Third-party actions or inactions</li>
                <li>Loss of data</li>
                <li>Indirect, incidental, or consequential damages</li>
              </ul>
              <p className="font-bold text-red-900 dark:text-red-100">
                MAXIMUM LIABILITY: Our total liability is limited to the amount you paid for the Service in the last 12 months, or $100, whichever is less.
              </p>
            </div>
          </section>

          {/* Indemnification */}
          <section id="indemnification" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify and hold harmless LifeLink Sync, its officers, directors, employees, and agents from any claims, damages, or expenses arising from:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of others' rights</li>
              <li>Your negligence or misconduct</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section id="governing-law" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Governing Law and Disputes</h2>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4">
              <h3 className="text-xl font-semibold mb-2">8.1 Arbitration Agreement</h3>
              <p className="font-semibold mb-2">
                IMPORTANT: YOU AND LifeLink Sync AGREE TO RESOLVE DISPUTES THROUGH BINDING ARBITRATION, NOT COURT LITIGATION.
              </p>
              <p className="text-sm">Exceptions:</p>
              <ul className="list-disc pl-6 text-sm space-y-1">
                <li>Small claims court (under $10,000)</li>
                <li>Intellectual property disputes</li>
                <li>Emergency injunctive relief</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3">8.2 Class Action Waiver</h3>
            <p className="mb-4">
              You agree to bring claims individually, not as part of a class action.
            </p>
          </section>

          {/* Contact Information */}
          <section id="contact" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Contact Information</h2>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Questions about Terms:</h3>
                <p className="text-sm">Email: <a href="mailto:legal@lifelink-sync.com" className="text-blue-600 dark:text-blue-400 underline">legal@lifelink-sync.com</a></p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Customer Support:</h3>
                <p className="text-sm">Email: <a href="mailto:support@lifelink-sync.com" className="text-blue-600 dark:text-blue-400 underline">support@lifelink-sync.com</a></p>
              </div>
            </div>
          </section>

          {/* Emergency Disclaimer */}
          <section id="emergency-disclaimer" className="mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-red-900 dark:text-red-100">
                    FINAL CRITICAL REMINDER
                  </h2>
                  <p className="font-semibold mb-3">
                    LifeLink Sync is a coordination tool, NOT a replacement for emergency services.
                  </p>
                  <div className="bg-white dark:bg-gray-900 rounded p-4 mb-3">
                    <p className="font-bold mb-2">IN A REAL EMERGENCY:</p>
                    <ol className="list-decimal pl-6 space-y-1 text-sm">
                      <li className="font-bold text-red-600 dark:text-red-400">CALL 911 (US) or 112 (EU) FIRST</li>
                      <li>Then use LifeLink Sync to notify your contacts</li>
                      <li>Do not delay calling official emergency services</li>
                    </ol>
                  </div>
                  <p className="font-bold text-lg">YOUR SAFETY IS YOUR RESPONSIBILITY.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Acceptance */}
          <section id="final-acceptance" className="mb-8">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
              <p className="mb-4">
                By clicking "I Agree" or using the Service, you acknowledge:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You have read and understand these Terms</li>
                <li>You agree to be bound by these Terms</li>
                <li>You understand LifeLink Sync is NOT a replacement for 911/112</li>
                <li>You will call official emergency services in real emergencies</li>
              </ul>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2 font-semibold">
              LifeLink Sync - Empowering emergency coordination, not replacing emergency services.
            </p>
            <p>© 2026 LifeLink Sync. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
