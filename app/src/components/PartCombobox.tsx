'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  getBuildPartDisplayName,
  getBuildPartPartName,
  getBuildPartRowId,
  getPrimaryPartForSlot,
  mergeBuildPartIntoList,
} from '@/lib/buildPart'
import type { Part } from '@/types/api'
import type { BuildPartWithPart } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent } from '@/components/ui/popover'
import { ListBox, ListBoxItem, Button as RACButton } from 'react-aria-components'
import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface PartComboboxProps {
  buildId: string
  componentKey: string
  componentLabel: string
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
  onSuccess,
  buildSlotId,
  componentKeysInGroup,
  addSlotLabel,
  autoOpen,
  onAutoOpened,
}: PartComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
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
  const [notesValue, setNotesValue] = React.useState('')
  /** Build part row id we're editing notes for (captured when part is selected so save always uses correct id). */
  const [notesBuildPartId, setNotesBuildPartId] = React.useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: buildParts = [] } = useQuery<BuildPartWithPart[]>({
    queryKey: ['builds', buildId, 'parts'],
    queryFn: () => api.get<BuildPartWithPart[]>(`/api/builds/${buildId}/parts`),
    enabled: !!buildId,
  })
  const current = React.useMemo(
    () => getPrimaryPartForSlot(buildParts, buildSlotId ?? null, componentKey),
    [buildParts, buildSlotId, componentKey],
  )

  // When part details are shown, sync notes from current build part and set row id for saving
  React.useEffect(() => {
    if (showDetailsView && current) {
      const rowId = getBuildPartRowId(current)
      setNotesBuildPartId(rowId)
      setNotesValue(current?.notes ?? (current as { notes?: string })?.notes ?? '')
    }
  }, [showDetailsView, current])

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

  /** One list: all parts (catalog + user-created). Custom parts are real parts in the API. */
  const filteredParts = React.useMemo(() => {
    if (!searchQuery.trim()) return parts
    const q = searchQuery.toLowerCase().trim()
    return parts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.component ?? '').toLowerCase().includes(q)
    )
  }, [parts, searchQuery])

  const addPart = useMutation({
    mutationFn: async (body: { partId?: string; customName?: string; customWeightG?: number; customPrice?: number }) => {
      const buildPartRowId = getBuildPartRowId(current ?? null)
      if (buildPartRowId) {
        await api.delete(`/api/builds/${buildId}/parts/${buildPartRowId}`)
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
    onSuccess: async (data) => {
      queryClient.setQueryData<BuildPartWithPart[]>(['builds', buildId, 'parts'], (old) =>
        old ? mergeBuildPartIntoList(old, data) : old
      )
      await queryClient.refetchQueries({ queryKey: ['builds', buildId, 'parts'] })
      await queryClient.invalidateQueries({ queryKey: ['parts', 'all'] })
      onSuccess()
      setOpen(false)
      setShowCustomForm(false)
      setCustomName('')
      setCustomWeight('')
      setCustomPrice('')
    },
  })

  /** Save notes for the selected build part. */
  const saveDetails = useMutation({
    mutationFn: (payload: { buildPartId: string; notes?: string | null }) => {
      return api.patch<BuildPartWithPart>(`/api/builds/${buildId}/parts/${payload.buildPartId}`, {
        notes: payload.notes === '' ? null : payload.notes,
      })
    },
    onSuccess: async (data) => {
      queryClient.setQueryData<BuildPartWithPart[]>(['builds', buildId, 'parts'], (old) =>
        old ? mergeBuildPartIntoList(old, data) : old
      )
      await queryClient.refetchQueries({ queryKey: ['builds', buildId, 'parts'] })
      onSuccess()
      setOpen(false)
    },
  })

  const removePart = useMutation({
    mutationFn: () => api.delete(`/api/builds/${buildId}/parts/${getBuildPartRowId(current!) ?? current!.id}`) as Promise<{ deleted: true }>,
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['builds', buildId, 'parts'] })
      onSuccess()
      setOpen(false)
    },
  })

  const hasChosenPart = current?.part != null || (current?.partId != null) || (currentPartId != null) || (current != null && getBuildPartPartName(current) != null)
  const catalogNameById = currentPartId ? allParts.find((p) => p.id === currentPartId)?.name ?? null : null
  const resolvedPartName =
    current && hasChosenPart
      ? getBuildPartPartName(current) ?? catalogNameById ?? getBuildPartDisplayName(current)
      : null
  const displayLabel = hasChosenPart && current
    ? (resolvedPartName ?? getBuildPartDisplayName(current))
    : (addSlotLabel ?? `Choose part for ${componentLabel}…`)
  const showPlaceholderStyle = !hasChosenPart

  React.useEffect(() => {
    if (open) {
      setShowDetailsView(hasChosenPart)
      if (!hasChosenPart) setShowCustomForm(false)
    } else {
      setSearchQuery('')
    }
  }, [open, hasChosenPart])

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

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault()
    const buildPartId = notesBuildPartId ?? getBuildPartRowId(current ?? null)
    if (!buildPartId) return
    saveDetails.mutate({ buildPartId, notes: notesValue })
  }

  const partName = current ? getBuildPartPartName(current) ?? getBuildPartDisplayName(current) : ''
  const partWeight = current?.part?.weightG
  const partPrice = current?.part?.price
  const partCurrency = current?.part?.currency

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <RACButton
        aria-label={displayLabel}
        aria-expanded={open}
        className={cn(
          'inline-flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-medium shadow-xs outline-none transition-all hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:border-input dark:bg-input/30 dark:hover:bg-accent/50',
          showPlaceholderStyle && 'text-muted-foreground'
        )}
      >
        <span className="truncate">{displayLabel}</span>
      </RACButton>
      <PopoverContent className="w-[var(--trigger-width)] p-0" align="start">
        {showDetailsView && current ? (
          <div className="p-3 space-y-4">
            <h4 className="text-sm font-medium text-foreground">Part details</h4>
            <form onSubmit={handleSaveDetails} className="space-y-3">
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
              <div className="space-y-2 border-t pt-3">
                <Label htmlFor="part-notes">Notes</Label>
                <textarea
                  id="part-notes"
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="e.g. Installed with 165mm crank arms"
                  rows={3}
                  className="border-input bg-background placeholder:text-muted-foreground w-full resize-y rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!notesBuildPartId || saveDetails.isPending}
                >
                  {saveDetails.isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowDetailsView(false)}>
                  Change part
                </Button>
              </div>
              {saveDetails.isError && (
                <p className="text-xs text-destructive">{String(saveDetails.error)}</p>
              )}
              {!notesBuildPartId && (
                <p className="text-xs text-muted-foreground">This part cannot be updated.</p>
              )}
            </form>
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
          <div className="flex flex-col">
            <div className="flex h-9 items-center gap-2 border-b px-3">
              <SearchIcon className="size-4 shrink-0 opacity-50" aria-hidden />
              <Input
                placeholder={`Search ${componentLabel}…`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                aria-label={`Search ${componentLabel}`}
              />
            </div>
            {filteredParts.length > 0 ? (
              <ListBox
                aria-label={`${componentLabel} parts`}
                items={filteredParts}
                selectionMode="single"
                selectionBehavior="replace"
                onSelectionChange={(keys) => {
                  const key = keys === 'all' || typeof keys !== 'object' ? null : (keys as Set<React.Key>).values().next().value
                  if (key == null) return
                  const part = filteredParts.find((p) => p.id === key || p.id === String(key))
                  if (part) handleSelectPart(part)
                }}
                onAction={(key) => {
                  const part = filteredParts.find((p) => p.id === key || p.id === String(key))
                  if (part) handleSelectPart(part)
                }}
                className="max-h-60 min-h-24 overflow-auto p-1 outline-none"
              >
                {(part) => (
                  <ListBoxItem
                    id={part.id}
                    textValue={part.name}
                    isDisabled={addPart.isPending}
                    className="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[focus-visible]:bg-accent data-[focus-visible]:text-accent-foreground data-[selected]:bg-accent data-[selected]:text-accent-foreground"
                  >
                    <span className="truncate">{part.name}</span>
                    {(part.weightG != null || part.price != null) && (
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {[part.weightG != null ? `${part.weightG}g` : null, part.price != null ? `${part.currency ?? ''} ${part.price}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </ListBoxItem>
                )}
              </ListBox>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {isLoading ? 'Loading…' : searchQuery.trim() ? 'No matching parts.' : 'No parts in catalog. Add a custom part below.'}
              </p>
            )}
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
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
