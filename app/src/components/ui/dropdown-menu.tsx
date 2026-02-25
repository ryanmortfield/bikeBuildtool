"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"
import {
  MenuTrigger,
  Menu,
  MenuItem,
  Separator,
  SubmenuTrigger,
  Popover,
  Section,
} from "react-aria-components"

import { cn } from "@/lib/utils"

function DropdownMenu({
  children,
  ...props
}: { children?: React.ReactNode } & Partial<{ onOpenChange: (open: boolean) => void }>) {
  return (
    <MenuTrigger {...props} data-slot="dropdown-menu">
      {children}
    </MenuTrigger>
  )
}

function DropdownMenuPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, { asChild?: boolean; children?: React.ReactNode }>(
  function DropdownMenuTrigger({ asChild, children, ...props }, ref) {
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>
      return React.cloneElement(child, {
        ...props,
        ref,
        "data-slot": "dropdown-menu-trigger",
      } as React.Attributes & { ref?: React.Ref<unknown>; className?: string })
    }
    return (
      <button type="button" ref={ref} data-slot="dropdown-menu-trigger" {...props}>
        {children}
      </button>
    )
  }
)

function DropdownMenuContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<"div"> & { sideOffset?: number }) {
  return (
    <Popover
      placement="bottom start"
      offset={sideOffset}
      className={cn(
        "bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-auto rounded-md border p-1 shadow-md outline-none data-[entering]:animate-in data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[entering]:fade-in-0 data-[exiting]:zoom-out-95 data-[entering]:zoom-in-95",
        className
      )}
      {...props}
    >
      <Menu className="outline-none" {...props}>
        {children}
      </Menu>
    </Popover>
  )
}

function DropdownMenuGroup(props: React.ComponentProps<typeof Section>) {
  return <Section data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenuItem> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <MenuItem
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 data-[focus-visible]:bg-accent data-[focus-visible]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: Omit<React.ComponentProps<typeof MenuItem>, "children"> & { checked?: boolean; children?: React.ReactNode }) {
  return (
    <MenuItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[focus-visible]:bg-accent data-[focus-visible]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {({ isSelected, defaultChildren }) => (
        <>
          <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
            {(checked ?? isSelected) && <CheckIcon className="size-4" aria-hidden />}
          </span>
          {children ?? defaultChildren}
        </>
      )}
    </MenuItem>
  )
}

function DropdownMenuRadioGroup({ children, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dropdown-menu-radio-group" role="group" {...props}>{children}</div>
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof MenuItem>, "children"> & { children?: React.ReactNode }) {
  return (
    <MenuItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[focus-visible]:bg-accent data-[focus-visible]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {({ isSelected, defaultChildren }) => (
        <>
          <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
            {isSelected && <CircleIcon className="size-2 fill-current" aria-hidden />}
          </span>
          {children ?? defaultChildren}
        </>
      )}
    </MenuItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", className)}
      role="presentation"
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn("text-muted-foreground ml-auto text-xs tracking-widest", className)}
      {...props}
    />
  )
}

function DropdownMenuSub({ children, ...props }: { children?: React.ReactNode }) {
  const arr = React.Children.toArray(children) as [React.ReactElement, React.ReactElement]
  return <SubmenuTrigger {...props}>{arr}</SubmenuTrigger>
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: Omit<React.ComponentProps<typeof MenuItem>, "children"> & { inset?: boolean; children?: React.ReactNode }) {
  return (
    <MenuItem
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "data-[focus-visible]:bg-accent data-[focus-visible]:text-accent-foreground data-[open]:bg-accent data-[open]:text-accent-foreground flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {({ defaultChildren }) => (
        <>
          {children ?? defaultChildren}
          <ChevronRightIcon className="ml-auto size-4" aria-hidden />
        </>
      )}
    </MenuItem>
  )
}

function DropdownMenuSubContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Popover
      placement="end top"
      className={cn(
        "bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-lg outline-none data-[entering]:animate-in data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[entering]:fade-in-0 data-[exiting]:zoom-out-95 data-[entering]:zoom-in-95",
        className
      )}
      {...props}
    >
      <Menu className="outline-none">{children}</Menu>
    </Popover>
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
