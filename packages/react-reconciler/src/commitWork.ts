import { appendChildToContainer, commitUpdate, Container, insertChildToContainer, Instance, removeChild } from 'hostConfig'
import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber'
import { ChildDeletion, Flags, MutationMask, NoFlags, PassiveEffect,  PassiveMask,  Placement, Update } from './fiberFlags'
import { Effect, FCUpdateQueue } from './fiberHooks'
import { HookHasEffect } from './hookEffectTags'
import { FunctionComponent, HostComponent, HostRoot, HostText } from './workTags'

let nextEffect: FiberNode| null = null

export function commitMutationEffects(finishedWork: FiberNode, root: FiberRootNode) {
  nextEffect = finishedWork

  while (nextEffect !== null) {
    const child: FiberNode | null = nextEffect.child
    if ((nextEffect.subtreeFlags & (MutationMask | PassiveMask)) !== NoFlags && child !== null) {
      nextEffect = child
    } else {
      // up
      while (nextEffect !== null) {
        commitMutationEffectsOnFiber(nextEffect, root)
        const sibling: FiberNode | null = nextEffect.sibling

        if (sibling !== null) {
          nextEffect = sibling
          break
        }

        nextEffect = nextEffect.return
      }
    }
  }

}

function commitMutationEffectsOnFiber(finishedWork: FiberNode, root: FiberRootNode) {
  const flags = finishedWork.flags

  if ((flags & Placement) !== NoFlags) {
    commitPlacement(finishedWork)
    finishedWork.flags &= ~Placement
  }

  if ((flags & Update) !== NoFlags) {
    commitUpdate(finishedWork)
    finishedWork.flags &= ~Update
  }

  if ((flags & ChildDeletion) !== NoFlags) {
    const deletions = finishedWork.deletions
    if (deletions !== null) {
      deletions.forEach(childToDelete => {
        commitDeletion(childToDelete, root)
      })

    }
    finishedWork.flags &= ~ChildDeletion
  }

  if ((flags & PassiveEffect) !== NoFlags) {
    // ζΆιεθ°
    commitPassiveEffect(finishedWork, root, 'update')
    finishedWork.flags &= ~PassiveEffect
  }
}

function commitPassiveEffect(fiber: FiberNode, root: FiberRootNode, type: keyof PendingPassiveEffects) {
  if (fiber.tag !== FunctionComponent || 
    (type === 'update' && (fiber.flags & PassiveEffect) === NoFlags)) {
    return
  }
  const updateQueue = fiber.updateQueue as FCUpdateQueue<any>

  if (updateQueue !== null) {
    if (updateQueue.lastEffect === null && __DEV__) {
      console.error('ε½FCε­ε¨PassiveEffect,δΈε?ζ―ε­ε¨effect')
    }
    root.pendingPassiveEffects[type].push(updateQueue.lastEffect as Effect)
  }
}

// ιεeffect
function commitHookEffectList(flags: Flags, lastEffect: Effect, callback: (effect: Effect) => void ) {
  let effect = lastEffect.next as Effect
  do {
    if ((effect.tag & flags) === flags) {
      callback(effect)
    }

    effect = effect.next as Effect
  } while (effect !== lastEffect.next) 
}

export function commitHookEffectListUnmount(flags: Flags, lastEffect: Effect) {
  commitHookEffectList(flags, lastEffect, effect => {
    const destroy = effect.destroy
    if (typeof destroy === 'function') {
      destroy()
    }
    effect.tag &= ~HookHasEffect
  })
}

export function commitHookEffectListDestroy(flags: Flags, lastEffect: Effect) {
  commitHookEffectList(flags, lastEffect, effect => {
    const destroy = effect.destroy
    if (typeof destroy === 'function') {
      destroy()
    }
  })
}

export function commitHookEffectListCreate(flags: Flags, lastEffect: Effect) {
  commitHookEffectList(flags, lastEffect, effect => {
    const create = effect.create
    if (typeof create === 'function') {
      effect.destroy =  create()
    }
  })
}

function recordHostChildrenToDelete(childrenToDelete: FiberNode[], unmountFiber: FiberNode) {

  // ζΎε°η¬¬δΈδΈͺroot hostθηΉ
  const lastOne = childrenToDelete[childrenToDelete.length - 1]
  // ζ²‘ζΎε°δΈδΈͺhostθηΉ ε€ζ­θΏδΈͺθηΉζ―θ‘₯εδΈδΈζ¬‘ι£δΈͺθηΉηεεΌθηΉ

  if (!lastOne) {
    childrenToDelete.push(unmountFiber)
  } else {
    
    let node = lastOne.sibling
    while (node !== null) {
      if (node === unmountFiber) {
        childrenToDelete.push(unmountFiber)
        break
      }
      
      node = node.sibling
    }
  }
}

