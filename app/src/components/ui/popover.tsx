import * as React from "react"
import { DialogTrigger, Popover as RACPopover } from "react-aria-components"

import { cn } from "@/lib/utils"

type PopoverRootProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

function Popover({ open, onOpenChange, children }: PopoverRootProps) {
  const arr = React.Children.toArray(children)
  const trigger = arr[0]
  const contentNode = arr.find(
    (c): c is React.ReactElement<PopoverContentProps> =>
      React.isValidElement(c) && (c.type as React.FC) === PopoverContent
  )
  const contentProps = contentNode?.props ?? {}

  return (
    <DialogTrigger isOpen={open} onOpenChange={onOpenChange}>
      {trigger}
      <RACPopover
        placement={contentProps.align === "start" ? "bottom start" : "bottom"}
        offset={contentProps.sideOffset ?? 4}
        className={cn(
          "bg-popover text-popover-foreground z-50 w-72 rounded-md border p-4 shadow-md outline-none data-[entering]:animate-in data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[entering]:fade-in-0 data-[exiting]:zoom-out-95 data-[entering]:zoom-in-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2",
          contentProps.className
        )}
        style={
          contentProps.className?.includes("--trigger-width")
            ? { width: "var(--trigger-width)" }
            : undefined
        }
      >
        {contentProps.children}
      </RACPopover>
    </DialogTrigger>
  )
}

type PopoverTriggerProps = {
  asChild?: boolean
  children?: React.ReactNode
}

type TriggerProps = PopoverTriggerProps & { onPress?: (e: unknown) => void; onClick?: React.MouseEventHandler<HTMLButtonElement> }

const PopoverTrigger = React.forwardRef<HTMLButtonElement, TriggerProps>(
  function PopoverTrigger({ asChild, children, onPress, onClick, ...rest }, ref) {
    // RAC DialogTrigger passes onPress; native <button> only fires onClick. Call onPress on click so the popover opens.
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onPress?.(e)
      onClick?.(e)
    }
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ ref?: React.Ref<unknown>; onClick?: React.MouseEventHandler }>
      const childOnClick = child.props?.onClick
      const mergedOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        handleClick(e)
        childOnClick?.(e)
      }
      return React.cloneElement(child, {
        ...rest,
        ref,
        onClick: mergedOnClick,
      } as React.Attributes & { ref?: React.Ref<unknown> })
    }
    return (
      <button type="button" ref={ref} data-slot="popover-trigger" {...rest} onClick={handleClick}>
        {children}
      </button>
    )
  }
)

type PopoverContentProps = {
  className?: string
  align?: "start" | "center" | "end"
  sideOffset?: number
  children?: React.ReactNode
}

function PopoverContent(props: PopoverContentProps) {
  return <>{props.children}</>
}

function PopoverAnchor(props: React.ComponentProps<"div">) {
  return <div data-slot="popover-anchor" {...props} />
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-1 text-sm", className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <div
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
}
