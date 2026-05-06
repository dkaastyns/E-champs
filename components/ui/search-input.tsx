import * as React from "react"
import { X } from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Button } from "./button"

interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: (event: React.MouseEvent) => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value = "", ...props }, ref) => {
    const handleClear = (event: React.MouseEvent) => {
      if (onClear) {
        onClear(event)
      } else {
        // Fallback: emit empty change event
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set
        const eventSetter = (input: HTMLInputElement | null) => {
          if (input) {
            nativeInputValueSetter?.call(input, "")
            const inputEvent = new Event("input", { bubbles: true })
            input.dispatchEvent(inputEvent)
          }
        }
        eventSetter((ref as React.RefObject<HTMLInputElement>).current)
      }
    }

    return (
      <div className={cn("relative flex w-full max-w-md flex-1 md:w-80 lg:w-96", className)}>
        <Input
          ref={ref}
          placeholder="Search tournaments..."
          className="w-full pr-10 shadow-lg border-[#1a1a1a] bg-[#0d0d0d] placeholder:text-gray-500 focus:border-[#6520EE] focus:ring-1 focus:ring-[#6520EE]/20"
          value={value}
          {...props}
          onChange={(e) => {
            props.onChange?.(e)
            // No internal state update needed
          }}
        />
        {Boolean(value) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1.5 h-7 w-7 p-0 hover:bg-transparent"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
