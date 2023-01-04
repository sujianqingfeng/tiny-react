import { beginWork } from './beginWork'
import { completeWork } from './completeWork'
import { FiberNode } from './fiber'

let workInProgress: FiberNode | null = null

function prepareFreshStack(fiber: FiberNode) {
  workInProgress = fiber
}

export function renderRoot(root: FiberNode) {
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

