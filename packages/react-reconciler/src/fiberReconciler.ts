import { Container } from 'hostConfig'
import { ReactElementType } from 'shared/ReactTypes'
import { FiberNode, FiberRootNode } from './fiber'
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue } from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'
import { HostRoot } from './workTags'

// 创建FiberRootNode  
export function createContainer(container: Container) {
  const hostRootFiber = new FiberNode(HostRoot, {}, null)
  const root = new FiberRootNode(container, hostRootFiber)
  // 创建update queue
  hostRootFiber.updateQueue = createUpdateQueue()
  return root
}

// 
export function updateContainer(element: ReactElementType|null, root: FiberRootNode) {
  const hostRootFiber = root.current
  // 创建update 并 加入 updateQueue
  const update = createUpdate<ReactElementType|null>(element)
  enqueueUpdate((hostRootFiber.updateQueue) as UpdateQueue<ReactElementType | null>, update)

  scheduleUpdateOnFiber(hostRootFiber)
  return element
}