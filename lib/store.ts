// A list of records kept both in the browser and on the server (Vercel KV), merged by updatedAt.
// The browser copy means nothing is lost if the server store is down; anything the server
// is missing is uploaded the next time the list is loaded.

export type Synced = { id: string; updatedAt: string }

export function createStore<T extends Synced>(name: string) {
  const localKey = `store_${name}`
  const url = `/api/store/${name}`

  function readLocal(): T[] {
    try {
      return JSON.parse(localStorage.getItem(localKey) ?? '[]')
    } catch {
      return []
    }
  }

  function writeLocal(items: T[]) {
    try {
      localStorage.setItem(localKey, JSON.stringify(items))
    } catch {}
  }

  function merge(...lists: T[][]): T[] {
    const byId = new Map<string, T>()
    for (const list of lists)
      for (const it of list) {
        const prev = byId.get(it.id)
        if (!prev || it.updatedAt > prev.updatedAt) byId.set(it.id, it)
      }
    return Array.from(byId.values())
  }

  function upload(items: T[]) {
    if (!items.length) return
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    }).catch(() => {})
  }

  return {
    async getAll(): Promise<T[]> {
      let remote: T[] | null = null
      try {
        const res = await fetch(url, { cache: 'no-store' })
        if (res.ok) remote = await res.json()
      } catch {}
      const all = merge(readLocal(), remote ?? [])
      writeLocal(all)
      if (remote) {
        const remoteVersion = new Map(remote.map((r) => [r.id, r.updatedAt]))
        upload(all.filter((it) => remoteVersion.get(it.id) !== it.updatedAt))
      }
      return all
    },
    /** Saves locally right away, then uploads. */
    save(items: T[]) {
      writeLocal(merge(readLocal(), items))
      upload(items)
    },
    readLocal,
  }
}
