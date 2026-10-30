import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { createAdminUser } from '../../lib/api'
import { ArrowLeft, Save, Loader2, AlertCircle, Users, ShieldCheck, User as UserIcon } from 'lucide-react'

export const Route = createFileRoute('/users/new')({
  component: NewUserPage,
})

function NewUserPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [type, setType] = useState<'shop' | 'customer'>('customer')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !name.trim() || !email.trim()) return

    setIsSubmitting(true)
    setError(null)
    try {
      await createAdminUser(token, {
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
        type,
      })
      navigate({ to: '/users' })
    } catch (err: any) {
      setError(err.message || 'Failed to create user account')
      setIsSubmitting(false)
    }
  }

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
            <span>Create New User</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Register a new administrator or customer account.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
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
            placeholder="e.g. Kendrick Lamar"
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
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-9 px-3 bg-secondary text-xs text-foreground outline-none font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Password <span className="text-destructive">*</span>
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-9 px-3 bg-secondary text-xs text-foreground outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Account Role / Type</label>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setType('customer')}
              className={`p-3 text-left transition-all cursor-pointer ${
                type === 'customer'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
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
              onClick={() => setType('shop')}
              className={`p-3 text-left transition-all cursor-pointer ${
                type === 'shop'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
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
        </div>

        <div className="pt-3 flex items-center justify-end gap-2">
          <Link
            to="/users"
            className="h-9 px-4 bg-secondary text-secondary-foreground text-xs font-medium inline-flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-9 px-5 bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Create User</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
