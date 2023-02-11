import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols'
import { Key, Props, ReactElementType } from 'shared/ReactTypes'
import { createFiberFromElement, createFiberFromFragment, createWorkInProcess, FiberNode } from './fiber'
import { ChildDeletion, Placement } from './fiberFlags'
import { Fragment, HostText } from './workTags'

type ExistingChildren = Map<string|number, FiberNode>

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
            let props = element.props

            // 如果element 类型是 fragment
            if (element.type === REACT_FRAGMENT_TYPE) {
              props = element.props.children
            }
            // type 相同
            const existing = useFiber(currentFiber, props)
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

    let fiber 
    if (element.type === REACT_FRAGMENT_TYPE) {
      fiber = createFiberFromFragment(element.props.children, key)
    } else {
      fiber = createFiberFromElement(element) 
    }
    
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

  // 标记placement
  function placeSingleChild (fiber: FiberNode) {
    if (shouldTrackEffects && fiber.alternate === null) {
      fiber.flags |= Placement
    }

    return fiber
  }

  function reconcileChildrenArray(returnFiber: FiberNode, currentFirstChild: FiberNode | null, newChild: any[]) {

    // 最后一个可复用的fiber在current 中的位置
    let lastPlacedIndex = 0
    // 创建最后一个fiber
    let lastNewFiber: FiberNode | null = null
    // 创建第一个fiber
    let firstNewFiber: FiberNode | null = null

    // 将current 保存在map中
    const existingChildren: ExistingChildren =  new Map()
    let current = currentFirstChild
    while (current !== null) {
      const keyToUse = current.key != null ? current.key :  current.index
      existingChildren.set(keyToUse, current)
      current = current.sibling
    }

    for (let i = 0; i < newChild.length; i++) {
      // 遍历newChild 寻找是否可复用
      const after = newChild[i]
      const newFiber = updateFromMap(returnFiber, existingChildren, i, after)

      if (newFiber === null) {
        continue
      }
      // 标记移动还是插入
      newFiber.index = i
      newFiber.return = returnFiber

      if (lastNewFiber === null) {
        lastNewFiber = newFiber
        firstNewFiber  = newFiber
      } else {
        lastNewFiber.sibling  = newFiber
        lastNewFiber = lastNewFiber.sibling
      }
      if (!shouldTrackEffects) {
        continue
      }

      const current = newFiber.alternate
      if (current !== null) {
        const oldIndex = current.index
        if (oldIndex < lastPlacedIndex) {
          // 移动
          newFiber.flags |= Placement
          continue
        } else {
          lastPlacedIndex = oldIndex
        }
      } else {
        // mount
        // 插入
        newFiber.flags |= Placement
      }
      
    }
    // 将Map中剩下的标记为删除
    existingChildren.forEach(fiber => {
      deleteChild(returnFiber, fiber)
    })

    return firstNewFiber
  }

  function updateFromMap(returnFiber: FiberNode, existingChildren: ExistingChildren, index: number, element: any): FiberNode | null {
    const keyToUse = element.key !== null ? element.key : index
    const before = existingChildren.get(keyToUse)

    // HostText
    if (typeof element === 'string' || typeof element === 'number') {
      if (before) {
        // 判断类型是否一致
        if (before.tag === HostText) {
          // 可复用就移除
          existingChildren.delete(keyToUse)
          return useFiber(before, { content: `${element}` })
        }
      }
      // 没有复用的就创建
      return new FiberNode(HostText, { content: `${element}` }, null)
    }

    // HostComponent
    if (typeof element === 'object' && element !== null) {
      switch (element.$$typeof) {
        case REACT_ELEMENT_TYPE:
          // fragment
          if (element.type === Fragment) {
            return updateFragment(returnFiber, before, element, keyToUse, existingChildren)
          }
          if (before) {
            // 可复用
            if (before.type === element.type) {
              existingChildren.delete(keyToUse)
              return useFiber(before, element.props)
            }
          }
          return createFiberFromElement(element)
      }
    }

    // 如果是数组 当成fragment处理
    if (Array.isArray(element)) {
      return updateFragment(returnFiber, before, element, keyToUse, existingChildren)
    }

    return null
  }

  return function(returnFiber: FiberNode, currentFiber: FiberNode | null, newChild?: any) {

    // 是否是顶层的fragment类型
    const isUnKeyToLevelFragment = typeof newChild === 'object' && newChild !== null && newChild.type === REACT_FRAGMENT_TYPE && newChild.key !== null

    if (isUnKeyToLevelFragment) {
      newChild = newChild?.props.children
    }

    if (typeof newChild === 'object' && newChild !== undefined) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFiber, newChild)) 
      
        default:
          if (__DEV__) {
            console.warn('未实现的reconcile类型', newChild)
          }
          break
      }

      //多节点情况
      if (Array.isArray(newChild)) {
        return reconcileChildrenArray(returnFiber, currentFiber, newChild)
      }
    }

    // HostText
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFiber, newChild)) 
    }

    if (currentFiber !== null) {
      // 兜底的情况
      deleteRemainingChildren(returnFiber, currentFiber)
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

function updateFragment(returnFiber: FiberNode, current: FiberNode | undefined, elements: any[], key: Key, existingChildren: ExistingChildren) {

  let fiber

  // !current mount时 
  // 之前不是fragment类型 
  if (!current || current.tag !== Fragment) {
    fiber = createFiberFromFragment(elements, key)
  } else {
    // 可复用
    existingChildren.delete(key)
    fiber = useFiber(current, elements)
  }

  fiber.return = returnFiber

  return fiber
}

export const reconcileChildFibers = ChildReconciler(true)
export const mountChildFibers = ChildReconciler(false)