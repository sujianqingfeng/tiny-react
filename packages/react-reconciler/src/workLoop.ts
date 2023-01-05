import { beginWork } from './beginWork'
import { completeWork } from './completeWork'
import { createWorkInProcess, FiberNode, FiberRootNode } from './fiber'
import { HostRoot } from './workTags'

let workInProgress: FiberNode | null = null

function prepareFreshStack(root: FiberRootNode) {
  workInProgress = createWorkInProcess(root.current, {})
}

// 调度update
export function scheduleUpdateOnFiber(fiber: FiberNode) {
  const root = maskUpdateFromToRoot(fiber)
  // fiberNodeRoot
  renderRoot(root)
}

// 从当前fiber找到FiberRootNode
function maskUpdateFromToRoot(fiber: FiberNode) {
  let node = fiber
  let parent = node.return
  while (parent !== null) {
    node = parent
    parent = node.return
  }

  if (node.tag === HostRoot) {
    return node.stateNode
  }

  return null
}

export function renderRoot(root: FiberRootNode) {
  // 最开始的节点
  prepareFreshStack(root)

  do {
    try {
      workLoop()
    } catch (error) {
      workInProgress = null
      console.error('work loop error', error)
    }
  // eslint-disable-next-line no-constant-condition
  } while (true)
}

function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

// 开始递进
function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber)
  fiber.memoizedProps = fiber.pendingProps
  // 子节点遍历完成
  if (next === null) {
    completeUnitOfWork(fiber)
  } else {
    // 存在子节点 继续深度遍历
    workInProgress = next
  }
}

// 归的过程 
function completeUnitOfWork(fiber: FiberNode) {
  let node: FiberNode | null = fiber
  do {
    completeWork(node)
    // 存在兄弟节点
    const sibling = node.sibling
    if (sibling !== null) {
      workInProgress = sibling
      return
    }
    // 处理父节点
    node = node.return
    workInProgress = node
  } while (node !== null)
}

