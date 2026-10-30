import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import {
  fetchAdminUsers,
  deleteAdminUser,
  type User,
} from '../../lib/api'
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { TableRowSkeleton } from '../../components/StatCardSkeleton'

export const Route = createFileRoute('/users/')({
  head: () => ({
    meta: [
      {
        title: "User & Admin Accounts | Admin Portal",
      },
      {
        name: 'description',
        content:
          'Manage user accounts, assign admin roles, configure credentials, and review customer profiles.',
      },
    ],
  }),
  component: UsersListPage,
})

function UsersListPage() {
  const { token, user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'shop' | 'customer'>('all')

  const loadUsers = async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchAdminUsers(token)
      setUsers(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [token])

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUser?.id) {
      alert('You cannot delete your own active administrator account.')
      return
    }
    if (!token || !confirm(`Permanently remove user "${name}"?`)) return
    try {
      await deleteAdminUser(token, id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete user')
    }
  }

  const filtered = users.filter((u) => {
    const matchSearch =
      !searchTerm ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchRole = roleFilter === 'all' || u.type === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span>User Management</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage store administrators, staff permissions, and registered customer accounts.
          </p>
        </div>

        <Link
          to="/users/new"
          className="h-8 px-3.5 bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add User</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 pr-3 bg-secondary text-xs text-foreground outline-none w-56 sm:w-64"
            />
          </div>

          <Select
            value={roleFilter}
            onValueChange={(val) => setRoleFilter(val as any)}
          >
            <SelectTrigger size="sm" className="w-36 h-8">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="shop">Shop Admins</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          Total: {users.length} accounts
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Content */}
      {isLoading ? (
        <div className="bg-card text-card-foreground shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role / Account Type</th>
                <th className="p-3">Joined Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/20">
              <TableRowSkeleton cols={4} rows={6} />
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card p-12 text-center space-y-2 shadow-sm">
          <Users className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">No users found</h3>
          <p className="text-xs text-muted-foreground">Try adjusting your search criteria or role filter.</p>
        </div>
      ) : (
        <div className="bg-card text-card-foreground shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role / Account Type</th>
                <th className="p-3">Joined Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/20">
              {filtered.map((u) => {
                const isShop = u.type === 'shop'
                const isMe = u.id === currentUser?.id

                return (
                  <tr key={u.id} className="hover:bg-muted/10">
                    <td className="p-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-secondary text-secondary-foreground font-bold text-xs flex items-center justify-center shrink-0">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to="/users/$id/edit"
                            params={{ id: u.id }}
                            className="font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {u.name}
                          </Link>
                          {isMe && (
                            <span className="text-[9px] bg-primary/20 text-primary px-1 font-bold uppercase">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">{u.email}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      {isShop ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-primary text-primary-foreground">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Shop Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase bg-secondary text-secondary-foreground">
                          <UserIcon className="w-3 h-3" />
                          <span>Customer</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <Link
                        to="/users/$id/edit"
                        params={{ id: u.id }}
                        className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </Link>
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-1 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
