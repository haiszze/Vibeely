import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)

type Body = {
  sessionId?: string
  userProp?: {
    university?: string
    interests?: string[]
  }
}

type QueueResponse =
  | { status: "waiting"; room_id: null; matched_session_id: null }
  | { status: "matched"; room_id: string; matched_session_id: string }
  | { error: string }

function json(data: QueueResponse, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export async function POST(req: Request) {
  try {

    const body = (await req.json()) as Body
    const sessionId = body?.sessionId
    const universityId = body?.userProp?.university
    const interestIds = body?.userProp?.interests ?? []

    if (!sessionId) return json({ error: "Missing sessionId" }, { status: 400 })
    if (!universityId) return json({ error: "Missing userProp.university" }, { status: 400 })
    if (!Array.isArray(interestIds) || interestIds.length === 0) {
      return json({ error: "userProp.interests must be a non-empty array" }, { status: 400 })
    }

    const { data, error } = await supabase.rpc("matchmake", {
      p_session_id: sessionId,
      p_university_id: universityId,
      p_interest_ids: interestIds,
    })

    if (error) return json({ error: error.message }, { status: 500 })

    const row = Array.isArray(data) ? data[0] : data
    if (row?.status === "matched") {
      return json({
        status: "matched",
        room_id: String(row.room_id),
        matched_session_id: String(row.matched_session_id),
      })
    }

    return json({ status: "waiting", room_id: null, matched_session_id: null })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return json({ error: message }, { status: 500 })
  }
}