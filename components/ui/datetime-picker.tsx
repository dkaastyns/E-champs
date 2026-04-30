"use client"

import * as React from "react"
import { format, setHours, setMinutes } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  disabled = false,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const hours = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i)
  }, [])

  const minutes = React.useMemo(() => {
    return [0, 15, 30, 45]
  }, [])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined)
      return
    }
    
    // Preserve time if already selected, otherwise default to 00:00
    if (value) {
      const newDate = new Date(date)
      newDate.setHours(value.getHours(), value.getMinutes())
      onChange(newDate)
    } else {
      onChange(date)
    }
  }

  const handleHourChange = (hour: string) => {
    if (!value) return
    const newDate = setHours(value, parseInt(hour))
    onChange(newDate)
  }

  const handleMinuteChange = (minute: string) => {
    if (!value) return
    const newDate = setMinutes(value, parseInt(minute))
    onChange(newDate)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal bg-[#1a1a1a] border-[#1a1a1a] text-white hover:bg-[#252525] hover:text-white",
            !value && "text-gray-400"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
          {value ? (
            format(value, "PPP p")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-[#0d0d0d] border-[#1a1a1a]" align="start">
        <div className="p-3">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            initialFocus
            className="bg-transparent"
          />
          
          <div className="border-t border-[#1a1a1a] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Time</span>
            </div>
            <div className="flex gap-2">
              <Select
                value={value ? value.getHours().toString() : undefined}
                onValueChange={handleHourChange}
                disabled={!value}
              >
                <SelectTrigger className="w-[100px] h-10 bg-[#1a1a1a] border-[#1a1a1a] text-white text-base data-[placeholder]:text-gray-400">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0d0d] border-[#1a1a1a]">
                  {hours.map((hour) => (
                    <SelectItem 
                      key={hour} 
                      value={hour.toString()}
                      className="text-white text-base hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] focus:text-white"
                    >
                      {hour.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-gray-400 self-center text-lg">:</span>
              
              <Select
                value={value ? value.getMinutes().toString() : undefined}
                onValueChange={handleMinuteChange}
                disabled={!value}
              >
                <SelectTrigger className="w-[100px] h-10 bg-[#1a1a1a] border-[#1a1a1a] text-white text-base data-[placeholder]:text-gray-400">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0d0d] border-[#1a1a1a]">
                  {minutes.map((minute) => (
                    <SelectItem 
                      key={minute} 
                      value={minute.toString()}
                      className="text-white text-base hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] focus:text-white"
                    >
                      {minute.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border-t border-[#1a1a1a] p-3">
            <Button
              onClick={() => setOpen(false)}
              disabled={!value}
              className="w-full bg-[#6520EE] hover:bg-[#7c3aed] text-white"
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
