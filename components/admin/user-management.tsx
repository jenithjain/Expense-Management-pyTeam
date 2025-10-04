"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"

type User = {
  id: string
  name: string
  email: string
  role: "Employee" | "Manager" | "Admin"
  managerId?: string
}

const seedUsers: User[] = [
  { id: "1", name: "Alice Johnson", email: "alice@acme.com", role: "Admin" },
  { id: "2", name: "Bob Smith", email: "bob@acme.com", role: "Manager" },
  { id: "3", name: "Carol Lee", email: "carol@acme.com", role: "Employee", managerId: "2" },
]

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(seedUsers)
  const [query, setQuery] = useState("")
  const [newUser, setNewUser] = useState<{ name: string; email: string; role: User["role"]; managerId?: string }>({
    name: "",
    email: "",
    role: "Employee",
    managerId: "2",
  })
  const { toast } = useToast()

  const managers = useMemo(() => users.filter((u) => u.role !== "Employee"), [users])
  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()),
      ),
    [users, query],
  )

  function updateUser(id: string, patch: Partial<User>) {
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-3">
        <div className="md:col-span-2">
          <Label htmlFor="search">Search users</Label>
          <Input
            id="search"
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-background/40">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* New user inline row */}
            <TableRow className="bg-background/40">
              <TableCell className="min-w-[180px]">
                <Input
                  placeholder="New user name"
                  value={newUser.name}
                  onChange={(e) => setNewUser((n) => ({ ...n, name: e.target.value }))}
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
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
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
                      <SelectItem key={m.id} value={m.id}>
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
                />
              </TableCell>
              <TableCell className="min-w-[160px]">
                <Button
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    if (!newUser.name || !newUser.email) return
                    const id = (Date.now() % 100000).toString()
                    setUsers((list) => [...list, { id, ...newUser } as User])
                    setNewUser({ name: "", email: "", role: "Employee", managerId: managers[0]?.id })
                  }}
                >
                  Add user
                </Button>
              </TableCell>
            </TableRow>

            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(v) => updateUser(u.id, { role: v as User["role"] })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employee">Employee</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={u.managerId} onValueChange={(v) => updateUser(u.id, { managerId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-foreground/80">{u.email}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    className="h-9"
                    onClick={() =>
                      toast({
                        title: "Password email sent",
                        description: `A temporary password has been sent to ${u.email}`,
                      })
                    }
                  >
                    Send password
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
