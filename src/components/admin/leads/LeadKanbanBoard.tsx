import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Mail, 
  Phone, 
  Building2, 
  Star, 
  DollarSign,
  Calendar,
  Eye
} from 'lucide-react';
import { EnhancedLead, useEnhancedLeads } from '@/hooks/useEnhancedLeads';

interface LeadKanbanBoardProps {
  leads: EnhancedLead[];
  onLeadClick: (lead: EnhancedLead) => void;
}

const STATUS_COLUMNS = [
  { id: 'new', title: 'New Leads', color: 'bg-blue-50 border-blue-200' },
  { id: 'qualified', title: 'Qualified', color: 'bg-green-50 border-green-200' },
  { id: 'proposal', title: 'Proposal Sent', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'negotiation', title: 'Negotiation', color: 'bg-orange-50 border-orange-200' },
  { id: 'converted', title: 'Converted', color: 'bg-purple-50 border-purple-200' },
  { id: 'lost', title: 'Lost', color: 'bg-red-50 border-red-200' },
];

export const LeadKanbanBoard: React.FC<LeadKanbanBoardProps> = ({
  leads,
  onLeadClick,
}) => {
  const { updateLeadStatus } = useEnhancedLeads();

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId;

    await updateLeadStatus(leadId, newStatus);
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const LeadCard: React.FC<{ lead: EnhancedLead; index: number }> = ({ lead, index }) => (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-3 cursor-pointer hover:shadow-md transition-shadow ${
            snapshot.isDragging ? 'shadow-lg rotate-1' : ''
          }`}
          onClick={() => onLeadClick(lead)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {lead.first_name?.[0]}{lead.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {lead.first_name} {lead.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{lead.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onLeadClick(lead);
                }}
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>

            {lead.company_name && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <Building2 className="h-3 w-3" />
                {lead.company_name}
                {lead.job_title && ` • ${lead.job_title}`}
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Star className={`h-3 w-3 ${getLeadScoreColor(lead.lead_score)}`} />
                <span className={`text-xs font-medium ${getLeadScoreColor(lead.lead_score)}`}>
                  {lead.lead_score}
                </span>
              </div>
              {lead.deal_value && (
                <div className="flex items-center gap-1 text-xs">
                  <DollarSign className="h-3 w-3" />
                  ${lead.deal_value.toLocaleString()}
                </div>
              )}
            </div>

            {lead.tags && lead.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {lead.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                    {tag}
                  </Badge>
                ))}
                {lead.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    +{lead.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {lead.next_follow_up_at && (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <Calendar className="h-3 w-3" />
                Follow-up: {new Date(lead.next_follow_up_at).toLocaleDateString()}
              </div>
            )}

            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                {lead.last_contacted_at 
                  ? new Date(lead.last_contacted_at).toLocaleDateString()
                  : 'Never'
                }
              </div>
              <Badge variant="outline" className="text-xs">
                Level {lead.interest_level}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max min-h-screen">
        {STATUS_COLUMNS.map((column) => {
          const columnLeads = getLeadsByStatus(column.id);
          
          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <Card className={`h-full ${column.color}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {column.title}
                    <Badge variant="secondary" className="ml-2">
                      {columnLeads.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3">
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] ${
                          snapshot.isDraggingOver ? 'bg-white/50 rounded-lg' : ''
                        }`}
                      >
                        {columnLeads.map((lead, index) => (
                          <LeadCard key={lead.id} lead={lead} index={index} />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>
          );
        })}
        </div>
      </div>
    </DragDropContext>
  );
};