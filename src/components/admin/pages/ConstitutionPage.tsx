import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Lock, RotateCcw, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Law {
  id: string;
  law_number: number;
  law_title: string;
  law_text: string;
  law_description: string | null;
  is_active: boolean;
  is_editable: boolean;
  last_edited_by: string | null;
  last_edited_at: string | null;
}

function LawCard({
  law,
  onSave,
}: {
  law: Law;
  onSave: (id: string, text: string) => Promise<void>;
}) {
  const [editedText, setEditedText] = useState(law.law_text);
  const [originalText] = useState(law.law_text);
  const [isSaving, setIsSaving] = useState(false);
  const hasChanges = editedText !== law.law_text;

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(law.id, editedText);
    setIsSaving(false);
  };

  const handleReset = () => {
    setEditedText(originalText);
  };

  return (
    <Card className={`relative ${!law.is_editable ? 'border-red-500/30 bg-red-500/5' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={law.law_number === 8 ? 'destructive' : 'default'}>
              LAW {law.law_number}
            </Badge>
            <CardTitle className="text-lg">{law.law_title}</CardTitle>
            {!law.is_editable && <Lock className="h-4 w-4 text-red-500" />}
          </div>
        </div>
        {law.law_description && (
          <p className="text-sm text-muted-foreground mt-1">{law.law_description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          disabled={!law.is_editable}
          rows={4}
          className={`resize-none ${!law.is_editable ? 'opacity-60 cursor-not-allowed' : ''}`}
        />

        {!law.is_editable && (
          <p className="text-sm text-red-500 flex items-center gap-2">
            <Lock className="h-3 w-3" />
            This law is permanently locked for safety and cannot be edited.
          </p>
        )}

        {law.is_editable && (
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasChanges}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Law {law.law_number}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will discard your changes and restore the original text. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <p className="text-xs text-muted-foreground">
              {law.last_edited_by
                ? `Last edited by ${law.last_edited_by} on ${new Date(law.last_edited_at!).toLocaleDateString()}`
                : 'Never edited'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ConstitutionPage() {
  const [laws, setLaws] = useState<Law[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadLaws();
  }, []);

  const loadLaws = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('clara_constitution')
      .select('*')
      .order('law_number');

    if (error) {
      toast.error('Failed to load constitution');
      console.error(error);
    } else {
      setLaws((data as unknown as Law[]) || []);
    }
    setIsLoading(false);
  };

  const handleSave = async (id: string, newText: string) => {
    const { error } = await supabase
      .from('clara_constitution')
      .update({
        law_text: newText,
        last_edited_by: user?.email || 'admin',
        last_edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to save law');
      console.error(error);
    } else {
      toast.success('Law updated. Takes effect within 5 minutes.');
      await loadLaws();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">CLARA's Constitution</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight">CLARA's Constitution</h1>
            <p className="text-muted-foreground mt-1">
              CLARA's unbreakable laws governing all behaviour across every channel. Changes take effect within 5 minutes.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-amber-500/50 bg-amber-500/10">
        <CardContent className="py-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-medium">
            Edit with extreme care. These laws control how CLARA behaves with every customer, lead, and family member.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {laws.map((law) => (
          <LawCard key={law.id} law={law} onSave={handleSave} />
        ))}
      </div>
    </div>
  );
}
