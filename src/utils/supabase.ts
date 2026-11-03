// src/utils/supabase.ts
// The Supabase client (accounts & sync). Null when the site is built without Supabase settings:
// everything account-related then hides itself and the app works on this device only, as before.
import { createClient } from "@supabase/supabase-js"

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = URL && KEY ? createClient(URL, KEY) : null
