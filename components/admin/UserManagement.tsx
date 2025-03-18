"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, Loader2, UserPlus, UserMinus } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"

interface User {
  id: string
  name: string
  email: string
  role: string
  country: string
  manager: string
  manager_email: string
}

type Mode = "none" | "add" | "remove"

export default function UserManagement() {
  const [mode, setMode] = useState<Mode>("none")
  const [newUser, setNewUser] = useState<Partial<User> & { password: string }>({
    name: "",
    email: "",
    password: "",
    role: "user",
    country: "India",
    manager: "",
    manager_email: "",
  })
  const [deleteUsername, setDeleteUsername] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      console.log("Submitting user data:", newUser)
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to add user: ${errorText}`)
      }

      const result = await response.json()
      console.log("User added successfully:", result)

      toast({
        title: "Success",
        description: "User added successfully",
      })

      // Reset the form
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "user",
        country: "India",
        manager: "",
        manager_email: "",
      })
      setMode("none")
    } catch (error) {
      console.error("Error adding user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Using the username endpoint instead of email
      const response = await fetch(`${API_BASE_URL}/api/users/email/${deleteUsername}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to delete user: ${errorText}`)
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      })

      setDeleteUsername("")
      setMode("none")
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="space-y-6">
      {mode === "none" && (
        <div className="flex gap-4">
          <Button onClick={() => setMode("add")} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
          <Button onClick={() => setMode("remove")} variant="destructive" className="flex items-center gap-2">
            <UserMinus className="h-4 w-4" />
            Remove User
          </Button>
        </div>
      )}

      {mode === "add" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Add New User</h3>
            <Button type="button" variant="ghost" onClick={() => setMode("none")}>
              Cancel
            </Button>
          </div>
          <Input name="name" value={newUser.name} onChange={handleInputChange} placeholder="Full Name" required />
          <Input
            name="email"
            type="email"
            value={newUser.email}
            onChange={handleInputChange}
            placeholder="Email Address"
            required
          />
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              value={newUser.password}
              onChange={handleInputChange}
              placeholder="Password"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <Select value={newUser.role} onValueChange={(value) => handleSelectChange("role", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={newUser.country} onValueChange={(value) => handleSelectChange("country", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="India">India</SelectItem>
              <SelectItem value="USA">USA</SelectItem>
            </SelectContent>
          </Select>
          <Input name="manager" value={newUser.manager} onChange={handleInputChange} placeholder="Manager Name" />
          <Input
            name="manager_email"
            type="email"
            value={newUser.manager_email}
            onChange={handleInputChange}
            placeholder="Manager Email"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add User"
            )}
          </Button>
        </form>
      )}

      {mode === "remove" && (
        <form onSubmit={handleDelete} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Remove User</h3>
            <Button type="button" variant="ghost" onClick={() => setMode("none")}>
              Cancel
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Enter the username of the user you want to remove.</p>
            <Input
              type="text"
              value={deleteUsername}
              onChange={(e) => setDeleteUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>
          <Button type="submit" variant="destructive" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove User"
            )}
          </Button>
        </form>
      )}
    </div>
  )
}

