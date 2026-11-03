// src/utils/push.ts
// Server notifications for signed-in viewers (supabase/functions/notify): this device's push subscription,
// saved with the account for the profile in use, so the notifier knows where to send that profile's news.
// Signed-out viewers keep the on-device checks instead (notifications.ts).
import { supabase } from "./supabase"
import { getSession } from "./sync"
import { getActiveProfile } from "./profiles"

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// The public key as bytes, which is how PushManager wants it
function keyBytes(base64url: string) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(base64url.length / 4) * 4, "=")
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

async function registration() {
  return "PushManager" in window ? navigator.serviceWorker.getRegistration() : undefined
}

const subscribe = (reg: ServiceWorkerRegistration) =>
  reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_KEY) })

// Subscribes this device if needed and saves it for the profile in use. False if push isn't possible here.
export async function savePushSubscription(): Promise<boolean> {
  const session = getSession()
  const reg = await registration()
  if (!supabase || !session || !VAPID_KEY || !reg) return false

  const save = async (sub: PushSubscription) => {
    const { endpoint, keys } = sub.toJSON()
    const { error } = await supabase!.from("push_subscriptions").upsert({
      endpoint,
      user_id: session.user.id,
      profile_id: getActiveProfile().id,
      p256dh: keys?.p256dh,
      auth: keys?.auth,
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    return !error
  }

  try {
    const existing = await reg.pushManager.getSubscription()
    if (await save(existing ?? (await subscribe(reg)))) return true
    // Still registered to another account (e.g. its sign-out was offline): start over with a new subscription
    await existing?.unsubscribe()
    return await save(await subscribe(reg))
  } catch {
    return false
  }
}

// Stops server notifications on this device (turning them off, or signing out)
export async function removePushSubscription() {
  const sub = await (await registration())?.pushManager.getSubscription()
  if (!sub) return
  await supabase?.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
  await sub.unsubscribe().catch(() => {})
}
