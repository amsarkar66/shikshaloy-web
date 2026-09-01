"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectTrigger({
  className,
  children,
  invalid,
  ...props
}: SelectPrimitive.Trigger.Props & { invalid?: boolean }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-shadow focus:ring-2 data-popup-open:ring-2 dark:bg-zinc-800 dark:text-zinc-50",
        invalid
          ? "border-red-300 focus:ring-red-500/30 data-popup-open:ring-red-500/30 dark:border-red-500/50"
          : "border-gray-200 focus:ring-primary-500/40 data-popup-open:ring-primary-500/40 dark:border-zinc-700",
        className
      )}
      {...props}
    >
      {children}
    </SelectPrimitive.Trigger>
  )
}

function SelectValue(props: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className="truncate data-placeholder:text-gray-400 dark:data-placeholder:text-zinc-500"
      {...props}
    />
  )
}

function SelectIcon({ className, ...props }: SelectPrimitive.Icon.Props) {
  return (
    <SelectPrimitive.Icon
      data-slot="select-icon"
      className={cn("shrink-0 text-gray-400 dark:text-zinc-500", className)}
      {...props}
    >
      <ChevronDownIcon className="h-3.5 w-3.5" />
    </SelectPrimitive.Icon>
  )
}

function SelectContent({
  className,
  children,
  sideOffset = 4,
  align = "start",
  alignItemWithTrigger = false,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<SelectPrimitive.Positioner.Props, "align" | "sideOffset" | "alignItemWithTrigger">) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        className="z-50 outline-none"
        sideOffset={sideOffset}
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "z-50 max-h-(--available-height) w-(--anchor-width) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1.5 pl-2.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        // Disabled items can never show the checkmark, so they don't need
        // the space reserved for it — lets right-aligned content (like a
        // badge) sit flush to the edge instead of leaving a dead gap.
        props.disabled ? "pr-2.5" : "pr-8",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex-1 min-w-0">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center justify-center">
        <CheckIcon className="h-3.5 w-3.5" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SimpleSelect({
  value, onValueChange, options, placeholder, className, invalid,
}: {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
  invalid?: boolean
}) {
  return (
    <Select
      value={value === "" ? null : value}
      onValueChange={(v) => onValueChange((v as string | null) ?? "")}
    >
      <SelectTrigger invalid={invalid} className={className}>
        <SelectValue>{(v: string | null) => options.find((o) => o.value === v)?.label ?? placeholder ?? ""}</SelectValue>
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { Select, SelectTrigger, SelectValue, SelectIcon, SelectContent, SelectItem, SimpleSelect }
