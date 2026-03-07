// Instant Callback Widget - For landing pages
// "Talk to an expert in 60 seconds"

'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CallbackWidgetProps {
  variant?: 'inline' | 'floating' | 'modal';
  urgency?: 'low' | 'normal' | 'high' | 'urgent';
  callbackReason?: string;
  sourcePage?: string;
  sourceCampaign?: string;
}

export const InstantCallbackWidget: React.FC<CallbackWidgetProps> = ({
  variant = 'inline',
  urgency = 'normal',
  callbackReason = 'sales_inquiry',
  sourcePage,
  sourceCampaign,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'requesting' | 'confirmed' | 'error'>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('requesting');
    setError('');

    try {
      // Get UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/instant-callback/request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            contactName: name,
            contactPhone: phone,
            contactEmail: email,
            callbackReason,
            urgency,
            sourcePage: sourcePage || window.location.href,
            sourceCampaign,
            utmSource: urlParams.get('utm_source'),
            utmMedium: urlParams.get('utm_medium'),
            utmCampaign: urlParams.get('utm_campaign'),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to request callback');
      }

      const data = await response.json();

      if (data.success) {
        setEstimatedTime(data.request.estimatedCallTime);
        setStep('confirmed');

        // Track conversion
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'callback_requested', {
            event_category: 'lead_generation',
            event_label: callbackReason,
          });
        }
      } else {
        throw new Error(data.error || 'Failed to request callback');
      }
    } catch (err: any) {
      console.error('Callback request error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setStep('error');
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Your Name *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="John Smith"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email (optional)
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="john@example.com"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
      >
        <span>📞</span>
        <span>Call Me Now</span>
      </button>

      <p className="text-xs text-gray-500 text-center">
        We'll call you within 60 seconds. No spam, guaranteed.
      </p>
    </form>
  );

  const renderRequesting = () => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Connecting You Now...
      </h3>
      <p className="text-gray-600">
        Our team is preparing to call you. Please keep your phone nearby.
      </p>
    </div>
  );

  const renderConfirmed = () => (
    <div className="text-center py-8">
      <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">✅</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Callback Scheduled!
      </h3>
      <p className="text-gray-600 mb-4">
        We'll call you <strong>{estimatedTime}</strong>.
      </p>
      <p className="text-sm text-gray-500">
        Please keep your phone ({phone}) nearby.
      </p>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Answer when you see our call to start your free consultation!
        </p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-8">
      <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">❌</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Oops! Something Went Wrong
      </h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={() => setStep('form')}
        className="text-blue-600 hover:text-blue-700 font-medium"
      >
        Try Again
      </button>
    </div>
  );

  const renderContent = () => {
    switch (step) {
      case 'form':
        return renderForm();
      case 'requesting':
        return renderRequesting();
      case 'confirmed':
        return renderConfirmed();
      case 'error':
        return renderError();
    }
  };

  if (variant === 'floating' && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-4 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center gap-2 z-50 animate-bounce"
      >
        <span className="text-2xl">📞</span>
        <span className="font-semibold">Talk to an Expert</span>
      </button>
    );
  }

  if (variant === 'floating' && isOpen) {
    return (
      <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl p-6 w-96 z-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Get a Call in 60 Seconds
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Talk to an Expert in 60 Seconds
        </h2>
        <p className="text-gray-600">
          Enter your number and we'll call you immediately. No waiting, no hassle.
        </p>
      </div>
      {renderContent()}
    </div>
  );
};

export default InstantCallbackWidget;
