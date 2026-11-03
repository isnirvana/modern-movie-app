// src/hooks/useSession.ts
import { useSyncExternalStore } from "react"
import { getSession, isSessionKnown, subscribeSession } from "../utils/sync"

// The signed-in account's session, or null; re-renders on sign in / out
export const useSession = () => useSyncExternalStore(subscribeSession, getSession)

// False until it's known whether there's a saved session
export const useSessionKnown = () => useSyncExternalStore(subscribeSession, isSessionKnown)
