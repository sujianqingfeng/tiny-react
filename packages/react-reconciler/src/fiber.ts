import { Container } from 'hostConfig'
import type { Key, Props, ReactElementType, Ref } from 'shared/ReactTypes'
import { Flags, NoFlags } from './fiberFlags'
import { Effect } from './fiberHooks'
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes'
import { Fragment, FunctionComponent, HostComponent, WorkTag } from './workTags'

export class FiberNode {
  tag: WorkTag
  key: Key 
  stateNode: any
  type: any

  return: FiberNode | null
  sibling: FiberNode | null
  child: FiberNode | null
  index: number 

  ref: Ref
  
  pendingProps: Props
  memoizedProps: Props 
  memoizedState: any
  updateQueue: unknown

  alternate: FiberNode | null
  flags: Flags
  subtreeFlags: Flags
  deletions: FiberNode[] | null

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    this.tag = tag
    this.key = key || null

    // host component 中的dom
    this.stateNode = null
    // function component 中的函數
    this.type = null

    // 父FiberNode
    this.return = null
    // 兄弟FiberNode
    this.sibling = null
    // 子FiberNode
    this.child = null
    // 子FiberNode 的位置
    this.index = 0

    this.ref = null

    // 最開始的props
    this.pendingProps = pendingProps
    // 結束的props
    this.memoizedProps = null
    // 结束的state
    this.memoizedState = null
    this.updateQueue = null

    // current workInProgress 兩個FiberNode指向對方
    this.alternate = null
    this.flags = NoFlags
    this.subtreeFlags = NoFlags
    this.deletions = null
  }
}

export interface PendingPassiveEffects {
  unmount: Effect[]
  update: Effect[]
}

// 根节点
export class FiberRootNode {
  container: Container
  // 主要关联 HostFiberNode
  current: FiberNode
  // 结束之后的
  finishedWork: FiberNode | null
  // 未处理的lanes 
  pendingLanes: Lanes
  // 处理完成的lane
  finishLean: Lane
  pendingPassiveEffects: PendingPassiveEffects

  constructor(container: Container, hostFiberNode: FiberNode) {
    this.container = container
    this.current = hostFiberNode
    this.finishedWork = null
    this.pendingLanes = NoLanes
    this.finishLean = NoLane
    this.pendingPassiveEffects = {
      unmount: [],
      update: []
    }

    // HostFiberNode 关联 FiberRootNode
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    hostFiberNode.stateNode = this

  }
}

// 创建wip 双缓存机制
export const createWorkInProcess = (current: FiberNode, pendingProps: Props): FiberNode => {
  let wip = current.alternate

  if (wip === null) {
    // mount
    wip = new FiberNode(current.tag, pendingProps, current.key)
    wip.stateNode = current.stateNode

    current.alternate = wip
    wip.alternate = current
  } else {
    //update
    wip.pendingProps = pendingProps
    wip.flags = NoFlags
    wip.subtreeFlags = NoFlags
    wip.deletions = null
  }
  wip.type = current.type
  wip.updateQueue = current.updateQueue
  wip.child = current.child
  wip.memoizedProps = current.memoizedProps
  wip.memoizedState = current.memoizedState

  return wip
}

export function createFiberFromElement(element: ReactElementType) {
  const { type, key, props } = element

  let fiberTag: WorkTag = FunctionComponent

  if (typeof type === 'string') {
    fiberTag = HostComponent
  } else if (typeof type !== 'function' && __DEV__) {
    console.warn('未实现的type类型', element)
  }

  const fiber = new FiberNode(fiberTag, props, key)
  fiber.type = type

  return fiber
}

export function createFiberFromFragment(elements: any[], key: Key) {
  const fiber = new FiberNode(Fragment, elements, key)
  return fiber
}
