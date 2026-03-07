
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, RotateCcw } from "lucide-react";
import AppPreviewPhone from "@/components/app-preview/AppPreviewPhone";
import { useSiteContent } from "@/hooks/useSiteContent";
import { AppPreviewConfig, AppPreviewCard, getDefaultAppPreview } from "@/types/appPreview";
import { getTranslatedAppPreview } from "@/utils/appPreviewTranslations";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from 'react-i18next';
import ColorPicker from "@/components/admin/ColorPicker";

const SITE_CONTENT_KEY = "homepage_app_preview";

const AppTestingPage: React.FC = () => {
  const { t } = useTranslation();
  const defaults = useMemo(() => getTranslatedAppPreview(t), [t]);
  const { toast } = useToast();

  const { value, isLoading, save, isSaving } = useSiteContent<AppPreviewConfig>(SITE_CONTENT_KEY, defaults);

  const [draft, setDraft] = useState<AppPreviewConfig>(value ?? defaults);

  React.useEffect(() => {
    if (value) setDraft(value);
  }, [value]);

  const handleField = (field: keyof AppPreviewConfig, val: string) => {
    setDraft((d) => ({ ...d, [field]: val }));
  };
  const handleToggle = (field: keyof AppPreviewConfig, val: boolean) => {
    setDraft((d) => ({ ...d, [field]: val }));
  };

  const updateCard = (index: number, patch: Partial<AppPreviewCard>) => {
    setDraft((d) => {
      const next = [...(d.cards ?? [])];
      next[index] = { ...next[index], ...patch };
      return { ...d, cards: next };
    });
  };

  const addCard = () => {
    setDraft((d) => ({
      ...d,
      cards: [
        ...(d.cards ?? []),
        { icon: "heart", title: "New Card", status: "Info", description: "Description" },
      ],
    }));
  };

  const removeCard = (index: number) => {
    setDraft((d) => {
      const next = [...(d.cards ?? [])];
      next.splice(index, 1);
      return { ...d, cards: next };
    });
  };

  const onSave = () => {
    save(draft, {
      onSuccess: () => {
        toast({ title: "Saved", description: "Homepage preview updated." });
      },
      onError: (err: any) => {
        toast({ title: "Save failed", description: err?.message ?? "Please try again." });
      },
    });
  };

  const onReset = () => {
    const df = getTranslatedAppPreview(t);
    setDraft(df);
    toast({ title: "Reset", description: "Defaults restored. Click Save to persist." });
  };

  if (isLoading && !value) {
    return <div className="p-6 text-muted-foreground">Loading App Testing...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Live preview */}
        <div className="w-full lg:w-5/12">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>App Visual Preview</CardTitle>
              <div className="flex items-center gap-2">
                <span className="relative inline-flex">
                  <span className="h-3.5 w-3.5 rounded-full bg-[hsl(var(--emergency))] shadow-[0_0_12px_hsl(var(--emergency)/0.8)]"></span>
                  <span className="absolute inset-0 rounded-full emergency-pulse"></span>
                </span>
                <span className="text-xs font-medium text-muted-foreground">Live</span>
              </div>
            </CardHeader>
            <CardContent>
              <AppPreviewPhone config={draft} simulateRealtime />
            </CardContent>
          </Card>
        </div>

        {/* Right: Editor */}
        <div className="w-full lg:w-7/12">
          <Card>
            <CardHeader>
              <CardTitle>Customize Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="appName">App Name</Label>
                  <Input id="appName" value={draft.appName} onChange={(e) => handleField("appName", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input id="tagline" value={draft.tagline} onChange={(e) => handleField("tagline", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="sosLabel">SOS Label</Label>
                  <Input id="sosLabel" value={draft.sosLabel} onChange={(e) => handleField("sosLabel", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="sosSubLabel">SOS Sub Label</Label>
                  <Input id="sosSubLabel" value={draft.sosSubLabel} onChange={(e) => handleField("sosSubLabel", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="voiceLabel">Voice Label</Label>
                  <Input id="voiceLabel" value={draft.voiceLabel} onChange={(e) => handleField("voiceLabel", e.target.value)} />
                </div>
                <ColorPicker
                  id="primaryColor"
                  label="Primary Color"
                  value={draft.primaryColor}
                  onChange={(val) => handleField("primaryColor", val)}
                />
                <ColorPicker
                  id="sosColor"
                  label="SOS Button Color"
                  value={draft.sosColor}
                  onChange={(val) => handleField("sosColor", val)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Real‑time Cards</h4>
                <span className="text-xs text-muted-foreground">Auto-updates from device/simulator</span>
              </div>

              <div className="space-y-3 rounded-md border border-dashed border-border p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Card content is now real-time and reflects device and app state. Use the live preview to see updates. No manual card editing is required.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Show settings icon</Label>
                  <Switch checked={draft.showSettingsIcon ?? true} onCheckedChange={(v) => handleToggle("showSettingsIcon", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Device Battery card</Label>
                  <Switch checked={draft.enableBatteryCard ?? true} onCheckedChange={(v) => handleToggle("enableBatteryCard", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Heart Rate card</Label>
                  <Switch checked={draft.enableHeartRateCard ?? false} onCheckedChange={(v) => handleToggle("enableHeartRateCard", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Guardian AI card</Label>
                  <Switch checked={draft.enableAiCard ?? false} onCheckedChange={(v) => handleToggle("enableAiCard", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Reminders card</Label>
                  <Switch checked={draft.enableRemindersCard ?? false} onCheckedChange={(v) => handleToggle("enableRemindersCard", v)} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={onSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={onReset}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AppTestingPage;
