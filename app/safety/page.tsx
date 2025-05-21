"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"

const safetyQuestions = [
  "Are you wearing all required Personal Protective Equipment (PPE) for your task today?",
  "Have you inspected your tools, machines, or equipment for any visible damage or malfunction?",
  "Is your work area clean, organized, and free from slip/trip hazards?",
  "Are all emergency stop buttons and safety interlocks functional and accessible?",
  "Are all wires, cables, and hoses properly managed to avoid entanglement or tripping?",
  "Have you noticed safety protocols being properly followed around you today?",
  "Have you reviewed and acknowledged today's safety briefing or posted instructions?",
]

export default function SafetyPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const { toast } = useToast()
  const { user } = useAuth()

  const handleAnswerChange = (question: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [question]: value }))
  }

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (Object.keys(answers).length < safetyQuestions.length) {
      toast({
        title: "Incomplete",
        description: "Please answer all safety questions before submitting",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Create data object with the requested format
      const safetyData = {
        employee_name: user?.name || "Unknown User",
        date: selectedDate,
        safety_ratings: { ...answers },
      }

      console.log("Safety checklist data being sent to API:", JSON.stringify(safetyData, null, 2))

      const response = await fetch(`${API_BASE_URL}/api/safety`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(safetyData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Safety submission error:", response.status, errorText)
        throw new Error(`Server responded with ${response.status}: ${errorText || "Unknown error"}`)
      }

      const result = await response.json()
      console.log("Safety submission successful:", result)

      toast({
        title: "Success",
        description: "Safety checklist submitted successfully",
      })
    } catch (error) {
      console.error("Error saving safety checklist:", error)
      let errorMessage = "Failed to save safety checklist. Please try again."

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

  // Calculate completion percentage
  const completionPercentage = (Object.keys(answers).length / safetyQuestions.length) * 100

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#00FF00]">Daily Safety Checklist</h1>
        <p className="text-gray-600">Please answer all safety questions before starting your work</p>
      </div>

      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Completion: {completionPercentage.toFixed(0)}%</span>
          <span className="text-sm font-medium">
            {Object.keys(answers).length}/{safetyQuestions.length} questions
          </span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-2.5">
          <div className="bg-[#00FF00] h-2.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
        </div>
      </div>

      <div className="space-y-6">
        {safetyQuestions.map((question, index) => (
          <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start">
                <span className="bg-gray-200 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                  {index + 1}
                </span>
                <h3 className="text-lg font-medium">{question}</h3>
              </div>

              <RadioGroup
                value={answers[question] || ""}
                onValueChange={(value) => handleAnswerChange(question, value)}
                className="flex space-x-4 md:w-auto w-full justify-end"
              >
                <div className="flex items-center">
                  <RadioGroupItem value="Green" id={`${index}-Green`} className="sr-only" />
                  <Label
                    htmlFor={`${index}-Green`}
                    className={`flex items-center justify-center px-4 py-2 rounded-md cursor-pointer border ${
                      answers[question] === "Green"
                        ? "bg-green-100 border-green-500"
                        : "bg-white border-gray-300 hover:bg-green-50"
                    }`}
                  >
                    <CheckCircle
                      className={`w-5 h-5 mr-2 ${answers[question] === "Green" ? "text-green-500" : "text-gray-400"}`}
                    />
                    <span>Yes</span>
                  </Label>
                </div>

                <div className="flex items-center">
                  <RadioGroupItem value="Red" id={`${index}-Red`} className="sr-only" />
                  <Label
                    htmlFor={`${index}-Red`}
                    className={`flex items-center justify-center px-4 py-2 rounded-md cursor-pointer border ${
                      answers[question] === "Red"
                        ? "bg-red-100 border-red-500"
                        : "bg-white border-gray-300 hover:bg-red-50"
                    }`}
                  >
                    <AlertCircle
                      className={`w-5 h-5 mr-2 ${answers[question] === "Red" ? "text-red-500" : "text-gray-400"}`}
                    />
                    <span>No</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        className="bg-[#00FF00] text-black hover:bg-[#00FF00]/90 mt-8 py-2 text-base w-full"
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Safety Checklist"
        )}
      </Button>
    </div>
  )
}
