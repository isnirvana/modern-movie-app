// src/hooks/useProfiles.ts
import { useSyncExternalStore } from "react"
import { getActiveProfile, getProfilesState, subscribeProfiles } from "../utils/profiles"

// All profiles and which one is active; re-renders when they change
export const useProfiles = () => useSyncExternalStore(subscribeProfiles, getProfilesState)

export const useActiveProfile = () => {
  useProfiles()
  return getActiveProfile()
}
