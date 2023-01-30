import { Dispatch, Dispatcher } from 'react/src/currentDispatcher'
import internals from 'shared/internals'
import { Action } from 'shared/ReactTypes'
import { FiberNode } from './fiber'
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue } from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'

// 当前渲染的fiber
let currentlyRenderingFiber: FiberNode | null = null
let workInProgressHook: Hook | null = null
const { currentDispatcher } = internals

interface Hook {
  memoizedState: any
  updateQueue: unknown
  next: Hook | null
}

export function renderWithHooks(wip: FiberNode) {
  // 赋值
  currentlyRenderingFiber = wip
  wip.memoizedState = null

  const current = wip.alternative

  if (current !== null) {
    // update
  } else {
    // mount
    currentDispatcher.current = HooksDispatcherOnMount
  }

  const Component = wip.type
  const props = wip.pendingProps
  const children = Component(props)

  // 重置
  currentlyRenderingFiber = null
  return children
}

const HooksDispatcherOnMount: Dispatcher  = {
  useState: mountState
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
  const update = createUpdate(action)
  enqueueUpdate(updateQueue, update)
  scheduleUpdateOnFiber(fiber)
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
      currentlyRenderingFiber.memoizedProps = workInProgressHook
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