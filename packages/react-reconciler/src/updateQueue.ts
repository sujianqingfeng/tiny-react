import { Action } from 'shared/ReactTypes'

export interface Update<State> {
  action: Action<State>
}

export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null
  }
}

// 创建update
export const createUpdate = <State>(action: Action<State>) => {
  return {
    action
  }
}

// 创建队列
export const createUpdateQueue = <State>() => {
  return {
    shared: {
      pending: null
    }
  } as UpdateQueue<State>
}

// 添加update
export const enqueueUpdate = <State>(updateQueue: UpdateQueue<State>, update: Update<State>) => {
  updateQueue.shared.pending = update
}

// 消费update
export const processUpdateQueue = <State>(
  baseState: State,
  pendingUpdate: Update<State> | null
): {memoizedState: State} => {
  const result: ReturnType<typeof processUpdateQueue<State>> = {
    memoizedState: baseState
  }
  if (pendingUpdate) {
    // 是函數就調用獲取
    if (pendingUpdate.action instanceof Function) {
      result.memoizedState = pendingUpdate.action(baseState)
    } else {
      result.memoizedState = pendingUpdate.action
    }
  }
  return result
}
