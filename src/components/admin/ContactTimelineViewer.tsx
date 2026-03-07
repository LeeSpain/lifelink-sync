// ContactTimelineViewer - Beautiful admin UI for viewing complete customer interaction history
// Shows unified timeline across all channels with filtering and export

'use client';

import React, { useState } from 'react';
import { useContactTimeline, TimelineEvent } from '@/hooks/useContactTimeline';

interface ContactTimelineViewerProps {
  userId?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
}

const eventIcons: Record<string, string> = {
  chat_message: '💬',
  email_sent: '📧',
  email_opened: '👀',
  email_clicked: '🔗',
  voice_call: '📞',
  conference_join: '👥',
  sos_incident: '🚨',
  lead_captured: '🎯',
  lead_score_change: '📈',
  registration_completed: '✅',
  subscription_change: '💳',
  payment_event: '💰',
  profile_update: '👤',
  ai_interaction: '🤖',
  custom_event: '📌',
};

const eventColors: Record<string, string> = {
  communication: 'bg-blue-100 text-blue-800 border-blue-300',
  emergency: 'bg-red-100 text-red-800 border-red-300',
  sales: 'bg-green-100 text-green-800 border-green-300',
  support: 'bg-purple-100 text-purple-800 border-purple-300',
  system: 'bg-gray-100 text-gray-800 border-gray-300',
};

const importanceColors: Record<number, string> = {
  1: 'border-l-4 border-l-red-500',
  2: 'border-l-4 border-l-orange-500',
  3: 'border-l-4 border-l-yellow-500',
  4: 'border-l-4 border-l-blue-500',
  5: 'border-l-4 border-l-gray-500',
};

const sentimentEmojis: Record<string, string> = {
  positive: '😊',
  neutral: '😐',
  negative: '😞',
  urgent: '⚠️',
};

