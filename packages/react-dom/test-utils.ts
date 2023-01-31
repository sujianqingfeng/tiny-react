import { ReactElementType } from 'shared/ReactTypes'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { createRoot } from 'react-dom'

export function renderIntoContainer(element: ReactElementType) {
  const div = document.createElement('div')
  createRoot(div).render(element)
}