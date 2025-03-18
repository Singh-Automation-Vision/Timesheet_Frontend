"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { API_BASE_URL } from "@/lib/api-config"

const criteria = ["Performance of the Day", "First Time Quality", "On-Time Delivery", "Engagement and Support"]

export default function PerformanceMatrix() {
  const [ratings, setRatings] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkSubmissionStatus()
  }, [])

  const checkSubmissionStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/performance-matrix/status`)
      if (response.ok) {
        const data = await response.json()
        setSubmitted(data.submitted)
        if (data.submitted) {
          setRatings(data.ratings)
        }
      } else {
        throw new Error("Failed to check submission status")
      }
    } catch (error) {
      console.error("Error checking submission status:", error)
      toast({
        title: "Error",
        description: "Failed to check submission status",
        variant: "destructive",
      })
    }
  }

  const handleRatingChange = (criterion: string, rating: string) => {
    setRatings((prevRatings) => ({ ...prevRatings, [criterion]: rating }))
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/performance-matrix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ratings),
      })
      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: result.message,
        })
        setSubmitted(true)
      } else {
        throw new Error("Failed to save performance matrix")
      }
    } catch (error) {
      console.error("Error saving performance matrix:", error)
      toast({
        title: "Error",
        description: "Failed to save performance matrix",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Matrix</CardTitle>
        <CardDescription>Rate your daily performance</CardDescription>
      </CardHeader>
      <CardContent>
        {criteria.map((criterion) => (
          <div key={criterion} className="mb-4">
            <h3 className="text-lg font-semibold mb-2">{criterion}</h3>
            <RadioGroup
              onValueChange={(value) => handleRatingChange(criterion, value)}
              value={ratings[criterion]}
              disabled={submitted}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Green" id={`${criterion}-green`} />
                <Label htmlFor={`${criterion}-green`}>Green</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Yellow" id={`${criterion}-yellow`} />
                <Label htmlFor={`${criterion}-yellow`}>Yellow</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Red" id={`${criterion}-red`} />
                <Label htmlFor={`${criterion}-red`}>Red</Label>
              </div>
            </RadioGroup>
          </div>
        ))}
        <Button onClick={handleSubmit} disabled={submitted}>
          {submitted ? "Submitted" : "Submit Performance Matrix"}
        </Button>
      </CardContent>
    </Card>
  )
}

