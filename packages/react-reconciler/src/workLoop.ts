import { scheduleMicroTask } from 'hostConfig'
import { beginWork } from './beginWork'
import { commitMutationEffects } from './commitWork'
import { completeWork } from './completeWork'
import { createWorkInProcess, FiberNode, FiberRootNode } from './fiber'
import { MutationMask, NoFlags } from './fiberFlags'
import { getHighestPriorityLane, Lane, markRootFinished, mergeLanes, NoLane, SyncLane } from './fiberLanes'
import { flushSyncCallback, scheduleSyncCallback } from './syncTaskQueue'
import { HostRoot } from './workTags'

let workInProgress: FiberNode | null = null
let wipRootRenderLane: Lane = NoLane

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
  workInProgress = createWorkInProcess(root.current, {})
  wipRootRenderLane =  lane
}

// 调度update
export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
  const root = markUpdateFromFiberToRoot(fiber)
  markRootUpdated(root, lane)
  // fiberNodeRoot
  ensureRootIsSchedule(root)
}

function ensureRootIsSchedule(root: FiberRootNode) {
  const updateLean = getHighestPriorityLane(root.pendingLanes)
  if (updateLean === NoLane) {
    return
  }
  if (updateLean === SyncLane) {
    // 同步优先级  微任务调度
    if (__DEV__) {
      console.log('在微任务中调度', updateLean)
    }
    scheduleSyncCallback(preformSyncWorkOnRoot.bind(null, root, updateLean))
    scheduleMicroTask(flushSyncCallback)
  } else {
    // 其他优先级 宏任务调度

  }

}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
  root.pendingLanes  = mergeLanes(root.pendingLanes, lane)
}

// 从当前fiber找到FiberRootNode
function markUpdateFromFiberToRoot(fiber: FiberNode) {
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

export function preformSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
  
  const nextLane = getHighestPriorityLane(root.pendingLanes)

  if (nextLane !== SyncLane) {
    //其他比Sync低的优先级
    // 或者NoLane
    ensureRootIsSchedule(root)
    return
  }

  if (__DEV__) {
    console.log('render start')
  }
  
  // 最开始的节点
  prepareFreshStack(root, lane)

  do {
    try {
      workLoop()
      break
    } catch (error) {
      workInProgress = null
      if (__DEV__) {
        console.error('work loop error', error)
      }
    }
  // eslint-disable-next-line no-constant-condition
  } while (true)

  const finishedWork = root.current.alternate
  root.finishedWork = finishedWork
  root.finishLean = lane
  wipRootRenderLane = NoLane

  commitRoot(root)
}

function commitRoot(root: FiberRootNode) {
  const finishedWork = root.finishedWork 

  if (finishedWork === null) {
    return
  }

  if (__DEV__) {
    console.log('commit start')
  }
  const lane = root.finishLean
  if (lane === NoLane && __DEV__) {
    console.error('不应该为NoLane')
  }

  root.finishedWork  = null
  root.finishLean = NoLane

  // 移除消费的lane
  markRootFinished(root, lane)

  // 判断根节点以及子节点 是否存在更新
  const subtreeHasEffect = (finishedWork.subtreeFlags & MutationMask) !== NoFlags
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags

  if (subtreeHasEffect || rootHasEffect) {
    // beforeMutation
    // mutation
    commitMutationEffects(finishedWork)
    // 切换fiber树
    root.current = finishedWork
    // layout
  } else {
    root.current = finishedWork
  }
}

function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

// 开始递进
function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber, wipRootRenderLane)
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
