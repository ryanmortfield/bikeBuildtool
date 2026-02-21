'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import type { BuildPartWithPart } from '@/types/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const schema = z.object({
  customName: z.string().min(1, 'Name is required'),
})

type FormValues = z.infer<typeof schema>

interface AddCustomComponentDialogProps {
  buildId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  groupName: string
  componentKey: string
  /** When set, a new slot (row) is created first, then the part is added to it so the new row has a remove button. */
  categoryId?: string | null
  /** Called with the new slot id after the row and part are created (so the part picker can be auto-opened). */
  onAddedSlot?: (slotId: string) => void
}

export function AddCustomComponentDialog({
  buildId,
  open,
  onOpenChange,
  groupName,
  componentKey,
  categoryId,
  onAddedSlot,
}: AddCustomComponentDialogProps) {
  const queryClient = useQueryClient()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customName: '' },
  })

  const addPart = useMutation({
    mutationFn: async (body: FormValues) => {
      const name = body.customName.trim()
      let buildSlotId: string | undefined
      if (categoryId) {
        const slot = await api.post<{ id: string }>(
          `/api/builds/${buildId}/categories/${categoryId}/slots`,
          { componentKey }
        )
        buildSlotId = slot.id
      }
      const part = await api.post<BuildPartWithPart>(`/api/builds/${buildId}/parts`, {
        ...(buildSlotId && { buildSlotId }),
        ...(!buildSlotId && { component: componentKey }),
        customName: name,
        componentLabel: name,
      })
      return { part, slotId: buildSlotId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['builds', buildId, 'parts'] })
      queryClient.invalidateQueries({ queryKey: ['builds', buildId, 'scaffold'] })
      form.reset({ customName: '' })
      onOpenChange(false)
      if (data.slotId) onAddedSlot?.(data.slotId)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add additional component – {groupName}</DialogTitle>
          <DialogDescription>
            Give this custom component a name (e.g. Bottle cage, Computer mount). A new row will appear in the {groupName} section with a part picker.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => addPart.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="customName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Component name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Bottle cage" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addPart.isPending || !categoryId}>
                {addPart.isPending ? 'Adding…' : 'Add component'}
              </Button>
            </div>
            {addPart.isError && (
              <p className="text-sm text-destructive">{String(addPart.error)}</p>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
