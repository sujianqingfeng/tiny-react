import { FiberNode } from './fiber'
export function beginWork(fiber: FiberNode) {
  console.log(fiber)
  return fiber
}