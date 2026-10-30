import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle, ShoppingBag } from 'lucide-react'

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [
      {
        title: "Staff Sign In | Admin Portal",
      },
      {
        name: 'description',
        content:
          "Secure administrative authentication portal for Kendrick's Shop staff.",
      },
    ],
  }),
  component: LoginPage,
})

function LoginPage() {
  const { isAuthenticated, signIn, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('shop@kendrickdev.shop')
  const [password, setPassword] = useState('admin123')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await signIn(email.trim(), password)
      navigate({ to: '/' })
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-md bg-card text-card-foreground p-6 sm:p-8 rounded-2xl border border-border/70 shadow-2xl space-y-6">
        {/* Brand / Title */}
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto font-bold shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Shop Administrator Login
          </h1>
          <p className="text-xs text-muted-foreground">
            Authenticate with your shop account to access system management.
          </p>
        </div>

        {/* Demo Credentials Tip */}
        <div className="p-3 bg-secondary/80 text-secondary-foreground rounded-xl border border-border/60 text-xs space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Default Shop Admin Credentials</span>
          </div>
          <div className="font-mono text-[11px] space-y-0.5 text-secondary-foreground/90">
            <div>Email: <strong className="text-foreground">shop@kendrickdev.shop</strong></div>
            <div>Password: <strong className="text-foreground">admin123</strong></div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/30 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>Admin Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@shop.com"
              className="w-full h-9.5 px-3 bg-secondary/60 rounded-lg border border-border/70 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-9.5 px-3 bg-secondary/60 rounded-lg border border-border/70 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-101"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>

        <div className="pt-2 border-t-0 text-center">
          <a
            href={
              typeof window !== 'undefined' && window.location.hostname.includes('kendrickdev.shop')
                ? 'https://shop.kendrickdev.shop'
                : 'http://localhost:9001'
            }
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Return to Public Storefront</span>
          </a>
        </div>
      </div>
    </div>
  )
}
