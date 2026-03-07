import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ColorPickerProps {
  id: string;
  label: string;
  value?: string;
  onChange: (val: string) => void;
  presets?: string[];
}

const DEFAULT_PRESETS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#f59e0b", // amber-500
  "#22c55e", // green-500
  "#10b981", // emerald-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
  "#94a3b8", // slate-400
];

const ColorPicker: React.FC<ColorPickerProps> = ({ id, label, value, onChange, presets = DEFAULT_PRESETS }) => {
  const current = value || "";

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 gap-2">
              <span
                aria-hidden
                className="h-4 w-4 rounded-full border"
                style={{ background: current || "transparent" }}
              />
              <span className="text-xs text-muted-foreground">Pick color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-3">
              <div className="grid grid-cols-6 gap-2">
                {presets.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Choose ${c}`}
                    className="h-7 w-7 rounded-md border hover:opacity-80"
                    style={{ background: c }}
                    onClick={() => onChange(c)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id={id}
                  type="color"
                  value={current || "#ffffff"}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-9 w-12 p-1"
                />
                <Input
                  type="text"
                  placeholder="#000000"
                  value={current}
                  onChange={(e) => onChange(e.target.value)}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ColorPicker;
