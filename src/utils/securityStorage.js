// Remove sensitive caches made by older PWA versions, including before login.
export async function purgePrivateCaches(cacheStorage = globalThis.caches) {
  if (!cacheStorage) return;
  const names = await cacheStorage.keys();
  await Promise.all(names.filter((name) => name === "supabase-api" || name.startsWith("supabase-api-")).map((name) => cacheStorage.delete(name)));
}

export function clearAccountStorage(userId, storage = globalThis.localStorage) {
  if (!userId || !storage) return;
  const keys = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(`last_cat_${userId}_`) || key?.startsWith(`completed_notifs_${userId}_`)) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
}
