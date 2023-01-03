import type { Key, Props, Ref } from 'shared/ReactTypes'
import { Flags, NoFlags } from './fiberFlags'
import type { WorkTag } from './workTags'

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

  alternative: FiberNode | null
  flags: Flags

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    this.tag = tag
    this.key = key

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

    // current workInProgress 兩個FiberNode指向對方
    this.alternative = null
    this.flags = NoFlags
  }
}