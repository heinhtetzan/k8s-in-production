import React, { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import {
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  KeyRound,
  ExternalLink,
  Settings,
} from 'lucide-react'
import {
  getGoogleClientId,
  setSavedGoogleClientId,
  triggerGoogleOAuthPopup,
  loadGoogleScript,
} from '../lib/google-auth'

function GoogleLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    isLoading: isAuthLoading,
  } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup' | 'google-setup' | 'google-custom'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<'customer' | 'shop'>('customer')
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleName, setGoogleName] = useState('')
  const [clientIdInput, setClientIdInput] = useState('')
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  // Pre-load Google script & client ID on modal open
  useEffect(() => {
    if (isAuthModalOpen) {
      setMode('signin')
      setError(null)
      setInfoMessage(null)
      setClientIdInput(getGoogleClientId())
      loadGoogleScript().catch(() => {})
    }
  }, [isAuthModalOpen])

  if (!isAuthModalOpen) return null

  /**
   * Main Google Sign-In Trigger:
   * If client ID is available, triggers Google's official OAuth popup (with prompt=select_account)
   * so Google asks which real Google account to use.
   * If not configured, opens the Google OAuth Setup screen.
   */
  const handleGoogleClick = async () => {
    setError(null)
    setInfoMessage(null)

    const existingClientId = getGoogleClientId()
    if (!existingClientId) {
      setMode('google-setup')
      return
    }

    setIsGoogleSigningIn(true)
    try {
      const userProfile = await triggerGoogleOAuthPopup(existingClientId)
      await signInWithGoogle({
        email: userProfile.email,
        name: userProfile.name,
        avatarUrl: userProfile.avatarUrl,
        googleId: userProfile.googleId,
      })
    } catch (err: any) {
      if (err.message === 'NO_CLIENT_ID') {
        setMode('google-setup')
      } else {
        setError(err.message || 'Google OAuth sign-in failed')
      }
    } finally {
      setIsGoogleSigningIn(false)
    }
  }

  /**
   * Saves Google Client ID and launches Google OAuth popup
   */
  const handleSaveClientIdAndLaunch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = clientIdInput.trim()
    if (!trimmed) {
      setError('Please provide a Google OAuth Client ID')
      return
    }

    setSavedGoogleClientId(trimmed)
    setIsGoogleSigningIn(true)
    try {
      const userProfile = await triggerGoogleOAuthPopup(trimmed)
      await signInWithGoogle({
        email: userProfile.email,
        name: userProfile.name,
        avatarUrl: userProfile.avatarUrl,
        googleId: userProfile.googleId,
      })
    } catch (err: any) {
      setError(err.message || 'Google OAuth sign-in failed. Please verify your Client ID and Authorized Origins.')
    } finally {
      setIsGoogleSigningIn(false)
    }
  }

  /**
   * Direct Google Account sign-in (allows user to enter their actual Google email)
   */
  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmedEmail = googleEmail.trim().toLowerCase()
    if (!trimmedEmail) {
      setError('Please enter your Google account email')
      return
    }

    const calculatedName = googleName.trim() || trimmedEmail.split('@')[0].replace(/[._]/g, ' ')
    const formattedName = calculatedName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=random&color=fff&bold=true`

    try {
      await signInWithGoogle({
        email: trimmedEmail,
        name: formattedName,
        avatarUrl,
      })
    } catch (err: any) {
      setError(err.message || 'Google authentication failed')
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name, type)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    }
  }

  const handleDemoShopLogin = async () => {
    setError(null)
    try {
      await signInWithEmail('shop@kendrickdev.shop', 'admin123')
    } catch (err: any) {
      setError(err.message || 'Demo shop user login failed')
    }
  }

  const handleDemoCustomerLogin = async () => {
    setError(null)
    try {
      await signInWithGoogle({
        email: 'customer.demo@kendrickdev.shop',
        name: 'Demo Customer',
        avatarUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      })
    } catch (err: any) {
      setError(err.message || 'Demo login failed')
    }
  }

  const isLoading = isAuthLoading || isGoogleSigningIn
  const configuredClientId = getGoogleClientId()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-card text-card-foreground rounded-2xl shadow-2xl overflow-hidden border border-border/70">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          {/* ================================================================= */}
          {/* VIEW 1: GOOGLE OAUTH SETUP / CLIENT ID CONFIGURATION             */}
          {/* ================================================================= */}
          {mode === 'google-setup' && (
            <div className="space-y-4">
              <div className="text-center pt-1 pb-1">
                <GoogleLogo className="w-8 h-8 mx-auto mb-2.5" />
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  Connect with Official Google OAuth
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  To open Google's account selection popup, Google requires an OAuth 2.0 Client ID.
                </p>
              </div>

              {error && (
                <div className="p-2.5 bg-destructive/10 text-destructive text-xs flex items-center gap-2 rounded-lg border border-destructive/30">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSaveClientIdAndLaunch} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Google OAuth Client ID
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      className="w-full h-8.5 pl-8 pr-3 bg-secondary/60 rounded-lg border border-border/70 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>How to get a Client ID from Google:</span>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary inline-flex items-center gap-0.5 hover:underline"
                    >
                      <span>Google Cloud Console</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <ol className="list-decimal list-inside space-y-0.5 pl-1">
                    <li>Go to <strong>APIs & Services &rarr; Credentials</strong>.</li>
                    <li>Click <strong>Create Credentials &rarr; OAuth client ID</strong>.</li>
                    <li>Application type: <strong>Web application</strong>.</li>
                    <li>Authorized JavaScript origins: <code className="bg-muted px-1 py-0.2">http://localhost:9001</code> and <code className="bg-muted px-1 py-0.2">https://kendrickdev.shop</code>.</li>
                  </ol>
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-8.5 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Open Google Sign-In Popup</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin')
                      setError(null)
                    }}
                    className="h-8.5 px-3 bg-secondary text-secondary-foreground font-medium text-xs rounded-lg border border-border/60 hover:bg-secondary/80 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {/* Direct email bypass option */}
              <div className="pt-2 border-t border-border/40 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('google-custom')
                    setError(null)
                  }}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  Or enter your Google account email directly without Client ID &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 2: GOOGLE DIRECT EMAIL SIGN-IN                              */}
          {/* ================================================================= */}
          {mode === 'google-custom' && (
            <div className="space-y-4">
              <div className="text-center pt-1 pb-1">
                <GoogleLogo className="w-8 h-8 mx-auto mb-2.5" />
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  Sign in with your Google Account
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter your Google account email to sign in to Kendrick's Shop
                </p>
              </div>

              {error && (
                <div className="p-2.5 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Your Google Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="e.g. your.email@gmail.com"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      className="w-full h-8.5 pl-8 pr-3 bg-secondary/60 rounded-lg border border-border/70 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Your Name <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Kendrick"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      className="w-full h-8.5 pl-8 pr-3 bg-secondary/60 rounded-lg border border-border/70 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-8.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Sign In with Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin')
                      setError(null)
                    }}
                    className="h-8.5 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium text-xs border border-border/60 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 3: STANDARD SIGNIN / SIGNUP MODAL                            */}
          {/* ================================================================= */}
          {(mode === 'signin' || mode === 'signup') && (
            <div>
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-2 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sign in to browse, track orders, or access your Kendrick's Shop account
                </p>
              </div>

              {error && (
                <div className="mb-4 p-2 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {infoMessage && (
                <div className="mb-4 p-2 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {/* Official Google Sign-In Button */}
              <div className="mb-4 space-y-1.5">
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={isLoading}
                  className="w-full h-9 flex items-center justify-center gap-2.5 px-3 rounded-lg border border-border/70 bg-secondary/80 text-secondary-foreground hover:bg-secondary hover:border-primary/50 font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isGoogleSigningIn ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <GoogleLogo className="w-4 h-4" />
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
                  <span>Sign in with your personal Google account</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('google-setup')
                      setError(null)
                    }}
                    className="inline-flex items-center gap-1 hover:text-foreground hover:underline cursor-pointer"
                    title="Configure Google OAuth Client ID"
                  >
                    <Settings className="w-3 h-3" />
                    <span>{configuredClientId ? 'Configured' : 'Configure Client ID'}</span>
                  </button>
                </div>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow bg-muted/50 h-px"></div>
                <span className="shrink-0 mx-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Or with email
                </span>
                <div className="flex-grow bg-muted/50 h-px"></div>
              </div>

              {/* Mode Switch Tabs */}
              <div className="flex p-1 bg-muted/60 rounded-xl mb-4 text-xs border border-border/50">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setError(null)
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                    mode === 'signin'
                      ? 'bg-background text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                    mode === 'signup'
                      ? 'bg-background text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Your Name
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          required
                          placeholder="Jane Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full h-8.5 pl-8 pr-3 bg-secondary/60 rounded-lg border border-border/70 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Account Role
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setType('customer')}
                          className={`h-8 rounded-lg text-center font-medium transition-all cursor-pointer border ${
                            type === 'customer'
                              ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                              : 'bg-secondary/70 text-secondary-foreground border-border/60 hover:bg-secondary'
                          }`}
                        >
                          Customer User
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('shop')}
                          className={`h-8 rounded-lg text-center font-medium transition-all cursor-pointer border ${
                            type === 'shop'
                              ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                              : 'bg-secondary/70 text-secondary-foreground border-border/60 hover:bg-secondary'
                          }`}
                        >
                          Shop Admin
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-8.5 pl-8 pr-3 bg-secondary/60 rounded-lg border border-border/70 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-8.5 pl-8 pr-3 bg-secondary/60 rounded-lg border border-border/70 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all flex items-center justify-center gap-2 mt-3 disabled:opacity-50 cursor-pointer shadow-xs hover:shadow-md hover:scale-101"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                </button>
              </form>

              {/* Quick Demo Logins */}
              <div className="mt-4 pt-3 border-t border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center mb-2 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>Quick Test Access</span>
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleDemoShopLogin}
                    className="h-8 px-2 rounded-lg border border-border/60 bg-secondary/70 hover:bg-secondary text-secondary-foreground text-center font-medium transition-colors cursor-pointer text-xs"
                  >
                    Shop Admin Login
                  </button>
                  <button
                    type="button"
                    onClick={handleDemoCustomerLogin}
                    className="h-8 px-2 rounded-lg border border-border/60 bg-secondary/70 hover:bg-secondary text-secondary-foreground text-center font-medium transition-colors cursor-pointer text-xs"
                  >
                    Customer Login
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
