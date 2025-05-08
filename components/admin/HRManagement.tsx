"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import LeaveManagement from "./LeaveManagement"

type Mode = "none" | "leave-management"

export default function HRManagement() {
  const [mode, setMode] = useState<Mode>("none")
  const { toast } = useToast()

  return (
    <div className="space-y-6">
      {mode === "none" && (
        <div className="flex gap-4 flex-wrap">
          <Button onClick={() => setMode("leave-management")} className="flex items-center gap-2">
            Leave Management
          </Button>
        </div>
      )}

      {mode === "leave-management" && <LeaveManagement onBack={() => setMode("none")} />}
    </div>
  )
}
