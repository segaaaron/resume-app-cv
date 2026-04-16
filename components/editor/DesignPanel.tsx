"use client"

import { useResumeStore } from "@/stores/resumeStore"
import { FONT_OPTIONS, TEMPLATES } from "@/types/resume"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const COLOR_PRESETS = [
  "#2a72d7", "#1d1d20", "#16a34a", "#dc2626", "#9333ea",
  "#ea580c", "#0891b2", "#b45309", "#be185d", "#475569",
]

export default function DesignPanel() {
  const { config, setColor, setFont, setFontSize, setSpacing, setTemplate } = useResumeStore()

  return (
    <div className="p-4 space-y-6">
      {/* Template */}
      <div>
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 block">
          Plantilla
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setTemplate(template.id)}
              className={cn(
                "border-2 rounded-lg p-1 transition-all",
                config.templateId === template.id
                  ? "border-primary"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className="aspect-[3/4] rounded overflow-hidden bg-gray-50">
                <div className="h-4 w-full" style={{ backgroundColor: config.colorScheme }} />
                <div className="p-1 space-y-0.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-0.5 bg-gray-200 rounded" style={{ width: `${60 + i * 10}%` }} />
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-center mt-1 font-medium truncate">{template.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 block">
          Color principal
        </Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => setColor(color)}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                config.colorScheme === color ? "border-foreground scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="color"
            value={config.colorScheme}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 rounded cursor-pointer border border-border"
          />
          <span className="text-sm text-muted-foreground">{config.colorScheme}</span>
        </div>
      </div>

      {/* Font */}
      <div>
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 block">
          Tipografía
        </Label>
        <Select value={config.fontFamily} onValueChange={(v) => { if (v) setFont(v) }}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((font) => (
              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font size */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tamaño de letra
          </Label>
          <span className="text-xs text-muted-foreground">{config.fontSize}px</span>
        </div>
        <Slider
          min={10}
          max={18}
          step={1}
          value={config.fontSize}
          onValueChange={(v) => setFontSize(Array.isArray(v) ? v[0] : v)}
        />
      </div>

      {/* Spacing */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Espaciado
          </Label>
          <span className="text-xs text-muted-foreground">{config.spacing.toFixed(1)}x</span>
        </div>
        <Slider
          min={0.8}
          max={1.5}
          step={0.1}
          value={config.spacing}
          onValueChange={(v) => setSpacing(Array.isArray(v) ? v[0] : v)}
        />
      </div>
    </div>
  )
}
