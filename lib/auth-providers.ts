// The self-hosted GoTrue only answers Google sign-in once the provider is configured
// there; until then the button would end on a raw 400 page.
export const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
