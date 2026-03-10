"use server"
import { NextResponse } from "next/server"
import { University } from "../../core/model/universityprop.model"
import { json, logError } from "../../core/services/log/log"

import { createBrowserClient } from "@supabase/ssr"

function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  try {
    const cfg = createClient()

    if(!cfg) {
      logError("university: missing supabase config", "SUPABASE_URL or SERVICE_ROLE_KEY not set")
      return json({ error: "Server misconfiguration" }, { status: 500 })
    }

    const { data, error } = await cfg.from("university").select("key, value").order("value", { ascending: true })
    const university = (data ?? []) as University[]

    if (error) {
      logError("university: supabase query failed", error)
      return json({ error: error.message }, { status: 500 })
    }

    return json(university)
    
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    logError("university: unhandled error", e, { message })
    return json({ error: message }, { status: 500 })
  }
}