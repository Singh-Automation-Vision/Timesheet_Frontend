"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, Loader2, UserPlus, UserMinus, RefreshCw, Edit } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import UserView from "./UserView"

interface User {
  name: string
  email: string
  role: string
  country: string
  manager: string
  manager_email: string
  designation: string
  password?: string
}

type Mode = "none" | "add" | "remove" | "edit" | "edit-form" | "view"

interface UserViewProps {
  onBack: () => void
  users: User[]
}

export default function UserManagement() {
  const [mode, setMode] = useState<Mode>("none")
  const [newUser, setNewUser] = useState<User>({
    name: "",
    email: "",
    password: "",
    role: "user",
    country: "India",
    manager: "",
    manager_email: "",
    designation: "",
  })
  const [deleteUsername, setDeleteUsername] = useState("")
  const [editUsername, setEditUsername] = useState("")
  const [originalName, setOriginalName] = useState("") // Store the original name for API endpoint
  const [editUser, setEditUser] = useState<User>({
    name: "",
    email: "",
    password: "",
    role: "user",
    country: "India",
    manager: "",
    manager_email: "",
    designation: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const { toast } = useToast()

  const fetchUsers = async () => {
    setIsLoadingUsers(true)
    try {
      console.log("Fetching users from:", `${API_BASE_URL}/api/timesheet/showUser`)
      const response = await fetch(`${API_BASE_URL}/api/timesheet/showUser`)

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`)
      }

      const responseText = await response.text()
      console.log("Raw response text:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
        console.log("Parsed response data:", data)
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError)
        throw new Error("Invalid JSON response from server")
      }

      console.log("Data structure:", {
        hasDataProperty: data.hasOwnProperty("data"),
        dataType: data.data ? typeof data.data : "undefined",
        isDataArray: data.data ? Array.isArray(data.data) : false,
        dataLength: data.data && Array.isArray(data.data) ? data.data.length : "N/A",
      })

      const usersData = data.data || []
      console.log("Users data to be set:", usersData)

      setUsers(usersData)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, formType: "add" | "edit") => {
    const { name, value } = e.target
    if (formType === "add") {
      setNewUser((prev) => ({ ...prev, [name]: value }))
    } else {
      setEditUser((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string, formType: "add" | "edit") => {
    if (formType === "add") {
      setNewUser((prev) => ({ ...prev, [name]: value }))
    } else {
      setEditUser((prev) => ({ ...prev, [name]: value }))
    }
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
        designation: "",
      })
      setMode("none")

      // Refresh the user list
      fetchUsers()
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
      // Ensure username is a string
      const usernameString = String(deleteUsername).trim()
      console.log("Deleting user with username:", usernameString)

      // Using the email endpoint but sending the username as a string
      const response = await fetch(`${API_BASE_URL}/api/users/email/${encodeURIComponent(usernameString)}`, {
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

      // Refresh the user list
      fetchUsers()
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

  const handleFetchUserForEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Ensure username is a string
      const usernameString = String(editUsername).trim()
      console.log("Fetching user for edit:", usernameString)

      // Use API to fetch user data
      const response = await fetch(`${API_BASE_URL}/api/users/email/${usernameString}`)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch user: ${errorText}`)
      }

      const responseText = await response.text()
      console.log("Raw user response:", responseText)

      let parsedData
      try {
        parsedData = JSON.parse(responseText)
        console.log("Parsed user data:", parsedData)
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError)
        throw new Error("Invalid JSON response from server")
      }

      // Handle the array response format
      let userData
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        userData = parsedData[0]
        console.log("Extracted user data from array:", userData)
      } else {
        userData = parsedData
      }

      // Check if we have valid user data
      if (!userData || !userData.email) {
        throw new Error("User data not found in response")
      }

      console.log("User data for form:", userData)

      // Store the original name for the API endpoint
      setOriginalName(userData.name)

      // Set the edit user form with the fetched data
      setEditUser({
        name: userData.name || "",
        email: userData.email || "",
        password: "", // Don't populate password field for security
        role: userData.role || "user",
        country: userData.country || "India",
        manager: userData.manager || "",
        manager_email: userData.manager_email || "",
        designation: userData.designation || "",
      })

      // Switch to edit form mode
      setMode("edit-form")
    } catch (error) {
      console.error("Error fetching user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      console.log("Updating user data:", editUser)

      // Only send password if it's not empty
      const userData = { ...editUser }
      if (!userData.password) {
        delete userData.password
      }

      // Use the original name for the API endpoint but keep the same endpoint structure
      const nameString = encodeURIComponent(String(originalName).trim())
      console.log("Updating user with original name:", originalName)
      console.log("New user data to be sent:", userData)

      const response = await fetch(`${API_BASE_URL}/api/users/email/${nameString}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update user: ${errorText}`)
      }

      const result = await response.json()
      console.log("User updated successfully:", result)

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      // Reset the form
      setEditUser({
        name: "",
        email: "",
        password: "",
        role: "user",
        country: "India",
        manager: "",
        manager_email: "",
        designation: "",
      })
      setEditUsername("")
      setOriginalName("")
      setMode("none")

      // Refresh the user list
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
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
        <div className="flex gap-4 flex-wrap">
          <Button onClick={() => setMode("add")} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
          <Button onClick={() => setMode("edit")} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit User
          </Button>
          <Button onClick={() => setMode("view")} variant="outline" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View User
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
          <Input
            name="name"
            value={newUser.name}
            onChange={(e) => handleInputChange(e, "add")}
            placeholder="Full Name"
            required
          />
          <Input
            name="email"
            type="text"
            value={newUser.email}
            onChange={(e) => handleInputChange(e, "add")}
            placeholder="Username"
            required
          />
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              value={newUser.password}
              onChange={(e) => handleInputChange(e, "add")}
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
          <Input
            name="designation"
            value={newUser.designation}
            onChange={(e) => handleInputChange(e, "add")}
            placeholder="Designation"
          />
          <Select value={newUser.role} onValueChange={(value) => handleSelectChange("role", value, "add")}>
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] overflow-auto">
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={newUser.country} onValueChange={(value) => handleSelectChange("country", value, "add")}>
            <SelectTrigger>
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] overflow-auto">
              <SelectItem value="India">India</SelectItem>
              <SelectItem value="USA">USA</SelectItem>
            </SelectContent>
          </Select>
          <Input
            name="manager"
            value={newUser.manager}
            onChange={(e) => handleInputChange(e, "add")}
            placeholder="Manager Name"
          />
          <Input
            name="manager_email"
            type="email"
            value={newUser.manager_email}
            onChange={(e) => handleInputChange(e, "add")}
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

      {mode === "edit" && (
        <form onSubmit={handleFetchUserForEdit} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Edit User</h3>
            <Button type="button" variant="ghost" onClick={() => setMode("none")}>
              Cancel
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Enter the username of the user you want to edit.</p>
            <Input
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              "Fetch User Details"
            )}
          </Button>
        </form>
      )}

      {mode === "edit-form" && (
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Edit User: {editUser.name}</h3>
            <Button type="button" variant="ghost" onClick={() => setMode("none")}>
              Cancel
            </Button>
          </div>
          <Input
            name="name"
            value={editUser.name}
            onChange={(e) => handleInputChange(e, "edit")}
            placeholder="Full Name"
            required
          />
          <Input
            name="email"
            type="text"
            value={editUser.email}
            onChange={(e) => handleInputChange(e, "edit")}
            placeholder="Username"
            required
          />
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              value={editUser.password}
              onChange={(e) => handleInputChange(e, "edit")}
              placeholder="New Password (leave empty to keep current)"
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
          <Input
            name="designation"
            value={editUser.designation}
            onChange={(e) => handleInputChange(e, "edit")}
            placeholder="Designation"
          />
          <Select value={editUser.role} onValueChange={(value) => handleSelectChange("role", value, "edit")}>
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] overflow-auto">
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={editUser.country} onValueChange={(value) => handleSelectChange("country", value, "edit")}>
            <SelectTrigger>
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] overflow-auto">
              <SelectItem value="India">India</SelectItem>
              <SelectItem value="USA">USA</SelectItem>
            </SelectContent>
          </Select>
          <Input
            name="manager"
            value={editUser.manager}
            onChange={(e) => handleInputChange(e, "edit")}
            placeholder="Manager Name"
          />
          <Input
            name="manager_email"
            type="email"
            value={editUser.manager_email}
            onChange={(e) => handleInputChange(e, "edit")}
            placeholder="Manager Email"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update User"
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

      {mode === "view" && <UserView onBack={() => setMode("none")} />}

      {/* Members Table - Only show when not in view mode */}
      {mode !== "view" && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Members</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={isLoadingUsers}
              className="flex items-center gap-2"
            >
              {isLoadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>

          {isLoadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Username</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.email}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.designation || "-"}</TableCell>
                        <TableCell>{user.manager || "-"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

