import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Build } from '@/types/api'
import type { BuildPartWithPart } from '@/types/api'
import type { ComponentDef } from '@/types/api'
import type { Scaffold, ScaffoldSlot } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PartCombobox } from '@/components/PartCombobox'
import { AddCustomComponentDialog } from '@/components/AddCustomComponentDialog'
import { BuildSummary } from '@/components/BuildSummary'
import { getBuildPartDisplayName } from '@/lib/buildPart'
import { TEST_PARTS, TEST_PART_PREFIX } from '@/lib/testParts'
import type { Part } from '@/types/api'

const CUSTOM_COMPONENT_KEY_BY_GROUP: Record<string, string> = {
  'Frameset': 'custom_frameset',
  'Drivetrain': 'custom_drivetrain',
  'Braking & control': 'custom_braking',
  'Wheelset': 'custom_wheelset',
  'Cockpit': 'custom_cockpit',
}

function groupByGroup(components: ComponentDef[]): Map<string, ComponentDef[]> {
  const map = new Map<string, ComponentDef[]>()
  for (const c of components) {
    const list = map.get(c.group) ?? []
    list.push(c)
    map.set(c.group, list)
  }
  return map
}

/** Group build parts by slot (buildSlotId or component for legacy). */
function buildPartsBySlot(parts: BuildPartWithPart[]): Map<string, BuildPartWithPart[]> {
  const map = new Map<string, BuildPartWithPart[]>()
  for (const p of parts) {
    const key = p.buildSlotId ?? p.component
    const list = map.get(key) ?? []
    list.push(p)
    map.set(key, list)
  }
  return map
}

/** Flatten scaffold categories into slot by componentKey (first slot per key). */
function slotByComponentKey(scaffold: Scaffold | undefined): Map<string, ScaffoldSlot> {
  const map = new Map<string, ScaffoldSlot>()
  if (!scaffold) return map
  for (const cat of scaffold.categories) {
    for (const slot of cat.slots) {
      if (!map.has(slot.componentKey)) map.set(slot.componentKey, slot)
    }
  }
  return map
}

