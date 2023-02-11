import { Fragment } from 'react'
import { ReactElementType } from 'shared/ReactTypes'
import { mountChildFibers, reconcileChildFibers } from './childFibers'
import { FiberNode } from './fiber'
import { renderWithHooks } from './fiberHooks'
import { processUpdateQueue, UpdateQueue } from './updateQueue'
import { FunctionComponent, HostComponent, HostRoot, HostText } from './workTags'

export function beginWork(wip: FiberNode) {
  // 比较 返回子FiberNode

  switch (wip.tag) {
    case HostRoot:
      return updateHostRoot(wip)
    case HostComponent:
      return updateHostComponent(wip)
    case HostText:
      return null

    case FunctionComponent:
      return updateFunctionComponent(wip)
    
    case Fragment:
      return updateFragment(wip)
  
    default:
      if (__DEV__) {
        console.log(`begin-work unknown ${wip.tag}`)
      }
      break
  }

  return null
}

function updateFragment(wip: FiberNode) {
  const nextChildren  = wip.pendingProps 
  reconcileChildren(wip, nextChildren)
  return wip.child
}

function updateFunctionComponent(wip: FiberNode) {
  const nextChildren  = renderWithHooks(wip)
  reconcileChildren(wip, nextChildren)
  return wip.child
}

function updateHostRoot(wip: FiberNode) {
  const baseState = wip.memoizedState
  const updateQueue = wip.updateQueue as UpdateQueue<Element>
  const pending = updateQueue.shared.pending
  updateQueue.shared.pending = null
  const { memoizedState } = processUpdateQueue(baseState, pending)
  wip.memoizedState = memoizedState

  const nextChildren = wip.memoizedState

  reconcileChildren(wip, nextChildren)
  return wip.child
}

function updateHostComponent(wip: FiberNode) {
  const nextProps = wip.pendingProps
  const nextChildren  = nextProps.children
  reconcileChildren(wip, nextChildren)
  return wip.child
}

function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
  const current = wip.alternate
  // 对比的是 current 下的 child fiber 和 react element type
  
  // update
  if (current !== null) {
    wip.child = reconcileChildFibers(wip, current?.child, children)
  } else {
    // mount
    wip.child = mountChildFibers(wip, null, children)
  }
}

