import { getPushPublicKey, savePushSubscription, removePushSubscription } from "./push.functions";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function encodeKey(sub: PushSubscription, name: "p256dh" | "auth") {
  const key = sub.getKey(name);
  if (!key) return "";
  return btoa(String.fromCharCode(...new Uint8Array(key)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sameKey(left: ArrayBuffer | null, right: Uint8Array) {
  if (!left) return false;
  const current = new Uint8Array(left);
  return current.length === right.length && current.every((value, index) => value === right[index]);
}

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export async function registerPushWorker() {
  if (!pushSupported()) return null;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function enablePush(): Promise<"enabled" | "denied" | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  const permission =
    Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const reg = await registerPushWorker();
  if (!reg) return "unsupported";
  await navigator.serviceWorker.ready;

  const { publicKey } = await getPushPublicKey();
  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  let existing = await reg.pushManager.getSubscription();
  if (existing && !sameKey(existing.options.applicationServerKey, applicationServerKey)) {
    await existing.unsubscribe();
    existing = null;
  }
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    }));

  await savePushSubscription({
    data: {
      endpoint: sub.endpoint,
      p256dh: encodeKey(sub, "p256dh"),
      auth: encodeKey(sub, "auth"),
      userAgent: navigator.userAgent,
    },
  });
  return "enabled";
}

export async function disablePush() {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await removePushSubscription({ data: { endpoint: sub.endpoint } });
  await sub.unsubscribe();
}

export async function pushEnabled() {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return Boolean(await reg?.pushManager.getSubscription());
}

export function pushPermission() {
  if (!pushSupported()) return "unsupported" as const;
  return Notification.permission;
}
