export interface UserProp  {
  name: string
  university: string
  interests: string[]
}

export interface Session {
  sessionId: string
  userProp: UserProp
  createdAt: Date
}

export function setSession(user: UserProp): Session {
  const session: Session = {
    sessionId: crypto.randomUUID(),
    userProp: user,
    createdAt: new Date(),
  }
  localStorage.setItem('session', JSON.stringify(session))
  return session
}

export function getSession(): Session | null {
  const sessionData = localStorage.getItem('session')
  if (!sessionData) return null
  return JSON.parse(sessionData) as Session
}

export function removeSession(): void {
  localStorage.removeItem('session')
}
