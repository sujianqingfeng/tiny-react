import { appendChildToContainer, Container } from 'hostConfig'
import { FiberNode, FiberRootNode } from './fiber'
import { MutationMask, NoFlags, Placement } from './fiberFlags'
import { HostComponent, HostRoot, HostText } from './workTags'

let nextEffect: FiberNode| null = null

export function commitMutationEffects(finishedWork: FiberNode) {
  nextEffect = finishedWork

  while (nextEffect !== null) {
    const child: FiberNode | null = nextEffect.child
    if ((nextEffect.subtreeFlags & MutationMask) !== NoFlags && child !== null) {
      nextEffect = child
    } else {
      // up
      while (nextEffect !== null) {
        commitMutationEffectsOnFiber(nextEffect)
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

function commitMutationEffectsOnFiber(finishedWork: FiberNode) {
  const flags = finishedWork.flags

  if ((flags & Placement) !== NoFlags) {
    commitPlacement(finishedWork)
    finishedWork.flags &= ~Placement
  }
}

function commitPlacement(finishedWork: FiberNode) {
  if (__DEV__) {
    console.log('commitPlacement', finishedWork)
  }

  const hostParent = getHostParent(finishedWork)
  if (hostParent) {
    appendPlacementIntoContainer(finishedWork, hostParent)
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

}

function appendPlacementIntoContainer (finishedWork: FiberNode, hostParent: Container) {

  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    appendChildToContainer(hostParent, finishedWork.stateNode)
    return 
  }

  const child = finishedWork.child

  if (child !== null) {
    appendPlacementIntoContainer(child, hostParent)

    let sibling = child.sibling
    while (sibling !== null) {
      appendPlacementIntoContainer(sibling, hostParent)
      sibling = sibling.sibling
    }
  }
}

