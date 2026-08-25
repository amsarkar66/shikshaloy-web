"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar, parseISODate, parseISOMonth, toISODate } from "@/components/ui/calendar"

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

/** Groups digits into "/"-joined chunks as the user types, e.g. groups [2,2,4] -> "24/08/2026". */
function maskDigits(raw: string, groups: number[]) {
  const total = groups.reduce((a, b) => a + b, 0)
  const digits = raw.replace(/\D/g, "").slice(0, total)
  const parts: string[] = []
  let i = 0
  for (const g of groups) {
    if (digits.length <= i) break
    parts.push(digits.slice(i, i + g))
    i += g
  }
  return parts.join("/")
}

function dateToText(value?: string | null) {
  const d = parseISODate(value)
  return d ? `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}` : ""
}

function parseDateText(text: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text)
  if (!m) return null
  const day = Number(m[1]), month = Number(m[2]), year = Number(m[3])
  if (month < 1 || month > 12 || day < 1) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return toISODate(date)
}

function monthToText(value?: string | null) {
  const d = parseISOMonth(value)
  return d ? `${pad2(d.getMonth() + 1)}/${d.getFullYear()}` : ""
}

function parseMonthText(text: string): string | null {
  const m = /^(\d{2})\/(\d{4})$/.exec(text)
  if (!m) return null
  const month = Number(m[1]), year = Number(m[2])
  if (month < 1 || month > 12) return null
  return `${year}-${pad2(month)}`
}

function isInRange(value: string, min?: string, max?: string) {
  const d = parseISODate(value) ?? parseISOMonth(value)
  if (!d) return true
  if (min) {
    const mn = parseISODate(min)
    if (mn && d < mn) return false
  }
  if (max) {
    const mx = parseISODate(max)
    if (mx && d > mx) return false
  }
  return true
}

function fieldClassName(invalid: boolean | undefined, className: string | undefined) {
  return cn(
    "flex h-9 w-full items-center gap-2 rounded-lg border bg-white pl-3 pr-8 text-left text-sm outline-none transition-shadow focus-within:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800",
    invalid
      ? "border-red-300 focus-within:ring-red-500/30 dark:border-red-500/50"
      : "border-gray-200 focus-within:border-primary-400 focus-within:ring-primary-500/20 dark:border-zinc-700",
    className
  )
}

type PickerFieldProps = {
  text: string
  onTextChange: (text: string) => void
  onCommitBlur: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
  placeholder: string
  disabled?: boolean
  invalid?: boolean
  id?: string
  className?: string
  children: React.ReactNode
}

function PickerField({
  text,
  onTextChange,
  onCommitBlur,
  open,
  onOpenChange,
  placeholder,
  disabled,
  invalid,
  id,
  className,
  children,
}: PickerFieldProps) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <div className="relative">
        <PopoverPrimitive.Trigger
          nativeButton={false}
          disabled={disabled}
          render={
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              id={id}
              value={text}
              disabled={disabled}
              placeholder={placeholder}
              onChange={(e) => onTextChange(e.target.value)}
              onBlur={onCommitBlur}
              onKeyDown={(e) => {
                if (e.key === "Escape") onOpenChange(false)
                if (e.key === "Enter") {
                  e.preventDefault()
                  onOpenChange(false)
                }
              }}
              className={fieldClassName(invalid, className)}
            />
          }
        />
        <CalendarIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
      </div>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          className="isolate z-50 outline-none"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <PopoverPrimitive.Popup
            data-slot="date-picker-popup"
            initialFocus={false}
            finalFocus={false}
            className={cn(
              "z-50 w-auto origin-(--transform-origin) rounded-lg bg-popover p-2 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
            onMouseDown={(e) => e.preventDefault()}
          >
            {children}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export type DatePickerProps = {
  /** Omit along with `onChange` to use this as an uncontrolled field (e.g. a `name`d field inside a server-action `<form>`). */
  value?: string | null
  defaultValue?: string
  onChange?: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  id?: string
  name?: string
}

function DatePicker({
  value: valueProp,
  defaultValue,
  onChange,
  min,
  max,
  placeholder = "DD/MM/YYYY",
  className,
  disabled,
  required,
  invalid,
  id,
  name,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")
  const value = isControlled ? (valueProp ?? "") : internalValue
  const [text, setText] = React.useState(() => dateToText(value))

  React.useEffect(() => {
    setText(dateToText(value))
  }, [value])

  function commit(iso: string) {
    if (!isControlled) setInternalValue(iso)
    onChange?.(iso)
  }

  function handleTextChange(raw: string) {
    const masked = maskDigits(raw, [2, 2, 4])
    setText(masked)
    const iso = parseDateText(masked)
    if (iso && isInRange(iso, min, max)) commit(iso)
  }

  function handleBlur() {
    const iso = parseDateText(text)
    if (!iso || !isInRange(iso, min, max)) setText(dateToText(value))
  }

  return (
    <PickerField
      text={text}
      onTextChange={handleTextChange}
      onCommitBlur={handleBlur}
      open={open}
      onOpenChange={setOpen}
      placeholder={placeholder}
      disabled={disabled}
      invalid={invalid}
      id={id}
      className={className}
    >
      <Calendar
        value={value}
        min={min}
        max={max}
        onSelect={(v) => {
          commit(v)
          setOpen(false)
        }}
      />
      {name && <input type="hidden" name={name} value={value} required={required} />}
    </PickerField>
  )
}

export type MonthPickerProps = {
  value?: string | null
  onChange: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

function MonthPicker({
  value,
  onChange,
  min,
  max,
  placeholder = "MM/YYYY",
  className,
  disabled,
  id,
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState(() => monthToText(value))

  React.useEffect(() => {
    setText(monthToText(value))
  }, [value])

  function handleTextChange(raw: string) {
    const masked = maskDigits(raw, [2, 4])
    setText(masked)
    const iso = parseMonthText(masked)
    if (iso && isInRange(iso, min, max)) onChange(iso)
  }

  function handleBlur() {
    const iso = parseMonthText(text)
    if (!iso || !isInRange(iso, min, max)) setText(monthToText(value))
  }

  return (
    <PickerField
      text={text}
      onTextChange={handleTextChange}
      onCommitBlur={handleBlur}
      open={open}
      onOpenChange={setOpen}
      placeholder={placeholder}
      disabled={disabled}
      id={id}
      className={className}
    >
      <Calendar
        mode="month"
        value={value}
        min={min}
        max={max}
        onSelect={(v) => {
          onChange(v)
          setOpen(false)
        }}
      />
    </PickerField>
  )
}

export { DatePicker, MonthPicker }
