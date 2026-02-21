'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getBuildPartDisplayName, getBuildPartPartName } from '@/lib/buildPart'
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

interface PartComboboxProps {
  buildId: string
  componentKey: string
  componentLabel: string
  current: BuildPartWithPart | null
  onSuccess: () => void
  /** When set, new parts are created with this slot (scaffold-driven). */
  buildSlotId?: string | null
  /** For custom_* components: load parts from this group (component keys). */
  componentKeysInGroup?: string[]
  /** When set and current is null, show this as the button label (e.g. "Add chainring"). */
  addSlotLabel?: string
  /** When true, open the popover once (e.g. after adding a new row). */
  autoOpen?: boolean
  /** Called after auto-opening so parent can clear the trigger. */
  onAutoOpened?: () => void
}

export function PartCombobox({
  buildId,
  componentKey,
  componentLabel,
  current,
  onSuccess,
  buildSlotId,
  componentKeysInGroup,
  addSlotLabel,
  autoOpen,
  onAutoOpened,
}: PartComboboxProps) {
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    if (autoOpen) {
      setOpen(true)
      onAutoOpened?.()
    }
  }, [autoOpen, onAutoOpened])
  const [showCustomForm, setShowCustomForm] = React.useState(false)
  const [showDetailsView, setShowDetailsView] = React.useState(false)
  const [customName, setCustomName] = React.useState('')
  const [customWeight, setCustomWeight] = React.useState('')
  const [customPrice, setCustomPrice] = React.useState('')
  const [editName, setEditName] = React.useState('')
  const [editWeight, setEditWeight] = React.useState('')
  const [editPrice, setEditPrice] = React.useState('')
  const queryClient = useQueryClient()

  const currentPartId = current?.partId ?? (current as { part_id?: string | null })?.part_id ?? null
  const { data: allParts = [], isLoading } = useQuery<Part[]>({
    queryKey: ['parts', 'all'],
    queryFn: () => api.get<Part[]>('/api/parts'),
    enabled: open || currentPartId != null,
  })

  const parts = React.useMemo(() => {
    const sameTypeFirst = (a: Part, b: Part) => {
      const aMatch = componentKeysInGroup
        ? componentKeysInGroup.includes(a.component)
        : a.component === componentKey
      const bMatch = componentKeysInGroup
        ? componentKeysInGroup.includes(b.component)
        : b.component === componentKey
      return (bMatch ? 1 : 0) - (aMatch ? 1 : 0)
    }
    return [...allParts].sort(sameTypeFirst)
  }, [allParts, componentKey, componentKeysInGroup])

  const addPart = useMutation({
    mutationFn: async (body: { partId?: string; customName?: string; customWeightG?: number; customPrice?: number }) => {
      const isCustomPartBody = Boolean(body.customName?.trim())
      const isAdditionalComponentRow = current?.id && !current.partId

      if (isCustomPartBody && isAdditionalComponentRow) {
        return api.patch<BuildPartWithPart>(`/api/builds/${buildId}/parts/${current.id}`, {
          customName: body.customName!.trim(),
          ...(body.customWeightG != null && body.customWeightG > 0 && { customWeightG: body.customWeightG }),
          ...(body.customPrice != null && body.customPrice >= 0 && { customPrice: body.customPrice }),
        })
      }
      if (current?.id) {
        await api.delete(`/api/builds/${buildId}/parts/${current.id}`)
      }
      return api.post<BuildPartWithPart>(`/api/builds/${buildId}/parts`, {
        ...(buildSlotId && { buildSlotId }),
        ...(!buildSlotId && { component: componentKey }),
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

  const updateCustomPart = useMutation({
    mutationFn: ({
      buildPartId,
      customName,
      customWeightG,
      customPrice,
    }: {
      buildPartId: string
      customName: string
      customWeightG?: number
      customPrice?: number
    }) =>
      api.patch<BuildPartWithPart>(`/api/builds/${buildId}/parts/${buildPartId}`, {
        customName: customName.trim(),
        ...(customWeightG != null && customWeightG > 0 && { customWeightG }),
        ...(customPrice != null && customPrice >= 0 && { customPrice }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds', buildId, 'parts'] })
      onSuccess()
      setOpen(false)
    },
  })

  const removePart = useMutation({
    mutationFn: () => api.delete(`/api/builds/${buildId}/parts/${current!.id}`) as Promise<{ deleted: true }>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds', buildId, 'parts'] })
      onSuccess()
      setOpen(false)
    },
  })

  const hasChosenPart =
    current?.part != null ||
    (current?.partId != null) ||
    (currentPartId != null) ||
    (current != null && getBuildPartPartName(current) != null)
  const catalogNameById = currentPartId ? allParts.find((p) => p.id === currentPartId)?.name ?? null : null
  const resolvedPartName =
    current && hasChosenPart
      ? getBuildPartPartName(current) ?? catalogNameById ?? getBuildPartDisplayName(current)
      : null
  const displayLabel = hasChosenPart && current
    ? (resolvedPartName ?? getBuildPartDisplayName(current))
    : (addSlotLabel ?? `Choose part for ${componentLabel}…`)
  const showPlaceholderStyle = !hasChosenPart
  const isCustomPart = current != null && !current.partId && (current.customName != null || (current as { custom_name?: string }).custom_name != null)

  React.useEffect(() => {
    if (open) {
      setShowDetailsView(hasChosenPart)
      if (!hasChosenPart) setShowCustomForm(false)
      if (hasChosenPart && current && !current.partId) {
        const name = current.customName ?? (current as { custom_name?: string }).custom_name ?? ''
        setEditName(name)
        setEditWeight(current.customWeightG != null ? String(current.customWeightG) : '')
        setEditPrice(current.customPrice != null ? String(current.customPrice) : '')
      }
    }
  }, [open, hasChosenPart, current])

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

  const handleSaveCustomPart = (e: React.FormEvent) => {
    e.preventDefault()
    const name = editName.trim()
    if (!name || !current?.id) return
    updateCustomPart.mutate({
      buildPartId: current.id,
      customName: name,
      customWeightG: editWeight ? parseInt(editWeight, 10) : undefined,
      customPrice: editPrice ? parseFloat(editPrice) : undefined,
    })
  }

  const partName = current ? getBuildPartPartName(current) ?? getBuildPartDisplayName(current) : ''
  const partWeight = current?.part?.weightG ?? current?.customWeightG ?? (current as { custom_weight_g?: number })?.custom_weight_g
  const partPrice = current?.part?.price ?? current?.customPrice ?? (current as { custom_price?: number })?.custom_price
  const partCurrency = current?.part?.currency ?? current?.customCurrency ?? (current as { custom_currency?: string })?.custom_currency

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
        {showDetailsView && current ? (
          <div className="p-3 space-y-4">
            <h4 className="text-sm font-medium text-foreground">Part details</h4>
            {isCustomPart ? (
              <form onSubmit={handleSaveCustomPart} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Part name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Generic handlebar"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-weight">Weight (g)</Label>
                    <Input
                      id="edit-weight"
                      type="number"
                      min={0}
                      placeholder="Optional"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-price">Price</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="Optional"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm" disabled={!editName.trim() || !current?.id || updateCustomPart.isPending}>
                    {updateCustomPart.isPending ? 'Saving…' : 'Save'}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowDetailsView(false)}>
                    Change part
                  </Button>
                </div>
                {updateCustomPart.isError && (
                  <p className="text-xs text-destructive">{String(updateCustomPart.error)}</p>
                )}
              </form>
            ) : (
              <>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{partName}</dd>
                  </div>
                  {(partWeight != null || partPrice != null) && (
                    <div>
                      <dt className="text-muted-foreground">Weight / Price</dt>
                      <dd>
                        {[partWeight != null ? `${partWeight}g` : null, partPrice != null ? `${partCurrency ?? ''} ${partPrice}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowDetailsView(false)}>
                    Change part
                  </Button>
                </div>
              </>
            )}
            {removePart.isError && (
              <p className="text-xs text-destructive">{String(removePart.error)}</p>
            )}
          </div>
        ) : showCustomForm ? (
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
          <Command className="flex flex-col">
            <CommandInput placeholder={`Search ${componentLabel}…`} />
            <CommandList className="max-h-60 min-h-24">
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
              </CommandGroup>
            </CommandList>
            <div className="border-t p-1">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start text-sm font-normal"
                onClick={() => setShowCustomForm(true)}
                disabled={addPart.isPending}
              >
                + Add custom part
              </Button>
            </div>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}
