import { FiberNode } from './fiber'

export function completeWork(fiber: FiberNode) {
  console.log(fiber)
}