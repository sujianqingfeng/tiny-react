import { Dispatch } from 'react/src/currentDispatcher'
import { Action } from 'shared/ReactTypes'
import { Lane } from './fiberLanes'

export interface Update<State> {
  action: Action<State>
  next: Update<any> | null
  lane: Lane
}

export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null
  },
  dispatch: Dispatch<State> | null
}

// 创建update
export const createUpdate = <State>(action: Action<State>, lane: Lane) => {
  return {
    action,
    lane,
    next: null
  }
}

// 创建队列
export const createUpdateQueue = <State>() => {
  return {
    shared: {
      pending: null
    },
    dispatch: null
  } as UpdateQueue<State>
}

// 添加update
export const enqueueUpdate = <State>(updateQueue: UpdateQueue<State>, update: Update<State>) => {
  // 这里是一个环状的链表
  const pending = updateQueue.shared.pending
  if (pending === null) {
    update.next = update
  } else {
    update.next = pending.next
    pending.next = update
  }
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
