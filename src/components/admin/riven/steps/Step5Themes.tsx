import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { RivenSpeech } from "../RivenSpeech";
import type { WeekTheme } from "@/hooks/useRivenWizard";

interface Step5ThemesProps {
  themes: WeekTheme[];
  duration: number;
  onUpdate: (index: number, updates: Partial<WeekTheme>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function Step5Themes({ themes, duration, onUpdate, onAdd, onRemove }: Step5ThemesProps) {
  const totalWeeks = Math.ceil(duration / 7);

  return (
    <div className="space-y-6">
      <RivenSpeech text="Here's the content theme plan I suggest. Edit anything you like." />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalWeeks} weeks — themes repeat if fewer than {totalWeeks} defined
        </p>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-3 w-3 mr-1" /> Add Week
        </Button>
      </div>

      <div className="space-y-3">
        {themes.map((theme, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-2 text-muted-foreground cursor-grab">
                <GripVertical className="h-4 w-4" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Week {theme.week}
                  </span>
                  <Input
                    className="h-8 text-sm font-semibold flex-1"
                    value={theme.title}
                    onChange={(e) => onUpdate(index, { title: e.target.value })}
                    placeholder="Theme title"
                  />
                  {themes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onRemove(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <Textarea
                  className="text-sm min-h-[40px] resize-none"
                  rows={1}
                  value={theme.description}
                  onChange={(e) => onUpdate(index, { description: e.target.value })}
                  placeholder="What's the focus this week?"
                />

                <Input
                  className="h-7 text-xs"
                  value={theme.pillars.join(", ")}
                  onChange={(e) =>
                    onUpdate(index, {
                      pillars: e.target.value
                        .split(",")
                        .map((p) => p.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Content pillars (comma separated)"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
