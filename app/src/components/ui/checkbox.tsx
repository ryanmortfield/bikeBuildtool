import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as RACCheckbox } from "react-aria-components"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof RACCheckbox>) {
  return (
    <RACCheckbox
      data-slot="checkbox"
      className={cn(
        "peer border-input dark:bg-input/30 size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 dark:data-[selected]:bg-primary data-[selected]:bg-primary data-[selected]:border-primary data-[selected]:text-primary-foreground dark:data-[selected]:text-primary-foreground",
        className
      )}
      {...props}
    >
      {({ isSelected }) => (
        <>
          <span className="grid place-content-center text-current transition-none [.react-aria-Checkbox]:contents">
            {isSelected && <CheckIcon className="size-3.5" aria-hidden />}
          </span>
        </>
      )}
    </RACCheckbox>
  )
}

export { Checkbox }
