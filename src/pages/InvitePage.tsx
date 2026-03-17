import { useSearchParams } from 'react-router-dom';

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const fromName = searchParams.get('from') || 'Lee Wakeman';
  const toName = searchParams.get('name') || '';
  const ref = searchParams.get('ref') || '';

  const waMessage = encodeURIComponent(
    `Hi CLARA, ${toName ? `I'm ${toName}. ` : ''}I heard about LifeLink Sync from ${fromName}. Can you tell me more?`
  );
  const waLink = `https://wa.me/17277615366?text=${waMessage}`;
  const signupLink = `https://lifelink-sync.com/onboarding${ref ? `?ref=${ref}` : ''}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">

        <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
          <span role="img" aria-label="shield">🛡️</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {toName ? `Hey ${toName}!` : 'You\'re invited!'}
        </h1>
        <p className="text-base text-gray-500 mb-6">
          {fromName} invited you to try LifeLink Sync
        </p>

        <div className="text-left space-y-3 my-6">
          {[
            { emoji: '🚨', text: 'One-tap SOS — family alerted in seconds' },
            { emoji: '📍', text: 'Live GPS shared during emergencies' },
            { emoji: '🤖', text: 'CLARA AI available 24/7 to help' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="text-base flex-shrink-0 mt-0.5">{item.emoji}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-6">
          <p className="text-green-800 text-sm font-semibold">7-day free trial</p>
          <p className="text-green-600 text-xs mt-0.5">No card needed · 2 minutes to set up</p>
        </div>

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-green-500 text-white rounded-2xl py-4 font-bold text-sm mb-3 hover:bg-green-600 transition-colors"
        >
          <span>💬</span>
          Chat with CLARA on WhatsApp
        </a>

        <a
          href={signupLink}
          className="flex items-center justify-center gap-3 w-full bg-red-500 text-white rounded-2xl py-4 font-bold text-sm mb-4 hover:bg-red-600 transition-colors"
        >
          <span>🛡️</span>
          Start free trial now
        </a>

        <p className="text-xs text-gray-400">
          By clicking WhatsApp you'll be connected with CLARA, {fromName}'s AI assistant. She'll answer any questions 24/7.
        </p>

        <p className="text-xs text-gray-300 mt-3">
          LifeLink Sync · lifelink-sync.com
        </p>
      </div>
    </div>
  );
}
