"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, GripVertical, Type, List, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export type FieldType = "TEXT" | "EMAIL" | "PHONE" | "NUMBER" | "SELECT" | "CHECKBOX" | "DATE"

export interface FormFieldConfig {
  id: string
  label: string
  type: FieldType
  required: boolean
  options?: string[] // For SELECT
  order: number
  locked?: boolean // Cannot be deleted or type changed
}

// Default required fields — always present
export const DEFAULT_FIELDS: FormFieldConfig[] = [
  { id: "__name__", label: "ชื่อ - นามสกุล", type: "TEXT", required: true, order: 0, locked: true },
  { id: "__email__", label: "อีเมล", type: "EMAIL", required: true, order: 1, locked: true },
]

interface FormBuilderProps {
  onChange: (fields: FormFieldConfig[]) => void
  initialFields?: FormFieldConfig[]
}

// Sortable Item Component
function SortableFieldItem({ 
    field, 
    updateField, 
    removeField, 
    updateOption, 
    addOption, 
    removeOption 
}: {
    field: FormFieldConfig
    updateField: (id: string, updates: Partial<FormFieldConfig>) => void
    removeField: (id: string) => void
    updateOption: (fieldId: string, index: number, value: string) => void
    addOption: (fieldId: string) => void
    removeOption: (fieldId: string, index: number) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    }

    const isLocked = !!field.locked

    return (
        <Card ref={setNodeRef} style={style} className={`relative group ${isLocked ? 'bg-gray-50 dark:bg-gray-900/50 border-dashed' : 'bg-white dark:bg-gray-950'}`}>
            {/* Drag Handle */}
            <div 
                {...attributes} 
                {...listeners}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground cursor-grab active:cursor-grabbing p-2 hover:bg-muted/50 rounded"
            >
                <GripVertical className="h-5 w-5" />
            </div>

            <CardContent className="p-4 pl-12 pt-4">
              <div className="grid gap-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="grid gap-2 flex-1">
                        <Label>ชื่อฟิลด์</Label>
                        <Input 
                            value={field.label} 
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder={field.type === "TEXT" ? "เช่น ตำแหน่ง" : "เช่น แผนก"}
                            disabled={isLocked}
                            className={isLocked ? 'opacity-70 cursor-not-allowed' : ''}
                        />
                    </div>
                    <div className="grid gap-2 w-[140px]">
                         <Label>ประเภท</Label>
                         <Select 
                            value={field.type} 
                            onValueChange={(val) => updateField(field.id, { type: val as FieldType })}
                            disabled={isLocked}
                         >
                            <SelectTrigger className={isLocked ? 'opacity-70 cursor-not-allowed' : ''}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TEXT">Text Input</SelectItem>
                                <SelectItem value="EMAIL">Email</SelectItem>
                                <SelectItem value="PHONE">Phone</SelectItem>
                                <SelectItem value="SELECT">Dropdown</SelectItem>
                                <SelectItem value="CHECKBOX">Checkbox</SelectItem>
                            </SelectContent>
                         </Select>
                    </div>
                    {isLocked ? (
                      <div className="flex items-center gap-1.5 mt-8 text-muted-foreground" title="ฟิลด์นี้จำเป็นและไม่สามารถลบได้">
                        <Lock className="h-4 w-4" />
                        <span className="text-xs font-medium">จำเป็น</span>
                      </div>
                    ) : (
                      <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-8"
                          onClick={() => removeField(field.id)}
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                </div>

                {!isLocked && (
                  <div className="flex items-center gap-2">
                      <Switch 
                          checked={field.required} 
                          onCheckedChange={(checked: boolean) => updateField(field.id, { required: checked })}
                          id={`req-${field.id}`}
                      />
                      <Label htmlFor={`req-${field.id}`} className="text-sm font-normal text-muted-foreground">ฟิลด์บังคับ</Label>
                  </div>
                )}

                {/* OPTIONS EDITOR FOR SELECT */}
                {field.type === "SELECT" && (
                    <div className="pl-4 border-l-2 border-muted mt-2 space-y-2">
                        <Label className="text-xs text-muted-foreground">ตัวเลือก Dropdown</Label>
                        {field.options?.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                                <Input 
                                    className="h-8 text-sm"
                                    value={opt} 
                                    onChange={(e) => updateOption(field.id, optIndex, e.target.value)}
                                />
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => removeOption(field.id, optIndex)}
                                    disabled={field.options?.length === 1}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => addOption(field.id)}>
                            <Plus className="mr-2 h-3 w-3" /> เพิ่มตัวเลือก
                        </Button>
                    </div>
                )}
              </div>
            </CardContent>
        </Card>
    )
}

export function FormBuilder({ onChange, initialFields = [] }: FormBuilderProps) {
  // Ensure default fields are always present at the top
  const mergeWithDefaults = (incoming: FormFieldConfig[]): FormFieldConfig[] => {
    const defaults = DEFAULT_FIELDS.map(df => {
      // Check if there's a matching existing field (by locked ID)
      const existing = incoming.find(f => f.id === df.id);
      return existing ? { ...existing, locked: true } : { ...df };
    });
    const custom = incoming.filter(f => !DEFAULT_FIELDS.some(df => df.id === f.id));
    return [...defaults, ...custom];
  }

  const [fields, setFields] = useState<FormFieldConfig[]>(mergeWithDefaults(initialFields))

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    onChange(fields)
  }, [fields, onChange])

  const addField = (type: FieldType) => {
    const newField: FormFieldConfig = {
      id: crypto.randomUUID(),
      label: "",
      type,
      required: false,
      order: fields.length,
      options: type === "SELECT" ? ["Option 1", "Option 2"] : undefined,
    }
    setFields([...fields, newField])
  }

  const removeField = (id: string) => {
    // Prevent removing locked/default fields
    if (DEFAULT_FIELDS.some(df => df.id === id)) return;
    setFields(fields.filter((f) => f.id !== id))
  }

  const updateField = (id: string, updates: Partial<FormFieldConfig>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const updateOption = (fieldId: string, index: number, value: string) => {
    const field = fields.find((f) => f.id === fieldId)
    if (field && field.options) {
        const newOptions = [...field.options]
        newOptions[index] = value
        updateField(fieldId, { options: newOptions })
    }
  }

  const addOption = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId)
    if (field && field.options) {
        updateField(fieldId, { options: [...field.options, `Option ${field.options.length + 1}`] })
    }
  }
  
  const removeOption = (fieldId: string, index: number) => {
    const field = fields.find((f) => f.id === fieldId)
    if (field && field.options && field.options.length > 1) {
        const newOptions = field.options.filter((_, i) => i !== index)
        updateField(fieldId, { options: newOptions })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex).map((item, index) => ({
            ...item,
            order: index
        }))
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Button type="button" variant="outline" size="sm" onClick={() => addField("TEXT")}>
            <Type className="mr-2 h-4 w-4" /> Text
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addField("SELECT")}>
            <List className="mr-2 h-4 w-4" /> Dropdown
        </Button>
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
          <div className="space-y-4">
            {fields.filter(f => !f.locked).length === 0 && (
                <div className="text-center p-6 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20 mt-2">
                    <p className="text-sm">ยังไม่มีฟิลด์เพิ่มเติม</p>
                    <p className="text-xs">คลิกปุ่มด้านบนเพื่อเพิ่มฟิลด์ในฟอร์ม</p>
                </div>
            )}
            
            <SortableContext 
                items={fields.map(f => f.id)}
                strategy={verticalListSortingStrategy}
            >
                {fields.map((field) => (
                    <SortableFieldItem
                        key={field.id}
                        field={field}
                        updateField={updateField}
                        removeField={removeField}
                        updateOption={updateOption}
                        addOption={addOption}
                        removeOption={removeOption}
                    />
                ))}
            </SortableContext>
          </div>
      </DndContext>
    </div>
  )
}
