'use server'

import { University } from '@/src/app/core/model/universityprop.model'

export async function getUniversities(): Promise<University[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/university`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to load universities: ${res.status}`)
  }

  return res.json()
}