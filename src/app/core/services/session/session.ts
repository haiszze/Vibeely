import { v4 as uuidv4 } from 'uuid';
import { UserProp } from '../../model/userprop.model';

export interface Session {
  sessionId: string
  userProp: UserProp
  createdAt: Date
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  
  const sessionData = window.sessionStorage.getItem('session')
  if (!sessionData) return null
  return JSON.parse(sessionData) as Session
}

export function setSession(user: UserProp): Session {
  const session: Session = {
    sessionId: uuidv4(),
    userProp: user,
    createdAt: new Date(),
  }
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('session', JSON.stringify(session))
  }
  return session
}

export function removeSession(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem('session')
  }
}