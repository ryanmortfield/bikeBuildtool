import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import type { Build } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  name: z.string().min(1, 'Name is required'),
  bikeType: z.string().min(1, 'Bike type is required'),
})

type FormValues = z.infer<typeof schema>

export function BuildNew() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', bikeType: 'road' },
  })

  const create = useMutation({
    mutationFn: (body: FormValues) => api.post<Build>('/api/builds', body),
    onSuccess: (build) => {
      queryClient.invalidateQueries({ queryKey: ['builds'] })
      navigate(`/builds/${build.id}`)
    },
  })

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">New build</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create a build</CardTitle>
          <CardDescription>Give your build a name and bike type.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => create.mutate(values))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Gravel rig" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bikeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bike type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. road, gravel, mtb" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Creating…' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/builds')}
                >
                  Cancel
                </Button>
              </div>
              {create.isError && (
                <p className="text-sm text-destructive">{String(create.error)}</p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