export function BuildDetail() {
  const { id } = useParams<{ id: string }>()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogGroup, setAddDialogGroup] = useState<string | null>(null)
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set())
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const queryClient = useQueryClient()

  const toggleSlotSelected = (slotId: string) => {
    setSelectedSlotIds((prev) => {
      const next = new Set(prev)
      if (next.has(slotId)) next.delete(slotId)
      else next.add(slotId)
      return next
    })
  }

  const { data: build, isLoading, error } = useQuery<Build>({
    queryKey: ['builds', id],
    queryFn: () => api.get<Build>(`/api/builds/${id}`),
    enabled: !!id,
  })
  const { data: buildParts = [] } = useQuery<BuildPartWithPart[]>({
    queryKey: ['builds', id, 'parts'],
    queryFn: () => api.get<BuildPartWithPart[]>(`/api/builds/${id}/parts`),
    enabled: !!id,
  })
  const { data: components = [] } = useQuery<ComponentDef[]>({
    queryKey: ['components'],
    queryFn: () => api.get<ComponentDef[]>('/api/components'),
  })
  const { data: scaffold } = useQuery<Scaffold>({
    queryKey: ['builds', id, 'scaffold'],
    queryFn: () => api.get<Scaffold>(`/api/builds/${id}/scaffold`),
    enabled: !!id,
  })

  const removePart = useMutation({
    mutationFn: (rowId: string) =>
      api.delete(`/api/builds/${id}/parts/${rowId}`) as Promise<{ deleted: true }>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds', id, 'parts'] })
    },
  })

  const createGroup = useMutation({
    mutationFn: (name: string) =>
      api.post<{ id: string; name: string }>(`/api/builds/${id}/groups`, {
        name,
        slotIds: Array.from(selectedSlotIds),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds', id, 'scaffold'] })
      setSelectedSlotIds(new Set())
      setGroupName('')
      setGroupDialogOpen(false)
    },
  })

  const createTestParts = useMutation({
    mutationFn: async () => {
      const existing = await api.get<Part[]>('/api/parts')
      const existingNames = new Set(existing.map((p) => p.name))
      for (const tp of TEST_PARTS) {
        if (!existingNames.has(tp.name)) {
          await api.post<Part>('/api/parts', {
            name: tp.name,
            component: tp.component,
            weightG: tp.weightG,
            price: tp.price,
            currency: tp.currency ?? 'USD',
          })
          existingNames.add(tp.name)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
    },
  })

  const fillBuildWithTestParts = useMutation({
    mutationFn: async () => {
      const [allParts, currentBuildParts, scaffoldData] = await Promise.all([
        api.get<Part[]>('/api/parts'),
        api.get<BuildPartWithPart[]>(`/api/builds/${id}/parts`),
        api.get<Scaffold>(`/api/builds/${id}/scaffold`),
      ])
      const testParts = allParts.filter((p) => p.name.startsWith(TEST_PART_PREFIX))
      const slotMapLocal = slotByComponentKey(scaffoldData)
      for (const bp of currentBuildParts) {
        await api.delete(`/api/builds/${id}/parts/${bp.id}`)
      }
      for (const comp of components) {
        const part = testParts.find((p) => p.component === comp.key)
        if (part) {
          const slot = slotMapLocal.get(comp.key)
          await api.post(`/api/builds/${id}/parts`, {
            ...(slot && { buildSlotId: slot.id }),
            ...(!slot && { component: comp.key }),
            partId: part.id,
          })
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds', id, 'parts'] })
    },
  })

  const partsBySlot = buildPartsBySlot(buildParts)
  const slotMap = slotByComponentKey(scaffold)
  const refetchParts = () => queryClient.invalidateQueries({ queryKey: ['builds', id, 'parts'] })

  /** Parts for a given slot (by slot id or component key for legacy). */
  const getPartsForSlot = (slot: ScaffoldSlot | undefined, componentKey: string): BuildPartWithPart[] => {
    if (!slot) return partsBySlot.get(componentKey) ?? []
    return partsBySlot.get(slot.id) ?? partsBySlot.get(componentKey) ?? []
  }

  if (isLoading || !id) return <p className="text-muted-foreground">Loading…</p>
  if (error || !build) return <p className="text-destructive">Build not found.</p>

  const groups = groupByGroup(components)

  return (
    <div className="relative pb-24 sm:pb-6 sm:pr-56">
      <BuildSummary buildParts={buildParts} components={components} />
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/builds">← Builds</Link>
          </Button>
        </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{build.name}</h1>
          <p className="text-muted-foreground">{build.bikeType}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => createTestParts.mutate()}
            disabled={createTestParts.isPending}
          >
            {createTestParts.isPending ? 'Creating…' : 'Create test parts'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fillBuildWithTestParts.mutate()}
            disabled={fillBuildWithTestParts.isPending}
          >
            {fillBuildWithTestParts.isPending ? 'Filling…' : 'Fill build with test parts'}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Build scaffold</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick a part for each component from the catalog or add a custom part. Use “Add additional component” under each section to add a new row with its own part picker.
          </p>
          {selectedSlotIds.size >= 2 && (
            <div className="flex items-center gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setGroupDialogOpen(true)}
              >
                Group selected ({selectedSlotIds.size})
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSlotIds(new Set())}
              >
                Clear selection
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          {Array.from(groups.entries()).map(([groupName, comps]) => {
            const customKey = CUSTOM_COMPONENT_KEY_BY_GROUP[groupName]
            const customSlot = customKey ? slotMap.get(customKey) : undefined
            const customParts = customKey ? getPartsForSlot(customSlot, customKey) : []
            const groupComponentKeys = comps.map((c) => c.key)

            return (
              <div key={groupName}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">{groupName}</h3>
                <div className="space-y-3">
                  {comps.map((comp) => {
                    const slot = slotMap.get(comp.key)
                    const list = getPartsForSlot(slot, comp.key)
                    const primary = list[0] ?? null
                    const extras = list.slice(1)
                    return (
                      <div key={comp.key} className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-2 sm:w-56 shrink-0 min-w-0">
                            {slot && (
                              <input
                                type="checkbox"
                                checked={selectedSlotIds.has(slot.id)}
                                onChange={() => toggleSlotSelected(slot.id)}
                                className="h-4 w-4 rounded border-input"
                                aria-label={`Select ${comp.label} for grouping`}
                              />
                            )}
                            <label className="text-sm font-medium truncate">
                              {comp.label}
                              {slot?.group && (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                  (Group: {slot.group.name})
                                </span>
                              )}
                            </label>
                          </div>
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <div className="min-w-0 max-w-sm flex-1">
                              <PartCombobox
                                buildId={id}
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
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removePart.mutate(primary.id)}
                                disabled={removePart.isPending}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                        {extras.length > 0 && (
                          <div className="sm:pl-[14.5rem] flex flex-wrap gap-2">
                            {extras.map((bp) => (
                              <span
                                key={bp.id}
                                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-sm"
                              >
                                {getBuildPartDisplayName(bp)}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => removePart.mutate(bp.id)}
                                  disabled={removePart.isPending}
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
                  {customParts.map((bp) => (
                    <div key={bp.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <label className="sm:w-56 shrink-0 text-sm font-medium">
                        {getBuildPartDisplayName(bp)}
                      </label>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <div className="min-w-0 max-w-sm flex-1">
                          <PartCombobox
                            buildId={id}
                            componentKey={customKey!}
                            componentLabel={getBuildPartDisplayName(bp)}
                            current={bp}
                            onSuccess={refetchParts}
                            buildSlotId={customSlot?.id}
                            componentKeysInGroup={groupComponentKeys}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removePart.mutate(bp.id)}
                          disabled={removePart.isPending}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAddDialogGroup(groupName)
                      setAddDialogOpen(true)
                    }}
                  >
                    Add additional component
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {id && addDialogGroup && (
        <AddCustomComponentDialog
          buildId={id}
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          groupName={addDialogGroup}
          componentKey={CUSTOM_COMPONENT_KEY_BY_GROUP[addDialogGroup]!}
          buildSlotId={slotMap.get(CUSTOM_COMPONENT_KEY_BY_GROUP[addDialogGroup]!)?.id}
        />
      )}

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create group</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Crankset"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setGroupDialogOpen(false)
                setGroupName('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const name = groupName.trim()
                if (name) createGroup.mutate(name)
              }}
              disabled={!groupName.trim() || createGroup.isPending}
            >
              {createGroup.isPending ? 'Creating…' : 'Create group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
