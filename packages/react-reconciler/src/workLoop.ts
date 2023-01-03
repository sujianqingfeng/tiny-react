import { beginWork } from './beginWork'
import { completeWork } from './completeWork'
import { FiberNode } from './fiber'

let workInProgress: FiberNode | null = null

function prepareFreshStack(fiber: FiberNode) {
  workInProgress = fiber
}

function renderRoot(root: FiberNode) {
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
    performUnitOfWord(workInProgress)
  }
}

function performUnitOfWord(fiber: FiberNode) {
  const next = beginWork(fiber)
  fiber.memoizedProps = fiber.pendingProps
  if (next === null) {
    completeUnitOfWork(fiber)
  } else {
    workInProgress = fiber
  }
}

function completeUnitOfWork(fiber: FiberNode) {
  let node: FiberNode | null = fiber
  do {
    completeWork(node)

    const sibling = node.sibling
    if (sibling !== null) {
      workInProgress = sibling
      return
    }
    node = node.return
    workInProgress = node
  } while (node !== null)
}

