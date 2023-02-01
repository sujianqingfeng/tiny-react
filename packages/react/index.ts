import { Dispatcher, resolveDispatcher } from './src/currentDispatcher'
import currentDispatcher from './src/currentDispatcher'
import { jsx } from './src/jsx'

export const useState: Dispatcher['useState'] = (initialState) => {
  const dispatcher = resolveDispatcher()
  return dispatcher.useState(initialState)
}

// 数据共享层
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  currentDispatcher
}

export const version = '0.0.0'
export const createElement = jsx

export { isValidElement } from './src/jsx'
