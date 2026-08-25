"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function parseISODate(value?: string | null): Date | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

function parseISOMonth(value?: string | null): Date | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})$/.exec(value)
  if (!m) return null
  const date = new Date(Number(m[1]), Number(m[2]) - 1, 1)
  return Number.isNaN(date.getTime()) ? null : date
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function toISOMonth(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

type CalendarView = "day" | "month" | "year"

export type CalendarProps = {
  value?: string | null
  onSelect: (value: string) => void
  min?: string
  max?: string
  className?: string
  /** "date" picks a single day (default). "month" picks a calendar month (value/onSelect use "YYYY-MM"). */
  mode?: "date" | "month"
}

function Calendar({ value, onSelect, min, max, className, mode = "date" }: CalendarProps) {
  const selected = React.useMemo(
    () => (mode === "month" ? parseISOMonth(value) : parseISODate(value)),
    [value, mode]
  )
  const minDate = React.useMemo(() => parseISODate(min), [min])
  const maxDate = React.useMemo(() => parseISODate(max), [max])
  const today = React.useMemo(() => new Date(), [])

  const [view, setView] = React.useState<CalendarView>(mode === "month" ? "month" : "day")
  const [cursor, setCursor] = React.useState<Date>(() => selected ?? today)

  React.useEffect(() => {
    if (selected) setCursor(selected)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const isDisabled = React.useCallback(
    (d: Date) => {
      if (minDate && d < minDate) return true
      if (maxDate && d > maxDate) return true
      return false
    },
    [minDate, maxDate]
  )

  function selectDay(d: Date) {
    if (isDisabled(d)) return
    onSelect(toISODate(d))
  }

  function selectMonth(y: number, m: number) {
    const d = new Date(y, m, 1)
    if (mode === "month") {
      if (isDisabled(d)) return
      setCursor(d)
      onSelect(toISOMonth(d))
    } else {
      setCursor(d)
      setView("day")
    }
  }

  function goToMonth(delta: number) {
    setCursor(new Date(year, month + delta, 1))
  }

  function goToday() {
    setCursor(today)
    if (mode === "month") {
      if (!isDisabled(today)) onSelect(toISOMonth(today))
    } else {
      setView("day")
      selectDay(today)
    }
  }

  const dayCells = React.useMemo(() => {
    const firstOfMonth = new Date(year, month, 1)
    const startWeekday = firstOfMonth.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()

    return Array.from({ length: 42 }, (_, i) => {
      const dayNumber = i - startWeekday + 1
      let date: Date
      let outside = false
      if (dayNumber < 1) {
        date = new Date(year, month - 1, prevMonthDays + dayNumber)
        outside = true
      } else if (dayNumber > daysInMonth) {
        date = new Date(year, month + 1, dayNumber - daysInMonth)
        outside = true
      } else {
        date = new Date(year, month, dayNumber)
      }
      return { date, outside }
    })
  }, [year, month])

  const decadeStart = Math.floor(year / 12) * 12
  const yearCells = Array.from({ length: 12 }, (_, i) => decadeStart + i)

  return (
    <div className={cn("w-64 select-none", className)}>
      {view === "day" && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <NavButton onClick={() => goToMonth(-1)} label="Previous month">
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </NavButton>
            <button
              type="button"
              onClick={() => setView("month")}
              className="rounded-md px-2 py-1 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              {MONTHS_LONG[month]} {year}
            </button>
            <NavButton onClick={() => goToMonth(1)} label="Next month">
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </NavButton>
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="flex h-7 items-center justify-center text-[11px] font-medium text-gray-400 dark:text-zinc-500"
              >
                {w}
              </div>
            ))}
            {dayCells.map(({ date, outside }, i) => {
              const disabled = isDisabled(date)
              const isSelected = !!selected && isSameDay(date, selected)
              const isToday = isSameDay(date, today)
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(date)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md text-xs transition-colors",
                    outside && "text-gray-300 dark:text-zinc-600",
                    !outside && !isSelected && "text-gray-700 dark:text-zinc-300",
                    !isSelected && !disabled && "hover:bg-gray-100 dark:hover:bg-zinc-700",
                    isToday && !isSelected && "font-semibold text-primary-600 dark:text-primary-400",
                    isSelected && "bg-primary-500 text-white hover:bg-primary-500 font-semibold",
                    disabled && "cursor-not-allowed opacity-30 hover:bg-transparent"
                  )}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </>
      )}

      {view === "month" && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <NavButton onClick={() => setCursor(new Date(year - 1, month, 1))} label="Previous year">
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </NavButton>
            <button
              type="button"
              onClick={() => setView("year")}
              className="rounded-md px-2 py-1 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              {year}
            </button>
            <NavButton onClick={() => setCursor(new Date(year + 1, month, 1))} label="Next year">
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </NavButton>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MONTHS_SHORT.map((m, i) => {
              const disabled = isDisabled(new Date(year, i + 1, 0))
              const isSelected = !!selected && selected.getFullYear() === year && selected.getMonth() === i
              return (
                <button
                  key={m}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectMonth(year, i)}
                  className={cn(
                    "rounded-md py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-700",
                    isSelected && "bg-primary-500 text-white hover:bg-primary-500",
                    disabled && "cursor-not-allowed opacity-30 hover:bg-transparent dark:hover:bg-transparent"
                  )}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </>
      )}

      {view === "year" && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <NavButton onClick={() => setCursor(new Date(year - 12, month, 1))} label="Previous decade">
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </NavButton>
            <span className="rounded-md px-2 py-1 text-sm font-semibold text-gray-900 dark:text-zinc-100">
              {decadeStart} – {decadeStart + 11}
            </span>
            <NavButton onClick={() => setCursor(new Date(year + 12, month, 1))} label="Next decade">
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </NavButton>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {yearCells.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => {
                  setCursor(new Date(y, month, 1))
                  setView("month")
                }}
                className={cn(
                  "rounded-md py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-700",
                  !!selected && y === selected.getFullYear() && "bg-primary-500 text-white hover:bg-primary-500"
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-zinc-700/50">
        <button
          type="button"
          onClick={goToday}
          disabled={isDisabled(today)}
          className="rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-primary-400 dark:hover:bg-primary-500/10"
        >
          Today
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onSelect("")}
            className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

function NavButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
    >
      {children}
    </button>
  )
}

export { Calendar, parseISODate, parseISOMonth, toISODate, toISOMonth }
