import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MessageSquare, Tag, FileText, Send, Plus, X } from 'lucide-react';
import { useCustomerNotes } from '@/hooks/useCustomerNotes';
import { useCustomerTags } from '@/hooks/useCustomerTags';
import { useBulkCustomerActions } from '@/hooks/useBulkCustomerActions';

interface QuickActionsPanelProps {
  customerId: string;
  customerEmail?: string;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ customerId, customerEmail }) => {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedTagId, setSelectedTagId] = useState('');

  const { addNote } = useCustomerNotes();
  const { allTags, getCustomerTags, assignTag, removeTag } = useCustomerTags();
  const { data: customerTags } = getCustomerTags(customerId);
  const { sendBulkCommunication } = useBulkCustomerActions();

  const handleAddNote = () => {
    if (noteText.trim()) {
      addNote.mutate({
        customerId,
        noteText,
        isImportant,
      }, {
        onSuccess: () => {
          setNoteText('');
          setIsImportant(false);
          setShowNoteDialog(false);
        },
      });
    }
  };

  const handleSendEmail = () => {
    if (emailSubject.trim() && emailMessage.trim()) {
      sendBulkCommunication.mutate({
        customerIds: [customerId],
        type: 'email',
        subject: emailSubject,
        message: emailMessage,
      }, {
        onSuccess: () => {
          setEmailSubject('');
          setEmailMessage('');
          setShowEmailDialog(false);
        },
      });
    }
  };

  const handleAssignTag = () => {
    if (selectedTagId) {
      assignTag.mutate({ customerId, tagId: selectedTagId }, {
        onSuccess: () => {
          setSelectedTagId('');
          setShowTagDialog(false);
        },
      });
    }
  };

  const handleRemoveTag = (tagId: string) => {
    removeTag.mutate({ customerId, tagId });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowEmailDialog(true)}
            disabled={!customerEmail}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowNoteDialog(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Add Note
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowTagDialog(true)}
          >
            <Tag className="h-4 w-4 mr-2" />
            Manage Tags
          </Button>
        </CardContent>
      </Card>

      {/* Customer Tags Display */}
      {customerTags && customerTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {customerTags.map((assignment: any) => (
                <Badge
                  key={assignment.id}
                  variant="secondary"
                  style={{ backgroundColor: assignment.customer_tags.color + '20', color: assignment.customer_tags.color }}
                  className="flex items-center gap-1"
                >
                  {assignment.customer_tags.name}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => handleRemoveTag(assignment.tag_id)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note about this customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note-text">Note</Label>
              <Textarea
                id="note-text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter note..."
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="important"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="important">Mark as important</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={addNote.isPending}>
              {addNote.isPending ? 'Adding...' : 'Add Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send an email to {customerEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>
            <div>
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Email message..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sendBulkCommunication.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {sendBulkCommunication.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Tags Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>
              Assign tags to this customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tag-select">Select Tag</Label>
              <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tag..." />
                </SelectTrigger>
                <SelectContent>
                  {allTags
                    .filter(tag => !customerTags?.some((ct: any) => ct.tag_id === tag.id))
                    .map((tag: any) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTag} disabled={assignTag.isPending || !selectedTagId}>
              {assignTag.isPending ? 'Assigning...' : 'Assign Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};