import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Brain,
  Settings2,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import AIAgentPage from '@/components/admin/pages/AIAgentPage';
import RivenAgentPage from '@/components/admin/pages/RivenAgentPage';
import { useTranslation } from 'react-i18next';

type SelectedAgent = 'none' | 'clara' | 'riven';

interface AgentCard {
  id: SelectedAgent;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  model: string;
  status: 'active' | 'idle';
  hasConfig: boolean;
}

const AGENTS: AgentCard[] = [
  {
    id: 'clara',
    name: 'Clara',
    description: 'AI Safety Assistant — conversations, leads, emergency guidance',
    icon: Bot,
    color: 'emerald',
    model: 'GPT-4o Mini',
    status: 'active',
    hasConfig: true,
  },
  {
    id: 'riven',
    name: 'Riven',
    description: 'AI Marketing Engine — campaigns, content, social publishing',
    icon: Brain,
    color: 'purple',
    model: 'Claude Sonnet 4',
    status: 'active',
    hasConfig: true,
  },
];

const AISettings = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<SelectedAgent>('none');

  if (selected === 'clara') {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelected('none')}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('ai.settings.backToAgents')}
        </Button>
        <AIAgentPage />
      </div>
    );
  }

  if (selected === 'riven') {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelected('none')}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('ai.settings.backToAgents')}
        </Button>
        <RivenAgentPage />
      </div>
    );
  }

  // Default: Agent cards view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 className="h-6 w-6" />
          {t('ai.settings.title')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('ai.settings.subtitle')}
        </p>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AGENTS.map((agent) => (
          <Card
            key={agent.id}
            className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5"
            onClick={() => setSelected(agent.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${agent.color === 'emerald' ? 'bg-emerald-500/10' : 'bg-purple-500/10'}`}>
                  <agent.icon className={`h-7 w-7 ${agent.color === 'emerald' ? 'text-emerald-500' : 'text-purple-500'}`} />
                </div>
                <Badge
                  variant="outline"
                  className={agent.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}
                >
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {agent.status === 'active' ? t('ai.settings.active') : t('ai.settings.idle')}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg mb-1">{agent.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{agent.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">{agent.model}</Badge>
                <Button variant="outline" size="sm" className="text-xs h-7">
                  {t('ai.settings.configure')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Agent placeholder */}
        <Card className="border-dashed opacity-60 cursor-not-allowed">
          <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[200px]">
            <div className="p-3 rounded-xl bg-muted/50 mb-3">
              <Plus className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">{t('ai.settings.addNewAgent')}</h3>
            <Badge variant="secondary" className="text-[10px]">{t('ai.settings.comingSoon')}</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AISettings;
