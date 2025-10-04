"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"

type User = {
  _id: string
  name: string
  email: string
  role: "employee" | "manager" | "admin"
  manager?: {
    _id: string
    name: string
  }
}

export function UserManagement() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [newUser, setNewUser] = useState<{ name: string; email: string; password: string; role: User["role"]; managerId?: string }>({
    name: "",
    email: "",
    password: "",
    role: "employee",
    managerId: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session?.user?.email) {
      fetchUsers()
    }
  }, [session?.user?.email])

  async function fetchUsers() {
    if (!session?.user?.email) return

    setLoading(true)
    try {
      const response = await fetch('/api/users/company')
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error: any) {
      toast({
        title: "Failed to load users",
        description: error.message,
        variant: "destructive",
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const managers = useMemo(() => users.filter((u) => u.role === "manager" || u.role === "admin"), [users])
  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()),
      ),
    [users, query],
  )

  async function handleAddUser() {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          managerId: newUser.managerId || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create user')
      }

      toast({
        title: "User created",
        description: `${newUser.name} has been added successfully.`,
      })

      // Refresh users list
      fetchUsers()

      // Reset form
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "employee",
        managerId: managers[0]?._id || "",
      })
    } catch (error: any) {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateRole(userId: string, newRole: User["role"]) {
    try {
      const response = await fetch('/api/users/update-role', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          newRole,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update role')
      }

      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      })

      // Update local state
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u))
    } catch (error: any) {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  async function handleAssignManager(userId: string, managerId: string) {
    try {
      const response = await fetch('/api/users/assign-manager', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          managerId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to assign manager')
      }

      toast({
        title: "Manager assigned",
        description: "Manager has been assigned successfully.",
      })

      // Refresh users list to get updated manager info
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Failed to assign manager",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-white">Loading users...</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-3">
        <div className="md:col-span-2">
          <Label htmlFor="search" className="text-white">Search users</Label>
          <Input
            id="search"
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-background/50 text-white border-border/50"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden bg-background/50">
        <Table>
          <TableHeader>
            <TableRow className="bg-background/60 border-b border-border/50">
              <TableHead className="text-white font-semibold">User</TableHead>
              <TableHead className="text-white font-semibold">Role</TableHead>
              <TableHead className="text-white font-semibold">Manager</TableHead>
              <TableHead className="text-white font-semibold">Email</TableHead>
              <TableHead className="text-white font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* New user inline row */}
            <TableRow className="bg-background/50 border-b border-border/30">
              <TableCell className="min-w-[180px]">
                <Input
                  placeholder="New user name"
                  value={newUser.name}
                  onChange={(e) => setNewUser((n) => ({ ...n, name: e.target.value }))}
                  className="bg-background/70 text-white border-border/50"
                />
              </TableCell>
              <TableCell className="min-w-[140px]">
                <Select
                  value={newUser.role}
                  onValueChange={(v) => setNewUser((n) => ({ ...n, role: v as User["role"] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="min-w-[160px]">
                <Select value={newUser.managerId} onValueChange={(v) => setNewUser((n) => ({ ...n, managerId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="min-w-[220px]">
                <Input
                  placeholder="email@company.com"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((n) => ({ ...n, email: e.target.value }))}
                  className="bg-background/70 text-white border-border/50"
                />
              </TableCell>
              <TableCell className="min-w-[160px]">
                <div className="flex flex-col gap-1">
                  <Input
                    placeholder="Password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser((n) => ({ ...n, password: e.target.value }))}
                    className="bg-background/70 text-white border-border/50"
                  />
                  <Button
                    size="sm"
                    className="h-9"
                    onClick={handleAddUser}
                    disabled={saving}
                  >
                    {saving ? "Adding..." : "Add user"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            {filtered.map((u) => (
              <TableRow key={u._id} className="border-b border-border/30">
                <TableCell className="font-medium text-white">{u.name}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(v) => handleUpdateRole(u._id, v as User["role"])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select 
                    value={u.manager?._id || ""} 
                    onValueChange={(v) => handleAssignManager(u._id, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-white/90">{u.email}</TableCell>
                <TableCell>
                  <span className="text-sm text-white/70">
                    {u.manager ? u.manager.name : "No manager"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            
            {filtered.length === 0 && users.length > 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-white/60">
                  No users found matching "{query}"
                </TableCell>
              </TableRow>
            )}
            
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-white/60">
                  No users yet. Add your first user above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
