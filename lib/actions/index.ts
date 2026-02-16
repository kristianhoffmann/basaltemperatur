// lib/actions/index.ts
// Barrel Export für alle Server Actions

// Auth Actions
export {
  signUp,
  signIn,
  signOut,
  signInWithGoogle,
  resetPassword,
  updatePassword,
  deleteAccount,
  updateProfile,
} from './auth'

// Temperature Actions
export {
  saveTemperatureEntry,
  deleteTemperatureEntry,
  getTemperatureEntries,
  getEntryForDate,
} from './temperature'
