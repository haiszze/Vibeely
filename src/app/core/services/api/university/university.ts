import { University } from "../../../model/userprop.model"

export async function getUniversities(): Promise<University[]> {
  const res = await fetch('/api/university', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to load universities: ${res.status}`)
  }

  return res.json()
}