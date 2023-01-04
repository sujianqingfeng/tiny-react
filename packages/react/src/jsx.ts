import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import type { ElementType, Key, Props, ReactElementType, Ref, Type } from 'shared/ReactTypes'

const ReactElement = function(type: Type, key: Key, ref: Ref, props: Props): ReactElementType {
  const element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
    __mark: 'white-letter'
  }
  return element
}

export const jsx = (type: ElementType, config: any, ...maybeChildren: any) => {

  const props: Props = {}
  let key: Key = null
  let ref: Ref = null

  for (const prop of config) {
    const val = config[prop]
    if (prop === 'key') {
      key = `${val}`
    }
    if (prop === 'ref') {
      if (val !== undefined) {
        ref = val
      }
    }
    if (Object.prototype.hasOwnProperty.call(config, prop)) {
      props[prop] = val
    }
  }

  const maybeChildrenLength = maybeChildren.length

  if (maybeChildrenLength ) {
    if (maybeChildrenLength === 1) {
      props.children = maybeChildren[0]
    } else {
      props.children = maybeChildren
    }
  }

  return ReactElement(type, key, ref, props)
}

export const jsxDev = jsx