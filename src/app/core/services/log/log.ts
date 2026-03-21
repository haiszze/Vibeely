import { NextResponse } from "next/server"
import { QueueStatus } from "../../enum/queue.enum"


export type LogContext = Record<string, unknown>
export type LogLevel = "info" | "warn" | "error"

type LoggerOptions = {
  /** Optional endpoint to POST logs to (defaults to /api/log). */
  endpoint?: string
  /** Set false to disable shipping logs over the network. */
  enabled?: boolean
  /** Log to console even in production. */
  alwaysConsole?: boolean
}

let options: LoggerOptions = { enabled: true, alwaysConsole: false }

export function configureLogger(next: LoggerOptions) {
  options = { ...options, ...next }
}

function isDev() {
  return process.env.NODE_ENV !== "production"
}

function runtime(): "client" | "server" {
  return typeof window === "undefined" ? "server" : "client"
}

function safeJson(value: unknown) {
  const seen = new WeakSet<object>()
  return JSON.stringify(value, (_k, v) => {
    if (typeof v === "bigint") return v.toString()
    if (typeof v === "object" && v !== null) {
      if (seen.has(v as object)) return "[Circular]"
      seen.add(v as object)
    }
    return v
  })
}

function normalizeError(err: unknown) {
  if (!err) return undefined
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack }
  if (typeof err === "string") return { message: err }
  try {
    return { message: safeJson(err) }
  } catch {
    return { message: "Unknown error" }
  }
}

async function ship(event: unknown) {
  if (options.enabled === false) return

  const endpoint =
    options.endpoint ||
    (runtime() === "server" ? process.env.LOG_ENDPOINT : process.env.NEXT_PUBLIC_LOG_ENDPOINT) ||
    "/api/log"

  try {
    const body = safeJson(event)

    if (runtime() === "client" && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" })
      ;(navigator as Navigator).sendBeacon(endpoint, blob)
      return
    }

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
      keepalive: true,
    })
  } catch {
  }
}

function consoleOut(level: LogLevel, payload: unknown) {
  if (!isDev() && !options.alwaysConsole) return
  if (level === "error") console.error(payload)
  else if (level === "warn") console.warn(payload)
  else console.info(payload)
}

async function baseLog(level: LogLevel, message: string, err?: unknown, context?: LogContext) {
  const event = {
    level,
    message,
    error: normalizeError(err),
    context,
    ts: new Date().toISOString(),
    runtime: runtime(),
  }

  consoleOut(level, event)
  await ship(event)
}

export function logError(message: string, err?: unknown, context?: LogContext) {
  void baseLog("error", message, err, context)
}

export function logWarn(message: string, context?: LogContext) {
  void baseLog("warn", message, undefined, context)
}

export function logInfo(message: string, context?: LogContext) {
  void baseLog("info", message, undefined, context)
}

export function json(data: QueueStatus, init?: ResponseInit) {
  return NextResponse.json(data, init)
}
