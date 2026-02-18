'use client'

import { useState } from 'react'
import type { BuildPartWithPart } from '@/types/api'
import type { ComponentDef } from '@/types/api'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const GROUP_ORDER: string[] = [
  'Frameset',
  'Drivetrain',
  'Braking & control',
  'Wheelset',
  'Cockpit',
  'Other',
]

const CUSTOM_KEY_TO_GROUP: Record<string, string> = {
  custom_frameset: 'Frameset',
  custom_drivetrain: 'Drivetrain',
  custom_braking: 'Braking & control',
  custom_wheelset: 'Wheelset',
  custom_cockpit: 'Cockpit',
}

function computeTotals(parts: BuildPartWithPart[]): { totalWeightG: number; totalPrice: number; currency: string } {
  let totalWeightG = 0
  let totalPrice = 0
  let currency = 'USD'
  for (const bp of parts) {
    const qty = bp.quantity ?? 1
    const weight = bp.part?.weightG ?? bp.customWeightG ?? 0
    const price = bp.part?.price ?? bp.customPrice ?? 0
    const curr = bp.part?.currency ?? bp.customCurrency ?? 'USD'
    if (curr && currency === 'USD') currency = curr
    totalWeightG += (typeof weight === 'number' ? weight : 0) * qty
    totalPrice += (typeof price === 'number' ? price : 0) * qty
  }
  return { totalWeightG, totalPrice, currency }
}

function computeTotalsByGroup(
  parts: BuildPartWithPart[],
  components: ComponentDef[]
): Map<string, { weightG: number; price: number }> {
  const keyToGroup = new Map<string, string>()
  for (const c of components) keyToGroup.set(c.key, c.group)
  Object.entries(CUSTOM_KEY_TO_GROUP).forEach(([k, g]) => keyToGroup.set(k, g))
  const byGroup = new Map<string, { weightG: number; price: number }>()
  for (const bp of parts) {
    const group = keyToGroup.get(bp.component) ?? 'Other'
    const cur = byGroup.get(group) ?? { weightG: 0, price: 0 }
    const qty = bp.quantity ?? 1
    const weight = bp.part?.weightG ?? bp.customWeightG ?? 0
    const price = bp.part?.price ?? bp.customPrice ?? 0
    cur.weightG += (typeof weight === 'number' ? weight : 0) * qty
    cur.price += (typeof price === 'number' ? price : 0) * qty
    byGroup.set(group, cur)
  }
  return byGroup
}

function formatWeight(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`
  return `${g} g`
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface BuildSummaryProps {
  buildParts: BuildPartWithPart[]
  components: ComponentDef[]
}

export function BuildSummary({ buildParts, components }: BuildSummaryProps) {
  const [expanded, setExpanded] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const { totalWeightG, totalPrice, currency } = computeTotals(buildParts)
  const byGroup = computeTotalsByGroup(buildParts, components)
  const isEmpty = buildParts.length === 0

  return (
    <>
      {/* Desktop: floating glass card top-right */}
      <aside
        aria-label="Build summary"
        className={cn(
          'fixed right-4 top-24 z-40 hidden sm:block transition-[width]',
          expanded ? 'w-64' : 'w-52'
        )}
      >
        <div
          className="rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5"
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <div className="border-b border-white/10 px-4 py-2.5 dark:border-white/5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Build summary
            </span>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Weight</span>
              <span className="font-medium tabular-nums">
                {isEmpty ? '—' : formatWeight(totalWeightG)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium tabular-nums">
                {isEmpty ? '—' : formatPrice(totalPrice, currency)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between mt-2 text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? 'Hide breakdown' : 'Show breakdown'}
              {expanded ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
            </Button>
            {expanded && (
              <div className="pt-0.5 border-t border-white/10 dark:border-white/5 space-y-2">
                {GROUP_ORDER.filter((g) => byGroup.has(g)).map((groupName) => {
                  const row = byGroup.get(groupName)!
                  return (
                    <div key={groupName} className="flex justify-between text-xs">
                      <span className="text-muted-foreground truncate pr-2">{groupName}</span>
                      <span className="tabular-nums shrink-0">
                        {formatWeight(row.weightG)} · {formatPrice(row.price, currency)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile: sticky bottom bar, tappable to expand breakdown */}
      <div
        aria-label="Build summary"
        className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <div
          className="mx-3 mb-2 rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5"
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <button
            type="button"
            onClick={() => setMobileExpanded((e) => !e)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
            aria-expanded={mobileExpanded}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Summary
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tabular-nums">
                {isEmpty ? '—' : formatWeight(totalWeightG)}
              </span>
              <span className="text-sm font-medium tabular-nums">
                {isEmpty ? '—' : formatPrice(totalPrice, currency)}
              </span>
              {mobileExpanded ? (
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              ) : (
                <ChevronUpIcon className="size-4 text-muted-foreground" />
              )}
            </div>
          </button>
          {mobileExpanded && (
            <div className="border-t border-white/10 px-4 py-2 pb-3 dark:border-white/5 space-y-1.5">
              {GROUP_ORDER.filter((g) => byGroup.has(g)).map((groupName) => {
                const row = byGroup.get(groupName)!
                return (
                  <div key={groupName} className="flex justify-between text-xs">
                    <span className="text-muted-foreground truncate pr-2">{groupName}</span>
                    <span className="tabular-nums shrink-0">
                      {formatWeight(row.weightG)} · {formatPrice(row.price, currency)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
