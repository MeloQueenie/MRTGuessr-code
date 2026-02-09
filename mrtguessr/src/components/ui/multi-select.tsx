import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface MultiSelectOption {
  label: string
  value: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const selectedLabels = options
    .filter((opt) => selected.includes(opt.value))
    .map((opt) => opt.label)

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-slate-700",
          "bg-slate-800 px-3 py-2 text-sm text-white",
          "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "hover:bg-slate-700/50 transition-colors"
        )}
      >
        <span className={cn("truncate", selected.length === 0 && "text-gray-400")}>
          {selected.length === 0
            ? placeholder
            : selected.length === 1
            ? selectedLabels[0]
            : `${selected.length} selected`}
        </span>
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-sm hover:bg-slate-600 p-1 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-[9999] mt-2 w-full rounded-md border border-slate-700",
            "bg-slate-800 shadow-2xl"
          )}
        >
          <div className="max-h-60 overflow-auto p-1">
            {options.map((option) => {
              const isSelected = selected.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToggle(option.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-white",
                    "hover:bg-slate-700 transition-colors cursor-pointer",
                    "focus:outline-none focus:bg-slate-700",
                    isSelected && "bg-slate-700/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      isSelected
                        ? "border-cyan-500 bg-cyan-500"
                        : "border-slate-600"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-white">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
