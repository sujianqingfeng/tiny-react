import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import { Props, ReactElementType } from 'shared/ReactTypes'
import { createFiberFromElement, createWorkInProcess, FiberNode } from './fiber'
import { ChildDeletion, Placement } from './fiberFlags'
import { HostText } from './workTags'

function ChildReconciler(shouldTrackEffects: boolean) {

  function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
    if (!shouldTrackEffects) {
      return
    }
    const deletions = returnFiber.deletions

    if (deletions === null) {
      returnFiber.deletions = [childToDelete]
      returnFiber.flags |= ChildDeletion
    } else {
      deletions.push(childToDelete)
    }

  }

  function deleteRemainingChildren(returnFiber: FiberNode, currentFirstChild: FiberNode | null) {
    if (!shouldTrackEffects) {
      return
    }
    let childToDelete = currentFirstChild
    while (childToDelete  !== null) {
      deleteChild(returnFiber, childToDelete  )
      childToDelete  = childToDelete.sibling 
    }
  }

  function reconcileSingleElement(returnFiber: FiberNode, currentFiber: FiberNode | null, element: ReactElementType) {
    const key = element.key

    while (currentFiber !== null) {
      // update
      if (currentFiber.key === key) {
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          if (currentFiber.type === element.type) {
            // type 相同
            const existing = useFiber(currentFiber, element.props)
            existing.return = returnFiber

            // 当前节点可复用  标记剩下得节点可删除
            deleteRemainingChildren(returnFiber, currentFiber.sibling)
            return existing
          }
          // type不同 删掉旧的
          deleteRemainingChildren(returnFiber, currentFiber)
          break 
        } else {
          if (__DEV__) {
            console.warn('还未实现的react类型', element)
          }
          break
        }
      } else {
        // key不同 删掉当前 继续遍历兄弟节点
        deleteChild(returnFiber, currentFiber)
        currentFiber = currentFiber.sibling
      }
    }

    const fiber = createFiberFromElement(element)
    fiber.return = returnFiber
    return fiber
  }

  function reconcileSingleTextNode(returnFiber: FiberNode, currentFiber: FiberNode | null, content: string | number) {

    while (currentFiber !== null) {
      // update
      if (currentFiber.tag === HostText) {
        // 可以复用
        const existing = useFiber(currentFiber, { content })
        existing.return = returnFiber
        deleteRemainingChildren(returnFiber, currentFiber.sibling)
        return existing
      }
      // 类型不一致 删掉
      deleteChild(returnFiber, currentFiber)
      currentFiber = currentFiber.sibling
    }

    const fiber = new FiberNode(HostText, { content }, null)
    fiber.return = returnFiber
    return fiber
  }

  function placeSingleChild (fiber: FiberNode) {
    if (shouldTrackEffects && fiber.alternate === null) {
      fiber.flags |= Placement
    }

    return fiber
  }

  return function(returnFiber: FiberNode, currentFiber: FiberNode | null, newChild?: ReactElementType) {

    if (typeof newChild === 'object' && newChild !== undefined) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFiber, newChild)) 
      
        default:
          if (__DEV__) {
            console.warn('未实现的reconcile类型 1', newChild)
          }
          break
      }
    }

    // TODO 多节点情况

    // HostText
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFiber, newChild)) 
    }

    if (currentFiber !== null) {
      // 兜底的情况
      deleteChild(returnFiber, currentFiber)
    }

    if (__DEV__) {
      console.warn('未实现的reconcile类型', newChild)
    }

    return null
  }
}

function useFiber(fiber: FiberNode, pendingProps: Props) {
  const clone = createWorkInProcess(fiber, pendingProps)
  clone.index = 0
  clone.sibling = null
  return clone
}

export const reconcileChildFibers = ChildReconciler(true)
export const mountChildFibers = ChildReconciler(false)