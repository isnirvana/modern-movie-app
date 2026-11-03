// src/hooks/useSession.ts
import { useSyncExternalStore } from "react"
import { getSession, subscribeSession } from "../utils/sync"

// The signed-in account's session, or null; re-renders on sign in / out
export const useSession = () => useSyncExternalStore(subscribeSession, getSession)
