// Google Identity Services (GIS) integration for authentic Google OAuth 2.0 popup
declare global {
  interface Window {
    google?: any
  }
}

export interface GoogleUserProfile {
  email: string
  name: string
  avatarUrl?: string
  googleId: string
  accessToken?: string
}

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client'
const STORAGE_CLIENT_ID_KEY = 'kendrick_google_oauth_client_id'

/**
 * Dynamically loads the official Google Identity Services client script if not already present.
 */
export function loadGoogleScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  if (window.google?.accounts?.oauth2 || window.google?.accounts?.id) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    // Check if script tag already exists
    const existingScript = document.querySelector(`script[src="${GSI_SCRIPT_URL}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', () =>
        reject(new Error('Failed to load Google Identity Services SDK'))
      )
      // If already loaded
      if (window.google?.accounts) {
        resolve()
      }
      return
    }

    const script = document.createElement('script')
    script.src = GSI_SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK from Google.'))
    document.head.appendChild(script)
  })
}

export const DEFAULT_GOOGLE_CLIENT_ID =
  '445805522914-u5ua7d7b14ritccqedlk7mpmj8ro0frf.apps.googleusercontent.com'

/**
 * Returns configured Google Client ID from environment variables, localStorage, or default.
 */
export function getGoogleClientId(): string {
  if (typeof window === 'undefined') return DEFAULT_GOOGLE_CLIENT_ID

  // 1. Vite environment variable (e.g. VITE_GOOGLE_CLIENT_ID)
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (envClientId && typeof envClientId === 'string' && envClientId.trim()) {
    return envClientId.trim()
  }

  // 2. Saved in localStorage
  try {
    const saved = localStorage.getItem(STORAGE_CLIENT_ID_KEY)
    if (saved && saved.trim()) {
      return saved.trim()
    }
  } catch {
    // ignore
  }

  return DEFAULT_GOOGLE_CLIENT_ID
}

/**
 * Saves Google Client ID to localStorage for future sessions.
 */
export function setSavedGoogleClientId(clientId: string): void {
  if (typeof window === 'undefined') return
  try {
    if (clientId.trim()) {
      localStorage.setItem(STORAGE_CLIENT_ID_KEY, clientId.trim())
    } else {
      localStorage.removeItem(STORAGE_CLIENT_ID_KEY)
    }
  } catch {
    // ignore
  }
}

/**
 * Opens Google's official OAuth 2.0 popup with prompt='select_account',
 * ensuring Google asks the user which of their actual Google accounts to use.
 */
export async function triggerGoogleOAuthPopup(
  explicitClientId?: string
): Promise<GoogleUserProfile> {
  await loadGoogleScript()

  const clientId = explicitClientId?.trim() || getGoogleClientId()
  if (!clientId) {
    throw new Error('NO_CLIENT_ID')
  }

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK is not available.')
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            let msg = tokenResponse.error_description || tokenResponse.error
            if (
              typeof msg === 'string' &&
              (msg.toLowerCase().includes('origin') || tokenResponse.error === 'access_denied')
            ) {
              msg = `${msg}. Make sure '${typeof window !== 'undefined' ? window.location.origin : ''}' is added to 'Authorized JavaScript origins' in Google Cloud Console.`
            }
            reject(
              new Error(
                msg || 'Google authentication was cancelled or encountered an error.'
              )
            )
            return
          }

          if (!tokenResponse.access_token) {
            reject(new Error('Google did not return an access token.'))
            return
          }

          try {
            // Retrieve real profile information from Google userinfo API
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            })

            if (!res.ok) {
              throw new Error('Failed to retrieve user profile from Google.')
            }

            const info = await res.json()
            resolve({
              email: info.email,
              name: info.name || info.email.split('@')[0],
              avatarUrl: info.picture,
              googleId: info.sub,
              accessToken: tokenResponse.access_token,
            })
          } catch (err: any) {
            reject(err)
          }
        },
      })

      // Request token with prompt: 'select_account' to force Google's account chooser popup
      tokenClient.requestAccessToken({ prompt: 'select_account' })
    } catch (err: any) {
      reject(err)
    }
  })
}
