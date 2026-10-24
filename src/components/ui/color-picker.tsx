import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SWATCHES = [
  "#c6963e", "#3d7ea8", "#7a9b3e", "#b55a3e",
  "#8e6cb5", "#c94a6b", "#5a8e8e", "#d4a83e",
];

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start gap-2 font-normal">
          <span className="h-4 w-4 rounded-full border border-line-600" style={{ backgroundColor: value }} />
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3">
        <div className="grid grid-cols-4 gap-2">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setOpen(false); }}
              className="h-8 w-8 rounded-full border border-line-600 transition-transform hover:scale-110"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="mt-3">
          <Label htmlFor="color_hex">Hex</Label>
          <Input id="color_hex" value={value} onChange={(e) => onChange(e.target.value)} placeholder="#c6963e" />
        </div>
      </PopoverContent>
    </Popover>
  );
}