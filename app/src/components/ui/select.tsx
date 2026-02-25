import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import {
  Select as RACSelect,
  SelectValue as RACSelectValue,
  Button as RACButton,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Popover,
} from "react-aria-components"

import { cn } from "@/lib/utils"

// Map Radix-style value/onValueChange to RAC selectedKey/onSelectionChange (string keys)
function Select({
  value,
  onValueChange,
  defaultValue,
  ...props
}: React.ComponentProps<typeof RACSelect> & {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}) {
  const selectedKey = value != null && value !== "" ? value : undefined
  const onSelectionChange = onValueChange
    ? (key: React.Key | null) => onValueChange(key != null ? String(key) : "")
    : undefined

  return (
    <RACSelect
      data-slot="select"
      selectedKey={selectedKey}
      defaultSelectedKey={defaultValue != null && defaultValue !== "" ? defaultValue : undefined}
      onSelectionChange={onSelectionChange}
      {...props}
    />
  )
}

function SelectGroup(props: React.ComponentProps<typeof ListBoxSection>) {
  return <ListBoxSection data-slot="select-group" {...props} />
}

function SelectValue({
  placeholder,
  ...props
}: { placeholder?: string } & React.ComponentProps<typeof RACSelectValue>) {
  return (
    <RACSelectValue
      data-slot="select-value"
      {...props}
    >
      {placeholder}
    </RACSelectValue>
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: Omit<React.ComponentProps<typeof RACButton>, "children"> & {
  size?: "sm" | "default"
  children?: React.ReactNode
}) {
  return (
    <RACButton
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 data-[size=default]:h-9 data-[size=sm]:h-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {({ defaultChildren }) => (
        <>
          {children ?? defaultChildren}
          <ChevronDownIcon className="size-4 opacity-50" aria-hidden />
        </>
      )}
    </RACButton>
  )
}

function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: React.ComponentProps<"div"> & {
  position?: "item-aligned" | "popper"
  align?: "start" | "center" | "end"
}) {
  return (
    <Popover
      placement={align === "start" ? "bottom start" : align === "end" ? "bottom end" : "bottom"}
      className={cn(
        "bg-popover text-popover-foreground z-50 max-h-[var(--available-height)] min-w-[8rem] overflow-auto rounded-md border p-1 shadow-md outline-none data-[entering]:animate-in data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[entering]:fade-in-0 data-[exiting]:zoom-out-95 data-[entering]:zoom-in-95",
        className
      )}
      {...props}
    >
      <ListBox className="outline-none" renderEmptyState={() => null}>
        {children}
      </ListBox>
    </Popover>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof ListBoxSection> & { className?: string }) {
  return (
    <ListBoxSection
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof ListBoxItem>, "children"> & { children?: React.ReactNode }) {
  return (
    <ListBoxItem
      data-slot="select-item"
      textValue={typeof children === "string" ? children : undefined}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[focus-visible]:bg-accent data-[focus-visible]:text-accent-foreground data-[selected]:bg-accent data-[selected]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {({ isSelected, defaultChildren }) => (
        <>
          <span className="flex flex-1 items-center gap-2 truncate">{children ?? defaultChildren}</span>
          <span className="absolute right-2 flex size-3.5 items-center justify-center">
            {isSelected ? <CheckIcon className="size-4" aria-hidden /> : null}
          </span>
        </>
      )}
    </ListBoxItem>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-separator"
      role="separator"
      className={cn("bg-border -mx-1 my-1 h-px pointer-events-none", className)}
      {...props}
    />
  )
}

// No-op scroll buttons for API compatibility; RAC ListBox handles scrolling
function SelectScrollUpButton(props: React.ComponentProps<"div">) {
  return <div data-slot="select-scroll-up-button" className="hidden" {...props} />
}

function SelectScrollDownButton(props: React.ComponentProps<"div">) {
  return <div data-slot="select-scroll-down-button" className="hidden" {...props} />
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
