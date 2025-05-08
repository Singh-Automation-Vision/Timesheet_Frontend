"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Loader2 } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"

const criteria = ["Performance of the Day", "First Time Quality", "On-Time Delivery", "Engagement and Support"]

export default function MatricesPage() {
  const [ratings, setRatings] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    // Initialize with empty ratings
    setIsLoading(false)
  }, [])

  const handleRatingChange = (criterion: string, value: string) => {
    setRatings((prev) => ({ ...prev, [criterion]: value }))
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      // Create data object with email and date
      const matricesData = {
        email: user?.email || user?.name || "unknown@example.com", // Use email or name as fallback
        date: selectedDate,
        ratings: ratings,
      }

      // Add detailed logging of the data being sent
      console.log("Performance matrices data being sent to API:", JSON.stringify(matricesData, null, 2))
      console.log("Email:", matricesData.email)
      console.log("Date:", matricesData.date)
      console.log("Number of criteria rated:", Object.keys(ratings).length)
      console.log("Criteria with ratings:", Object.keys(ratings).join(", "))
      console.log("Rating values:", Object.values(ratings).join(", "))
      console.log("API endpoint:", `${API_BASE_URL}/api/matrices`)

      const response = await fetch(`${API_BASE_URL}/api/matrices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(matricesData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Matrices submission error:", response.status, errorText)
        throw new Error(`Server responded with ${response.status}: ${errorText || "Unknown error"}`)
      }

      const result = await response.json()
      console.log("Matrices submission successful:", result)

      toast({
        title: "Success",
        description: "Performance matrices saved successfully",
      })
    } catch (error) {
      console.error("Error saving matrices:", error)
      let errorMessage = "Failed to save matrices. Please try again."

      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const chartData = criteria.map((criterion) => ({
    name: criterion,
    value:
      ratings[criterion] === "Green" ? 3 : ratings[criterion] === "Yellow" ? 2 : ratings[criterion] === "Red" ? 1 : 0,
  }))

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#00FF00]">Performance Matrices</h1>
        <p className="text-gray-600">Rate your performance across various criteria</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {criteria.map((criterion) => (
            <div key={criterion} className="space-y-4">
              <h3 className="text-lg font-medium text-[#00FF00]">{criterion}</h3>
              <RadioGroup
                value={ratings[criterion] || ""}
                onValueChange={(value) => handleRatingChange(criterion, value)}
                className="flex space-x-6 justify-center"
              >
                {["Green", "Yellow", "Red"].map((color) => (
                  <div key={color} className="flex items-center">
                    <RadioGroupItem value={color} id={`${criterion}-${color}`} className="sr-only" />
                    <Label
                      htmlFor={`${criterion}-${color}`}
                      className={`w-10 h-10 rounded-full cursor-pointer flex items-center justify-center ${
                        color === "Green" ? "bg-green-500" : color === "Yellow" ? "bg-yellow-500" : "bg-red-500"
                      } ${ratings[criterion] === color ? "ring-2 ring-offset-2 ring-black" : ""}`}
                    >
                      {ratings[criterion] === color && <div className="w-3 h-3 bg-white rounded-full" />}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>
        <div className="flex flex-col h-full">
          <div className="flex-grow min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 3]} hide />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill={(entry) => {
                    switch (entry.value) {
                      case 3:
                        return "#00FF00" // Green
                      case 2:
                        return "#FFC107" // Yellow
                      case 1:
                        return "#FF0000" // Red
                      default:
                        return "#CCCCCC" // Grey for unrated
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-2">
          <Button
            onClick={handleSubmit}
            className="bg-[#00FF00] text-black hover:bg-[#00FF00]/90 mt-4 py-2 text-base w-full"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Matrices"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
