import { useEmergencyConference } from '@/hooks/useEmergencyConference';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, Clock, MapPin, User, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface LiveConferenceDashboardProps {
  incidentId: string;
}

export const LiveConferenceDashboard = ({ incidentId }: LiveConferenceDashboardProps) => {
  const { t } = useTranslation();
  const { conferenceStatus, isLoading, error } = useEmergencyConference({
    incidentId,
    autoRefresh: true,
    refreshInterval: 3000,
  });

  if (isLoading && !conferenceStatus) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
            <span className="ml-3 text-sm text-gray-500">{t('emergency.connectingToConference')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <p className="text-sm text-yellow-800">{t('emergency.unableToLoadConference')}: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!conferenceStatus) {
    return null;
  }

  const { conference, participants, activeParticipants, userInConference, contactsInConference } =
    conferenceStatus;

  const getStatusBadge = (status: string) => {
    const badges = {
      calling: <Badge variant="outline" className="bg-blue-50">{t('emergency.calling')}</Badge>,
      ringing: <Badge variant="outline" className="bg-yellow-50">{t('emergency.ringing')}</Badge>,
      in_conference: <Badge className="bg-green-500">{t('emergency.connectedStatus')}</Badge>,
      left: <Badge variant="secondary">{t('emergency.left')}</Badge>,
      failed: <Badge variant="destructive">{t('emergency.failed')}</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>;
  };

  const getParticipantIcon = (type: string) => {
    if (type === 'user') return '🆘';
    if (type === 'contact') return '👤';
    if (type === 'ai_agent') return '🤖';
    if (type === 'emergency_service') return '🚑';
    return '📞';
  };

  return (
    <div className="space-y-4">
      {/* Conference Overview */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 animate-pulse text-red-500" />
            {t('emergency.liveEmergencyConference')}
          </CardTitle>
          <CardDescription>
            {conference.status === 'active' ? (
              <span className="text-green-600 font-medium">{t('emergency.conferenceActive')}</span>
            ) : (
              <span className="text-gray-600">{t('emergency.conferenceEnded')}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">{t('emergency.totalParticipants')}</span>
              <span className="text-2xl font-bold">{conference.total_participants}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">{t('emergency.currentlyConnected')}</span>
              <span className="text-2xl font-bold text-green-600">{activeParticipants}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">{t('emergency.userStatus')}</span>
              <span className="text-sm font-medium mt-1">
                {userInConference ? (
                  <Badge className="bg-green-500">{t('emergency.onCall')}</Badge>
                ) : (
                  <Badge variant="outline">{t('emergency.waiting')}</Badge>
                )}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">{t('emergency.responders')}</span>
              <span className="text-2xl font-bold text-blue-600">{contactsInConference}</span>
            </div>
          </div>

          {conference.started_at && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {t('emergency.started')} {formatDistanceToNow(new Date(conference.started_at), { addSuffix: true })}
              </span>
            </div>
          )}

          {conference.metadata?.location && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{conference.metadata.location}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('emergency.participants')} ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getParticipantIcon(participant.participant_type)}</span>
                  <div>
                    <p className="font-medium">
                      {participant.participant_name || t('emergency.unknown')}
                      {participant.participant_type === 'user' && (
                        <Badge variant="outline" className="ml-2 text-xs">{t('emergency.you')}</Badge>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{participant.phone_number}</p>
                    {participant.joined_at && participant.status === 'in_conference' && (
                      <p className="text-xs text-green-600 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {t('emergency.inCallFor')}{' '}
                        {formatDistanceToNow(new Date(participant.joined_at), { addSuffix: false })}
                      </p>
                    )}
                    {participant.eta_minutes && (
                      <p className="text-xs text-blue-600 mt-1">
                        {t('emergency.eta')}: {participant.eta_minutes} {t('emergency.minutes')}
                      </p>
                    )}
                    {participant.confirmation_message && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        "{participant.confirmation_message}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {participant.muted && <Badge variant="secondary">{t('emergency.muted')}</Badge>}
                  {participant.hold && <Badge variant="secondary">{t('emergency.hold')}</Badge>}
                  {getStatusBadge(participant.status)}
                </div>
              </div>
            ))}
          </div>

          {participants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <PhoneOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('emergency.noParticipants')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
