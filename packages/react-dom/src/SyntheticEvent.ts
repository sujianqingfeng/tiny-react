import { Container } from 'hostConfig'
import { Props } from 'shared/ReactTypes'

const validEventTypeList = ['click']

export const elementPropsKey = '__props'

export interface DOMElement extends Element {
  [elementPropsKey]: Props
}

type EventCallback = (e: Event) => void
interface Paths {
  capture: EventCallback[]
  bubble: EventCallback[]
}

interface SyntheticEvent extends Event {
  __stopPropagation: boolean
}

export function updateFiberProps(node: DOMElement, props: Props) {
  node[elementPropsKey] = props
} 

export function initEvent(container: Container, eventType: string) {

  if (!validEventTypeList.includes(eventType)) {
    console.warn(`当前不支持${eventType}事件`)
    return
  }

  if (__DEV__) {
    console.log('init event', eventType)
  }

  container.addEventListener(eventType, e => {
    dispatchEvent(container, eventType, e)
  })
}

function createSyntheticEvent(e: Event) {
  const syntheticEvent = e as SyntheticEvent

  syntheticEvent.__stopPropagation = false

  const originStopPropagation = syntheticEvent.stopPropagation

  syntheticEvent.stopPropagation = () => {
    syntheticEvent.__stopPropagation = true
    if (originStopPropagation ) {
      originStopPropagation ()
    }
  }

  return syntheticEvent
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
  const targetElement = e.target as DOMElement
  if (targetElement === null) {
    console.warn('事件不存在')
    return
  }
  // 收集事件
  const { bubble, capture } = collectPaths(targetElement, container, eventType)
  // 合成事件
  const se = createSyntheticEvent(e)
  // 遍历事件

  triggerEventFlow(capture, se)

  if (!se.__stopPropagation) {
    triggerEventFlow(bubble, se)
  }
} 

function triggerEventFlow(paths: EventCallback[], se: SyntheticEvent) {
  for (let i = 0; i < paths.length; i++) {
    const callback = paths[i]
    callback.call(null, se)
    if (se.__stopPropagation) {
      break
    }
  }
}

function getEventCallbackNameFromEventType(eventType: string) {
  return {
    click: ['onClickCapture', 'onClick']
  }[eventType]
}

function collectPaths(targetElement: DOMElement, container: Container, eventType: string) {
  const paths: Paths = {
    capture: [],
    bubble: []
  }

  while (targetElement && targetElement !== container) {
    const elementProps = targetElement[elementPropsKey]
    if (elementProps) {
      const callbackNameList = getEventCallbackNameFromEventType(eventType)

      if (callbackNameList) {
        callbackNameList.forEach((callbackName, i) => {
          const eventCallback = elementProps[callbackName]

          if (eventCallback) {
            if (i === 0) {
              paths.capture.unshift(eventCallback)
            } else {
              paths.bubble.push(eventCallback)
            }
          }
        })
      }
    }
    
    targetElement = targetElement.parentNode as DOMElement
  }

  return paths
}