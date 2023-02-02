import { appendInitialChild, Container, createInstance, createTextInstance } from 'hostConfig'
import { FiberNode } from './fiber'
import { NoFlags, Update } from './fiberFlags'
import { FunctionComponent, HostComponent, HostRoot, HostText } from './workTags'

function markUpdate(fiber: FiberNode) {
  fiber.flags != Update
}

export function completeWork(wip: FiberNode) {

  const newProps = wip.pendingProps
  const current = wip.alternative

  switch (wip.tag) {
    case HostComponent:
      if (current !== null && current.stateNode) {
      // update
      } else {
      // mount
        // const instance = createInstance(wip.type, newProps)
        const instance = createInstance(wip.type)
        appendAllChildren(instance, wip)
        wip.stateNode = instance
      }
      bubbleProperties(wip)
      
      return null
    case HostText:
      
      if (current !== null && current.stateNode) {
        // update
        const oldText = current.memoizedProps.content
        const newText = newProps.content
        if (oldText !== newText) {
          // 标记更新
          markUpdate(wip)
        }
      } else {
      // mount
        const instance = createTextInstance(newProps.content)
        wip.stateNode = instance
      }
      bubbleProperties(wip)
      return

    case HostRoot:
      bubbleProperties(wip)
      return null

    case FunctionComponent:
      bubbleProperties(wip)
      return null

    default:
      if (__DEV__) {
        console.log('completeWork 不存在的tag', wip)
      }
      break
  }

  return null
}

function appendAllChildren(parent: Container, wip: FiberNode) {
  let node = wip.child

  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode)
    } else if (node.child !== null) {
      node.child.return = node
      node = node.child
      continue
    }

    if (node === wip) {
      return
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === wip) {
        return
      }
      node = node?.return
    }

    node.sibling.return = node.return
    node  = node.sibling
  }
  
}

function bubbleProperties(wip: FiberNode) {
  let subtreeFlags = NoFlags
  let child = wip.child
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags
    subtreeFlags |= child.flags

    child.return = wip
    child = child.sibling
  }

  wip.subtreeFlags |= subtreeFlags
}
