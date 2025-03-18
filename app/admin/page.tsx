"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import UserManagement from "@/components/admin/UserManagement"
import { useAuth } from "@/lib/auth-context"

export default function AdminPanel() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page.",
        variant: "destructive",
      })
      router.push("/")
    }
  }, [user, isLoading, router, toast])

  if (isLoading || !user || user.role !== "admin") return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#00FF00]">Admin Dashboard</h1>
        <p className="text-gray-600">Manage user accounts and system settings</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Add, edit, or remove user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagement />
        </CardContent>
      </Card>
    </div>
  )
}

