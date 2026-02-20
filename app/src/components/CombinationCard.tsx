'use client'

import * as React from 'react'
import { PartCombobox } from '@/components/PartCombobox'
import { getBuildPartDisplayName } from '@/lib/buildPart'
import type { BuildPartWithPart } from '@/types/api'
import type { ComponentDef } from '@/types/api'
import type { ScaffoldSlot } from '@/types/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const COMPOSITE_GROUP_LABELS: Record<string, string> = {
  crankset: 'Crankset',
}

interface CombinationCardProps {
  buildId: string
  compositeGroup: string
  components: ComponentDef[]
  partsBySlot: Map<string, BuildPartWithPart[]>
  slotByComponentKey: Map<string, ScaffoldSlot>
  removePart: (id: string) => void
  removePartPending: boolean
  refetchParts: () => void
}

function getPartsForSlot(
  partsBySlot: Map<string, BuildPartWithPart[]>,
  slot: ScaffoldSlot | undefined,
  componentKey: string
): BuildPartWithPart[] {
  if (!slot) return partsBySlot.get(componentKey) ?? []
  return partsBySlot.get(slot.id) ?? partsBySlot.get(componentKey) ?? []
}

export function CombinationCard({
  buildId,
  compositeGroup,
  components,
  partsBySlot,
  slotByComponentKey,
  removePart,
  removePartPending,
  refetchParts,
}: CombinationCardProps) {
  const groupLabel = COMPOSITE_GROUP_LABELS[compositeGroup] ?? compositeGroup
  const [collapsed, setCollapsed] = React.useState(false)
  const [hiddenSlotKeys, setHiddenSlotKeys] = React.useState<Set<string>>(() => new Set())

  const visibleComponents = components.filter((c) => !hiddenSlotKeys.has(c.key))
  const hiddenComponents = components.filter((c) => hiddenSlotKeys.has(c.key))
  const hasAnyPart = visibleComponents.some(
    (c) => getPartsForSlot(partsBySlot, slotByComponentKey.get(c.key), c.key).length > 0
  )
  const pieceCount = visibleComponents.reduce(
    (acc, c) => acc + getPartsForSlot(partsBySlot, slotByComponentKey.get(c.key), c.key).length,
    0
  )

  const hideRow = (key: string) => setHiddenSlotKeys((prev) => new Set(prev).add(key))
  const showRow = (key: string) => setHiddenSlotKeys((prev) => {
    const next = new Set(prev)
    next.delete(key)
    return next
  })

  return (
    <div
      className={cn(
        'rounded-2xl border bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden',
        'shadow-sm hover:shadow transition-shadow'
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <span
          className={cn(
            'text-muted-foreground transition-transform duration-200',
            collapsed ? '' : 'rotate-90'
          )}
        >
          ▸
        </span>
        <span className="text-sm font-semibold tracking-tight text-foreground">{groupLabel}</span>
        <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Combo
        </span>
        {hasAnyPart && (
          <span className="ml-auto text-xs text-muted-foreground">
            {pieceCount === 1 ? '1 piece' : `${pieceCount} pieces`}
          </span>
        )}
      </button>
      {!collapsed && (
        <div className="border-t border-border/50 px-4 pb-4 pt-2 space-y-3">
          <p className="text-xs text-muted-foreground">
            Add or remove rows below. Pick one part per row (complete crankset or build from pieces).
          </p>
          {visibleComponents.map((comp) => {
            const slot = slotByComponentKey.get(comp.key)
            const list = getPartsForSlot(partsBySlot, slot, comp.key)
            const primary = list[0] ?? null
            const extras = list.slice(1)
            return (
              <div key={comp.key} className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="sm:w-44 shrink-0 text-sm text-muted-foreground">
                    {comp.label}
                  </label>
                  <div className="flex-1 flex items-center gap-2 min-w-0 flex-wrap">
                    <div className="min-w-0 max-w-sm flex-1">
                      <PartCombobox
                        buildId={buildId}
                        componentKey={comp.key}
                        componentLabel={comp.label}
                        current={primary}
                        onSuccess={refetchParts}
                        buildSlotId={slot?.id}
                      />
                    </div>
                    {primary && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                        onClick={() => removePart(primary.id)}
                        disabled={removePartPending}
                        title="Remove part"
                      >
                        ×
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-muted-foreground hover:text-destructive h-8 px-2 text-xs"
                      onClick={() => hideRow(comp.key)}
                      title="Remove this row from combo"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                {extras.length > 0 && (
                  <div className="sm:pl-[11.5rem] flex flex-wrap gap-2">
                    {extras.map((bp) => (
                      <span
                        key={bp.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-1 text-xs"
                      >
                        {getBuildPartDisplayName(bp)}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removePart(bp.id)}
                          disabled={removePartPending}
                          title="Remove"
                        >
                          ×
                        </Button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          <div className="pt-2 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground"
                  disabled={hiddenComponents.length === 0}
                >
                  + Add row to combo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {hiddenComponents.length === 0 ? (
                  <DropdownMenuItem disabled>All pieces added</DropdownMenuItem>
                ) : (
                  hiddenComponents.map((comp) => (
                    <DropdownMenuItem
                      key={comp.key}
                      onSelect={() => showRow(comp.key)}
                    >
                      {comp.label}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  )
}