export const ContactTimelineViewer: React.FC<ContactTimelineViewerProps> = ({
  userId,
  contactEmail,
  contactPhone,
  contactName,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const {
    timeline,
    engagement,
    aiContext,
    isLoading,
    error,
    totalInteractions,
    leadScore,
    riskLevel,
    emailOpenRate,
    emergencyCount,
    getEventsByCategory,
  } = useContactTimeline({
    userId,
    contactEmail,
    contactPhone,
    eventCategory: selectedCategory,
    realtime: true,
  });

  const filteredTimeline = selectedCategory
    ? getEventsByCategory(selectedCategory)
    : timeline;

  const handleExport = () => {
    const data = timeline.map((event) => ({
      Date: new Date(event.occurredAt).toLocaleString(),
      Type: event.eventType,
      Category: event.eventCategory,
      Title: event.eventTitle,
      Description: event.eventDescription,
      Sentiment: event.sentiment,
      Importance: event.importanceScore,
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-${contactEmail || userId}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-semibold">Error loading timeline</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Contact Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {contactName || contactEmail || contactPhone || 'Contact Timeline'}
            </h1>
            {contactEmail && (
              <p className="text-gray-600 text-sm mt-1">📧 {contactEmail}</p>
            )}
            {contactPhone && (
              <p className="text-gray-600 text-sm">📞 {contactPhone}</p>
            )}
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Export Timeline
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600 text-xs uppercase">Total Interactions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {totalInteractions}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-green-700 text-xs uppercase">Lead Score</p>
            <p className="text-2xl font-bold text-green-800 mt-1">{leadScore}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-blue-700 text-xs uppercase">Email Open Rate</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">
              {Math.round(emailOpenRate * 100)}%
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-red-700 text-xs uppercase">Emergencies</p>
            <p className="text-2xl font-bold text-red-800 mt-1">
              {emergencyCount}
            </p>
          </div>
          <div
            className={`rounded-lg p-4 ${
              riskLevel === 'critical' || riskLevel === 'high'
                ? 'bg-red-50'
                : riskLevel === 'medium'
                ? 'bg-yellow-50'
                : 'bg-green-50'
            }`}
          >
            <p className="text-gray-700 text-xs uppercase">Risk Level</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                riskLevel === 'critical' || riskLevel === 'high'
                  ? 'text-red-800'
                  : riskLevel === 'medium'
                  ? 'text-yellow-800'
                  : 'text-green-800'
              }`}
            >
              {riskLevel || 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* AI Context Summary */}
      {aiContext && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-sm border border-purple-200 p-6">
          <h2 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
            🤖 AI Context Summary
          </h2>
          <p className="text-gray-700 mt-3 whitespace-pre-line">
            {aiContext.contextSummary}
          </p>
        </div>
      )}

      {/* Category Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-4 py-2 rounded-lg transition ${
              !selectedCategory
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Events ({timeline.length})
          </button>
          {['communication', 'emergency', 'sales', 'support', 'system'].map(
            (category) => {
              const count = getEventsByCategory(category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg transition ${
                    selectedCategory === category
                      ? eventColors[category]
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Timeline Events */}
      <div className="space-y-4">
        {filteredTimeline.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <p className="text-gray-600">No events in this category</p>
          </div>
        ) : (
          filteredTimeline.map((event) => (
            <div
              key={event.id}
              className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition cursor-pointer ${
                importanceColors[event.importanceScore]
              }`}
              onClick={() => setSelectedEvent(event)}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0">
                    {eventIcons[event.eventType] || '📌'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {event.eventTitle}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            eventColors[event.eventCategory]
                          }`}
                        >
                          {event.eventCategory}
                        </span>
                        {event.sentiment && (
                          <span className="text-lg">
                            {sentimentEmojis[event.sentiment]}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {new Date(event.occurredAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Description */}
                    {event.eventDescription && (
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                        {event.eventDescription}
                      </p>
                    )}

                    {/* AI Summary */}
                    {event.aiSummary && (
                      <p className="text-purple-700 text-sm mt-2 italic">
                        💡 {event.aiSummary}
                      </p>
                    )}

                    {/* Tags */}
                    {event.aiTags && event.aiTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.aiTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer - Source Info */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Source: {event.sourceType}</span>
                      {event.relatedIncidentId && (
                        <span className="text-red-600">
                          🚨 Incident: {event.relatedIncidentId.slice(0, 8)}
                        </span>
                      )}
                      {event.relatedConferenceId && (
                        <span className="text-purple-600">
                          📞 Conference: {event.relatedConferenceId.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedEvent.eventTitle}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(selectedEvent.occurredAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                  Description
                </h3>
                <p className="text-gray-900 mt-1">
                  {selectedEvent.eventDescription || 'No description'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                  Category & Type
                </h3>
                <div className="flex gap-2 mt-1">
                  <span
                    className={`px-3 py-1 rounded ${
                      eventColors[selectedEvent.eventCategory]
                    }`}
                  >
                    {selectedEvent.eventCategory}
                  </span>
                  <span className="px-3 py-1 rounded bg-gray-100 text-gray-800">
                    {selectedEvent.eventType}
                  </span>
                </div>
              </div>

              {selectedEvent.aiSummary && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase">
                    AI Summary
                  </h3>
                  <p className="text-purple-700 mt-1 italic">
                    {selectedEvent.aiSummary}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                  Event Data
                </h3>
                <pre className="bg-gray-50 rounded p-3 text-xs overflow-auto mt-1">
                  {JSON.stringify(selectedEvent.eventData, null, 2)}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase">
                    Importance
                  </h3>
                  <p className="text-gray-900 mt-1">
                    {selectedEvent.importanceScore}/5
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase">
                    Sentiment
                  </h3>
                  <p className="text-gray-900 mt-1">
                    {selectedEvent.sentiment || 'Not analyzed'}{' '}
                    {selectedEvent.sentiment &&
                      sentimentEmojis[selectedEvent.sentiment]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactTimelineViewer;
