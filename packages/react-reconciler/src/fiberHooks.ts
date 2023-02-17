import { Dispatch, Dispatcher } from 'react/src/currentDispatcher'
import internals from 'shared/internals'
import { Action } from 'shared/ReactTypes'
import { FiberNode } from './fiber'
import { Lane, NoLane, requestUpdateLane } from './fiberLanes'
import { createUpdate, createUpdateQueue, enqueueUpdate, processUpdateQueue, UpdateQueue } from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'

// 当前渲染的fiber
let currentlyRenderingFiber: FiberNode | null = null
let workInProgressHook: Hook | null = null
let currentHook: Hook | null = null
let renderLane: Lane = NoLane
const { currentDispatcher } = internals

interface Hook {
  memoizedState: any
  updateQueue: unknown
  next: Hook | null
}

export function renderWithHooks(wip: FiberNode, lane: Lane) {
  // 赋值
  currentlyRenderingFiber = wip
  wip.memoizedState = null

  renderLane = lane

  const current = wip.alternate

  if (current !== null) {
    // update
    currentDispatcher.current = HooksDispatcherOnUpdate
  } else {
    // mount
    currentDispatcher.current = HooksDispatcherOnMount
  }

  const Component = wip.type
  const props = wip.pendingProps
  const children = Component(props)

  // 重置
  currentlyRenderingFiber = null
  workInProgressHook = null
  currentHook = null
  renderLane = NoLane
  return children
}

const HooksDispatcherOnMount: Dispatcher  = {
  useState: mountState
}

const HooksDispatcherOnUpdate: Dispatcher  = {
  useState: updateState
}

function updateState<State>(): [State, Dispatch<State>] {
  // 找到当前useState对应的hook数据
  const hook = updateWorkInProgressHook()

  const queue = hook.updateQueue as UpdateQueue<State>
  const pending = queue.shared.pending

  if (pending !== null) {
    const { memoizedState } = processUpdateQueue(hook.memoizedState, pending, renderLane)
    hook.memoizedState = memoizedState
  }

  return [hook.memoizedState, queue.dispatch as Dispatch<State>]
}

function mountState<State>(initialState: (() => State) | State): [State, Dispatch<State>] {
  // 找到当前useState对应的hook数据
  const hook = mountWorkInProgressHook()

  let memoizedState
  if (initialState instanceof Function) {
    memoizedState = initialState()
  } else {
    memoizedState = initialState
  }

  const queue = createUpdateQueue<State>()
  hook.updateQueue = queue
  hook.memoizedState = memoizedState

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue)
  queue.dispatch = dispatch

  return [memoizedState, dispatch]
}

function dispatchSetState<State>(
  fiber: FiberNode,
  updateQueue: UpdateQueue<State>,
  action: Action<State>
) {

  const lane = requestUpdateLane()
  const update = createUpdate(action, lane)
  enqueueUpdate(updateQueue, update)
  scheduleUpdateOnFiber(fiber, lane)
}

function updateWorkInProgressHook(): Hook {
  let nextCurrentHook: Hook | null

  if (currentHook === null) {
    // update 第一个hook
    const current = currentlyRenderingFiber?.alternate
    if (current !== null) {
      nextCurrentHook = current?.memoizedState
    } else {
      // mount
      nextCurrentHook = null
    }
  } else {
    // fc 后续的hook
    nextCurrentHook = currentHook.next
  }

  if (nextCurrentHook  === null) {
    throw new Error(`组件${currentlyRenderingFiber?.type}本次执行比上一个多一个`)
  }

  currentHook = nextCurrentHook as Hook

  const newHook: Hook = {
    memoizedState: currentHook.memoizedState,
    updateQueue: currentHook.updateQueue,
    next: null
  }

  if (workInProgressHook === null) {
    // mount 第一个hook
    if (currentlyRenderingFiber === null) {
      throw new Error('请在函数组件中调用')
    } else {
      workInProgressHook = newHook
      currentlyRenderingFiber.memoizedState = workInProgressHook
    } 
  } else {
    // mount 后续的hook
    // 前面一个的hook指向下一个hook
    workInProgressHook.next = newHook
    // 同时更新当前的hook
    workInProgressHook = newHook
  }

  return workInProgressHook  
}

function mountWorkInProgressHook(): Hook {

  const hook: Hook = {
    memoizedState: null,
    updateQueue: null,
    next: null
  }

  if (workInProgressHook === null) {
    // mount 第一个hook
    if (currentlyRenderingFiber === null) {
      throw new Error('请在函数组件中调用')
    } else {
      workInProgressHook = hook
      currentlyRenderingFiber.memoizedState = workInProgressHook
    } 
  } else {
    // mount 后续的hook
    // 前面一个的hook指向下一个hook
    workInProgressHook.next = hook
    // 同时更新当前的hook
    workInProgressHook = hook
  }

  return workInProgressHook
}