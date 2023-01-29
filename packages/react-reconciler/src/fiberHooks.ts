import internals from 'shared/internals'
import { FiberNode } from './fiber'

// 当前渲染的fiber
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentlyRenderingFiber: FiberNode | null = null
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const workInProgressHook: Hook | null = null
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  }

  const Component = wip.type
  const props = wip.pendingProps
  const children = Component(props)

  // 重置
  currentlyRenderingFiber = null
  return children
}