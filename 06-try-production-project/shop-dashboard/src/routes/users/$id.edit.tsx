import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import {
  fetchAdminUserById,
  updateAdminUser,
  type User,
} from '../../lib/api'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Users,
  CheckCircle2,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react'

export const Route = createFileRoute('/users/$id/edit')({
  component: EditUserPage,
})

function EditUserPage() {
  const { id } = useParams({ from: '/users/$id/edit' })
  const { token, user: currentUser } = useAuth()
  const navigate = useNavigate()

  const [targetUser, setTargetUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState<'shop' | 'customer'>('customer')

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadData = async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchAdminUserById(token, id)
      setTargetUser(data)
      setName(data.name || '')
      setEmail(data.email || '')
      setType(data.type)
    } catch (err: any) {
      setError(err.message || 'Failed to load user')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !name.trim() || !email.trim()) return

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const updated = await updateAdminUser(token, id, {
        name: name.trim(),
        email: email.trim(),
        type,
      })
      setTargetUser(updated)
      setSuccessMessage('User updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update user')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-2">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs">Loading user profile...</p>
      </div>
    )
  }

  const isMe = id === currentUser?.id

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 bg-card p-4 shadow-sm">
        <Link
          to="/users"
          className="p-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
          title="Back to Users"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span>Edit User</span>
            {isMe && (
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 font-bold uppercase">
                Your Account
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            Update account contact information or administrative privileges.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card p-5 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Full Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-9 px-3 bg-secondary text-xs text-foreground outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Email Address <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-9 px-3 bg-secondary text-xs text-foreground outline-none font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Account Role / Type</label>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={isMe}
              onClick={() => setType('customer')}
              className={`p-3 text-left transition-all cursor-pointer ${
                type === 'customer'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              } ${isMe ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <UserIcon className="w-4 h-4" />
                <span className="text-xs font-bold">Customer</span>
              </div>
              <p className="text-[10px] opacity-80">
                Can browse storefront, order items, and view purchase history.
              </p>
            </button>

            <button
              type="button"
              disabled={isMe}
              onClick={() => setType('shop')}
              className={`p-3 text-left transition-all cursor-pointer ${
                type === 'shop'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              } ${isMe ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold">Shop Admin</span>
              </div>
              <p className="text-[10px] opacity-80">
                Full privileges to access dashboard, edit inventory, and manage orders.
              </p>
            </button>
          </div>
          {isMe && (
            <p className="text-[10px] text-muted-foreground mt-1">
              You cannot demote your own administrator account.
            </p>
          )}
        </div>

        <div className="pt-3 flex items-center justify-end gap-2">
          <Link
            to="/users"
            className="h-9 px-4 bg-secondary text-secondary-foreground text-xs font-medium inline-flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            Back to List
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-9 px-5 bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