function commitDeletion(childToDelete: FiberNode, root: FiberRootNode) {
  const rootChildrenToDelete: FiberNode[]  = []

  commitNestedComponent(childToDelete, (unmountFiber) => {

    switch (unmountFiber.tag) {
      case HostComponent:
        recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber)
        //TODO θ§£η»ref
        return 

      case HostText:
        recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber)
        return
      case FunctionComponent:
        // TODO ref 
        commitPassiveEffect(unmountFiber, root, 'unmount')
        return
    
      default:
        if (__DEV__) {
          console.warn('ζͺε€ηηunmountη±»ε', unmountFiber)
        }
        break
    }
  })

  if (rootChildrenToDelete.length) {
    const hostParent = getHostParent(childToDelete)
    if (hostParent !== null) {
      rootChildrenToDelete.forEach((node) => {
        removeChild(node.stateNode, hostParent)
      })
    }
  }

  // ιη½?δΈδΊζ°ζ?
  childToDelete.return = null
  childToDelete.child = null
}

function commitNestedComponent(root: FiberNode, onCommitUnmount: (fiber: FiberNode) => void) {
  let node = root
  // eslint-disable-next-line no-constant-condition
  while (true) {
    onCommitUnmount(node)

    // εδΈιε
    if (node.child !== null) {
      node.child.return = node
      node = node.child
      continue
    }

    // ιε½η»ζ
    if (node === root) {
      return
    }

    while (node.sibling === null) {
      // ηΆηΊ§ιεη»ζ
      if (node.return === null || node.return === root) {
        return
      }
      node = node.return
    }

    node.sibling.return = node.return
    node = node.sibling
  }
}

function commitPlacement(finishedWork: FiberNode) {
  if (__DEV__) {
    console.log('commitPlacement')
  }

  // parent dom
  const hostParent = getHostParent(finishedWork)

  // host sibling
  const sibling = getHostSibling(finishedWork)

  if (hostParent !== null) {
    insertOrAppendPlacementIntoContainer(finishedWork, hostParent, sibling)
  }
}

function getHostSibling(fiber: FiberNode) {
  let node: FiberNode = fiber

  // eslint-disable-next-line no-constant-condition
  while (true) {

    // εεΌθηΉζ²‘ζΎε° εηΆηΊ§ζ₯ζΎ
    while (node.sibling === null) {
      const parent = node.return

      if (parent === null || parent.tag === HostComponent || parent.tag === HostRoot) {
        return null
      }
      node = parent
    }

    node.sibling.return = node.return
    node = node.sibling

    while (node.tag !== HostText && node.tag !== HostComponent) {
      // εδΈιε
      if ((node.flags & Placement) !== NoFlags) {
        // ε½εθηΉ δΌεηζδ½  ζδ»₯δΈθ½εθ
        continue
      }

      // ζΎε°εΊ
      if (node.child === null) {
        continue
      } else {
        node.child.return = node
        node = node.child
      }
    }

    if ((node.flags && Placement) === NoFlags) {
      return node.stateNode
    }
    
  }

}

function getHostParent(fiber: FiberNode) {
  let parent = fiber.return

  while (parent) {
    const parentTag = parent.tag
    if (parentTag === HostComponent) {
      return parent.stateNode as Container
    }

    if (parentTag === HostRoot) {
      return (parent.stateNode as FiberRootNode).container
    }

    parent = parent.return
  }

  if (__DEV__) {
    console.warn('get host parent is null')
  }

  return null
}

function insertOrAppendPlacementIntoContainer (finishedWork: FiberNode, hostParent: Container, before?: Instance) {

  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    if (before) {
      insertChildToContainer(finishedWork.stateNode, hostParent, before)
    } else {
      appendChildToContainer(hostParent, finishedWork.stateNode)
    }
    return 
  }

  const child = finishedWork.child
  
  if (child !== null) {
    insertOrAppendPlacementIntoContainer(child, hostParent)

    let sibling = child.sibling
    while (sibling !== null) {
      insertOrAppendPlacementIntoContainer(sibling, hostParent)
      sibling = sibling.sibling
    }
  }
}

