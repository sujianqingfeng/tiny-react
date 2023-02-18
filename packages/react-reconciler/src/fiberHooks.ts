import { Dispatch, Dispatcher } from 'react/src/currentDispatcher'
import internals from 'shared/internals'
import { Action } from 'shared/ReactTypes'
import { FiberNode } from './fiber'
import { Flags, PassiveEffect } from './fiberFlags'
import { Lane, NoLane, requestUpdateLane } from './fiberLanes'
import { HookHasEffect, Passive } from './hookEffectTags'
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

type EffectCallback = () => void
type EffectDeps = any[] | null

export interface Effect {
  tag: Flags,
  create: EffectCallback | void,
  destroy: EffectCallback | void,
  deps: EffectDeps,
  next: Effect | null
}

export interface FCUpdateQueue<State> extends UpdateQueue<State> {
  lastEffect: Effect | null
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
  useState: mountState,
  useEffect: mountEffect
}

const HooksDispatcherOnUpdate: Dispatcher  = {
  useState: updateState,
  useEffect: mountEffect
}

function mountEffect(create: EffectCallback | void, deps: EffectDeps | void) {
  const hook = mountWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps;
  (currentlyRenderingFiber as FiberNode).flags |= PassiveEffect
  hook.memoizedState = pushEffect(Passive | HookHasEffect, create, undefined, nextDeps)
}

function pushEffect(hookFlags: Flags, create: EffectCallback | void, destroy: EffectCallback | void, deps: EffectDeps): Effect {

  const effect: Effect = {
    tag: hookFlags,
    create,
    destroy,
    deps,
    next: null
  }

  const fiber = currentlyRenderingFiber as FiberNode
  const updateQueue = fiber.updateQueue as FCUpdateQueue<any>
  if (updateQueue === null) {
    const updateQueue = createFCUpdateQueue()
    fiber.updateQueue = updateQueue
    effect.next = effect
    updateQueue.lastEffect = effect
  } else {
    // 插入effect
    const lastEffect = updateQueue.lastEffect
    if (lastEffect === null) {
      effect.next = effect
      updateQueue.lastEffect = effect
    } else {
      const firstEffect = lastEffect.next
      lastEffect.next = effect
      effect.next = firstEffect
      updateQueue.lastEffect = effect
    }
  }

  return  effect
}

function createFCUpdateQueue<State>() {
  const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>
  updateQueue.lastEffect = null
  return updateQueue
}

function updateState<State>(): [State, Dispatch<State>] {
  // 找到当前useState对应的hook数据
  const hook = updateWorkInProgressHook()

  const queue = hook.updateQueue as UpdateQueue<State>
  const pending = queue.shared.pending
  // 消费置空
  queue.shared.pending = null

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