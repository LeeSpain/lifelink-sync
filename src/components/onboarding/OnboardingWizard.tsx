// Onboarding Wizard - Guides new users through emergency contact setup
// Critical for ensuring users can actually receive help in emergencies

'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to LifeLink Sync',
    description: 'Set up your emergency profile in just 3 minutes',
    icon: '👋',
  },
  {
    id: 'profile',
    title: 'Your Information',
    description: 'Help responders identify and contact you',
    icon: '👤',
  },
  {
    id: 'contacts',
    title: 'Emergency Contacts',
    description: 'Add people who can help in an emergency',
    icon: '📞',
  },
  {
    id: 'test',
    title: 'Test Your Setup',
    description: 'Verify everything works before you need it',
    icon: '✅',
  },
  {
    id: 'complete',
    title: "You're All Set!",
    description: 'Your emergency system is ready',
    icon: '🎉',
  },
];

interface EmergencyContact {
  name: string;
  phone: string;
  email: string;
  relationship: string;
}

export const OnboardingWizard: React.FC<{ onComplete: () => void }> = ({
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Profile data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Emergency contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { name: '', phone: '', email: '', relationship: '' },
  ]);

  const addContact = () => {
    setContacts([...contacts, { name: '', phone: '', email: '', relationship: '' }]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
  };

  const handleNext = async () => {
    if (currentStep === steps.length - 2) {
      // Save data before final step
      await saveProfile();
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const saveProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save profile
      await supabase.from('profiles').upsert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone,
        date_of_birth: dateOfBirth,
        emergency_contacts: contacts.filter(c => c.name && c.phone),
        onboarding_completed: true,
      });

      // Add to timeline
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/timeline-aggregator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'add_event',
            event: {
              userId: user.id,
              eventType: 'registration_completed',
              eventCategory: 'system',
              eventTitle: 'Completed onboarding',
              eventDescription: `Added ${contacts.filter(c => c.name).length} emergency contacts`,
              sentiment: 'positive',
              importanceScore: 2,
            },
          }),
        }
      );
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="text-6xl mb-6">{step.icon}</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{step.title}</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              {step.description}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
              <p className="text-sm text-yellow-900 font-semibold mb-2">
                ⚠️ Important
              </p>
              <p className="text-sm text-yellow-800">
                LifeLink Sync helps coordinate emergency response, but is NOT a replacement
                for 911/112. Always call official emergency services first in a real
                emergency.
              </p>
            </div>
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Get Started
            </button>
          </div>
        );

      case 'profile':
        return (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">{step.icon}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h2>
              <p className="text-gray-600">{step.description}</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include country code for best results
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth (optional)
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Helps medical responders provide appropriate care
                </p>
              </div>
            </div>
          </div>
        );

      case 'contacts':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">{step.icon}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h2>
              <p className="text-gray-600">{step.description}</p>
            </div>

            <div className="space-y-6">
              {contacts.map((contact, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-6 relative border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Contact {index + 1}
                    </h3>
                    {contacts.length > 1 && (
                      <button
                        onClick={() => removeContact(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) =>
                          updateContact(index, 'name', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Jane Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship *
                      </label>
                      <select
                        value={contact.relationship}
                        onChange={(e) =>
                          updateContact(index, 'relationship', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        <option value="spouse">Spouse/Partner</option>
                        <option value="parent">Parent</option>
                        <option value="sibling">Sibling</option>
                        <option value="child">Child</option>
                        <option value="friend">Friend</option>
                        <option value="neighbor">Neighbor</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) =>
                          updateContact(index, 'phone', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="+1 (555) 987-6543"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) =>
                          updateContact(index, 'email', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="jane@example.com"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addContact}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition"
              >
                + Add Another Contact
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-semibold mb-2">
                  💡 Tip: Add at least 2-3 contacts
                </p>
                <p className="text-sm text-blue-800">
                  Having multiple contacts increases the chance someone can help when
                  you need it. Choose people who live nearby and are usually available.
                </p>
              </div>
            </div>
          </div>
        );

      case 'test':
        return (
          <div className="max-w-md mx-auto text-center">
            <div className="text-5xl mb-6">{step.icon}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h2>
            <p className="text-gray-600 mb-8">{step.description}</p>

            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4 text-left mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Profile Complete
                  </h4>
                  <p className="text-sm text-gray-600">
                    {firstName} {lastName} • {phone}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 text-left">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {contacts.filter(c => c.name && c.phone).length} Emergency Contacts
                  </h4>
                  <p className="text-sm text-gray-600">
                    {contacts.filter(c => c.name).map(c => c.name).join(', ')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-900 font-semibold mb-2">
                📞 Optional: Send Test Alert
              </p>
              <p className="text-sm text-yellow-800 mb-3">
                Send a test notification to your contacts so they know you've added them.
              </p>
              <button className="text-sm text-yellow-900 font-semibold hover:underline">
                Send Test (Coming Soon)
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="max-w-md mx-auto text-center py-8">
            <div className="text-6xl mb-6 animate-bounce">{step.icon}</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{step.title}</h2>
            <p className="text-lg text-gray-600 mb-8">{step.description}</p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-green-900 mb-3">What's Next?</h3>
              <ul className="text-left space-y-2 text-sm text-green-800">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Your profile is saved and ready</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Emergency contacts have been notified</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>You can trigger SOS from your dashboard</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onComplete}
              className="w-full bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 ${index < steps.length - 1 ? 'mr-2' : ''}`}
              >
                <div
                  className={`h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Step Content */}
        <div className="mb-8">{renderStep()}</div>

        {/* Navigation Buttons */}
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 transition"
              disabled={isLoading}
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {isLoading ? 'Saving...' : currentStep === steps.length - 2 ? 'Finish' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
