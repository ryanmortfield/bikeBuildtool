'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Part } from '@/types/api'
import type { BuildPartWithPart } from '@/types/api'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const CUSTOM_PART_VALUE = '__custom__'

interface PartComboboxProps {
  buildId: string
  componentKey: string
  componentLabel: string
  current: BuildPartWithPart | null
  onSuccess: () => void
  /** For custom_* components: load parts from this group (component keys). */
  componentKeysInGroup?: string[]
}

export function PartCombobox({
  buildId,
  componentKey,
  componentLabel,
  current,
  onSuccess,
  componentKeysInGroup,
}: PartComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [showCustomForm, setShowCustomForm] = React.useState(false)
  const [customName, setCustomName] = React.useState('')
  const [customWeight, setCustomWeight] = React.useState('')
  const [customPrice, setCustomPrice] = React.useState('')
  const queryClient = useQueryClient()

  const isCustomSlot = componentKeysInGroup != null
  const { data: parts = [], isLoading } = useQuery<Part[]>({
    queryKey: isCustomSlot ? ['parts', 'all'] : ['parts', componentKey],
    queryFn: isCustomSlot
      ? () => api.get<Part[]>('/api/parts').then((all) => all.filter((p) => componentKeysInGroup!.includes(p.component)))
      : () => api.get<Part[]>(`/api/parts?component=${encodeURIComponent(componentKey)}`),
    enabled: open,
  })

  const addPart = useMutation({
    mutationFn: async (body: { partId?: string; customName?: string; customWeightG?: number; customPrice?: number }) => {
      if (current?.id) {
        await api.delete(`/api/builds/${buildId}/parts/${current.id}`)
      }
      return api.post<BuildPartWithPart>(`/api/builds/${buildId}/parts`, {
        component: componentKey,
        ...(body.partId && { partId: body.partId }),
        ...(body.customName && { customName: body.customName }),
        ...(body.customWeightG != null && body.customWeightG > 0 && { customWeightG: body.customWeightG }),
        ...(body.customPrice != null && body.customPrice >= 0 && { customPrice: body.customPrice }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds', buildId, 'parts'] })
      onSuccess()
      setOpen(false)
      setShowCustomForm(false)
      setCustomName('')
      setCustomWeight('')
      setCustomPrice('')
    },
  })

  const hasChosenPart =
    current?.part != null ||
    (current?.partId != null) ||
    (current != null && current.customName != null && current.customName !== componentLabel)
  const displayLabel = hasChosenPart
    ? (current!.part?.name ?? current!.customName ?? 'Custom')
    : `Choose part for ${componentLabel}…`
  const showPlaceholderStyle = !hasChosenPart

  const handleSelectPart = (part: Part) => {
    addPart.mutate({ partId: part.id })
  }

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault()
    const name = customName.trim()
    if (!name) return
    addPart.mutate({
      customName: name,
      customWeightG: customWeight ? parseInt(customWeight, 10) : undefined,
      customPrice: customPrice ? parseFloat(customPrice) : undefined,
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal min-h-9',
            showPlaceholderStyle && 'text-muted-foreground'
          )}
        >
          <span className="truncate">{displayLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        {showCustomForm ? (
          <form onSubmit={handleSubmitCustom} className="p-3 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="custom-name">Part name</Label>
              <Input
                id="custom-name"
                placeholder="e.g. Generic handlebar"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="custom-weight">Weight (g)</Label>
                <Input
                  id="custom-weight"
                  type="number"
                  min={0}
                  placeholder="Optional"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="custom-price">Price</Label>
                <Input
                  id="custom-price"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Optional"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={!customName.trim() || addPart.isPending}>
                {addPart.isPending ? 'Adding…' : 'Add custom part'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowCustomForm(false)}
              >
                Back
              </Button>
            </div>
            {addPart.isError && (
              <p className="text-xs text-destructive">{String(addPart.error)}</p>
            )}
          </form>
        ) : (
          <Command>
            <CommandInput placeholder={`Search ${componentLabel}…`} />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading…' : 'No parts in catalog. Add a custom part below.'}
              </CommandEmpty>
              <CommandGroup>
                {parts.map((part) => (
                  <CommandItem
                    key={part.id}
                    value={`${part.name} ${part.component}`}
                    onSelect={() => handleSelectPart(part)}
                    disabled={addPart.isPending}
                  >
                    <span className="truncate">{part.name}</span>
                    {(part.weightG != null || part.price != null) && (
                      <span className="ml-2 text-muted-foreground text-xs shrink-0">
                        {[part.weightG != null ? `${part.weightG}g` : null, part.price != null ? `${part.currency ?? ''} ${part.price}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </CommandItem>
                ))}
                <CommandItem
                  value={CUSTOM_PART_VALUE}
                  onSelect={() => setShowCustomForm(true)}
                  className="border-t mt-1 pt-2"
                >
                  + Add custom part
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}
