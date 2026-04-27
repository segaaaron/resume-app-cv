"use client"

import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import SectionBlock from "./SectionBlock"
import DesignPanel from "./DesignPanel"
import ATSScorePanel from "./ATSScorePanel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutTemplate, Settings2, Target } from "lucide-react"

export default function FormPanel() {
  const t = useTranslations("editor")
  const { sections, reorderSections } = useResumeStore()
  const visibleSections = sections.filter((s) => s.visible)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = sections.findIndex((s) => s.id === active.id)
    const toIndex = sections.findIndex((s) => s.id === over.id)
    if (fromIndex !== -1 && toIndex !== -1) reorderSections(fromIndex, toIndex)
  }

  return (
    <aside className="w-[420px] shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
      <Tabs defaultValue="content" className="flex flex-col h-full overflow-hidden">
        {/* Static tab bar */}
        <TabsList className="rounded-none border-b h-10 bg-white justify-start px-4 gap-4 shrink-0">
          <TabsTrigger value="content" className="gap-1.5 text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
            <LayoutTemplate className="h-3.5 w-3.5" /> {t("form.content_tab")}
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-1.5 text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
            <Settings2 className="h-3.5 w-3.5" /> {t("form.design_tab")}
          </TabsTrigger>
          <TabsTrigger value="ats" className="gap-1.5 text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
            <Target className="h-3.5 w-3.5" /> {t("form.ats_tab")}
          </TabsTrigger>
        </TabsList>

        {/* Scrollable content */}
        <TabsContent value="content" className="flex-1 min-h-0 overflow-y-auto mt-0 p-4 space-y-2 data-[state=inactive]:hidden">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {visibleSections.map((section) => (
                <SectionBlock key={section.id} section={section} />
              ))}
            </SortableContext>
          </DndContext>

          {/* Hidden sections */}
          {sections.filter((s) => !s.visible).length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">
                {t("form.hidden_sections")}
              </p>
              {sections.filter((s) => !s.visible).map((section) => (
                <SectionBlock key={section.id} section={section} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="design" className="flex-1 min-h-0 overflow-y-auto mt-0 data-[state=inactive]:hidden">
          <DesignPanel />
        </TabsContent>

        <TabsContent value="ats" className="flex-1 min-h-0 overflow-y-auto mt-0 p-4 data-[state=inactive]:hidden">
          <ATSScorePanel />
        </TabsContent>
      </Tabs>
    </aside>
  )
}
