let syncQueue: ((...args: any) => void)[] | null = null
let isFlushingSyncQueue = false

export function scheduleSyncCallback(callback: (...args: any) => void) {
  if (syncQueue === null) {
    syncQueue = [callback]
  } else {
    syncQueue.push(callback)
  }
}

export function flushSyncCallback() {
  if (!isFlushingSyncQueue  && syncQueue) {
    console.log('flushSyncCallbacks')
    isFlushingSyncQueue = true
    try {
      syncQueue.forEach(callback => callback())
    } catch (e) {
      if (__DEV__) {
        console.error('flushSyncCallback', e)
      }
    } finally {
      isFlushingSyncQueue = false
      syncQueue = null
    }
  }
}