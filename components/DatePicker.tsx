"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  label?: string
  placeholder?: string
  className?: string
}

export default function DatePicker({
  value,
  onChange,
  label = "Date (MM-DD-YYYY)",
  placeholder = "MM-DD-YYYY",
  className = "",
}: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())

  const calendarRef = useRef<HTMLDivElement>(null)

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle date selection
  const handleDateSelect = (selectedDate: Date) => {
    // Format as MM-DD-YYYY
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0")
    const day = String(selectedDate.getDate()).padStart(2, "0")
    const year = selectedDate.getFullYear()

    onChange(`${month}-${day}-${year}`)
    setShowCalendar(false)
  }

  // Navigate to previous month
  const goToPrevMonth = () => {
    const newMonth = calendarMonth === 0 ? 11 : calendarMonth - 1
    const newYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear
    setCalendarMonth(newMonth)
    setCalendarYear(newYear)
  }

  // Navigate to next month
  const goToNextMonth = () => {
    const newMonth = calendarMonth === 11 ? 0 : calendarMonth + 1
    const newYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear
    setCalendarMonth(newMonth)
    setCalendarYear(newYear)
  }

  // Handle year change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = Number.parseInt(e.target.value)
    setCalendarYear(year)
  }

  // Handle month change
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = Number.parseInt(e.target.value)
    setCalendarMonth(month)
  }

  // Generate calendar days for specified month and year
  const generateCalendar = () => {
    // Get first day of month and total days in month
    const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay()
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()

    const days = []
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarYear, calendarMonth, day)
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(date)}
          className="w-8 h-8 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {day}
        </button>,
      )
    }

    return days
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Generate array of years for dropdown (10 years before and after current year)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <CalendarIcon className="h-4 w-4 text-gray-500" />
        <label className="text-sm font-medium">{label}</label>
      </div>
      <div className="flex w-full items-center space-x-2 relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          pattern="\d{2}-\d{2}-\d{4}"
          className="w-full"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowCalendar(!showCalendar)}
          className="px-2"
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>

        {showCalendar && (
          <div
            ref={calendarRef}
            className="absolute right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-10 p-2"
          >
            <div className="flex justify-between items-center mb-2">
              <button onClick={goToPrevMonth} className="p-1 rounded-full hover:bg-gray-200" type="button">
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center space-x-1">
                <select value={calendarMonth} onChange={handleMonthChange} className="text-sm p-1 border rounded">
                  {monthNames.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>

                <select value={calendarYear} onChange={handleYearChange} className="text-sm p-1 border rounded">
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button onClick={goToNextMonth} className="p-1 rounded-full hover:bg-gray-200" type="button">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Day headers */}
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {generateCalendar()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
