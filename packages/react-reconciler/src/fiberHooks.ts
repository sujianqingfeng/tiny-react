import { FiberNode } from './fiber'

export function renderWithHooks(wip: FiberNode) {
  const nextProps = wip.pendingProps
  const Component = wip.type
  const children = Component(nextProps)
  return children
}