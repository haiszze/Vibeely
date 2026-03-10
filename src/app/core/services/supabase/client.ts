
import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

export const createClient = (env?: string) => {
  let supabase

  if (env === "servicerole") {
    return supabase = createBrowserClient(supabaseUrl!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }

  return supabase = createBrowserClient(supabaseUrl!, supabaseKey!)
}
