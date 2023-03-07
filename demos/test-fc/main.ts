import {
  unstable_ImmediatePriority as ImmediatePriority,
  unstable_UserBlockingPriority as UserBlockingPriority,
  unstable_NormalPriority as NormalPriority,
  unstable_LowPriority as LowPriority,
  unstable_IdlePriority as IdlePriority,
  unstable_scheduleCallback as scheduleCallback,
  unstable_shouldYield as shouldYield,
  unstable_getFirstCallbackNode as getFirstCallbackNode,
  CallbackNode,
  unstable_cancelCallback as cancelCallback,
} from 'scheduler'
import './index.css'

type Priority = typeof ImmediatePriority | typeof UserBlockingPriority | typeof NormalPriority | typeof LowPriority | typeof IdlePriority

interface Work {
  count: number
  priority: Priority
}

const workList: Work[] = []
let prevPriority: Priority = IdlePriority
let curCallback: CallbackNode | null = null

const schedule = () => {
  const cbNode = getFirstCallbackNode()
  const curWork = workList.sort((w1, w2) => w1.priority - w2.priority)[0]

  // 没有工作了
  if (!curWork) {
    curCallback = null
    cbNode && cancelCallback(cbNode)
    return
  }

  const { priority: curPriority } = curWork
  if (curPriority === prevPriority) {
    return
  }

  // 更高优先级的work 取消之前的
  cbNode && cancelCallback(cbNode)

  curCallback =  scheduleCallback(curPriority, perform.bind(null, curWork))
}

const perform = (work: Work, didTimeout?: boolean) => {
  // 
  const needSync = work.priority === ImmediatePriority || didTimeout

  while ((needSync || !shouldYield() ) && work.count) {
    work.count--
    insertP(`${work.priority}`)
  }

  prevPriority = work.priority
  if (!work.count) {
    const workIndex = workList.indexOf(work)
    workList.splice(workIndex, 1)
    prevPriority = IdlePriority
  }

  const prevCallback = curCallback
  schedule()
  const newCallback = curCallback

  // 当前的任务继续执行
  if (newCallback && newCallback === prevCallback) {
    return perform.bind(null, work)
  }
}

const doSomeBuzyWork = (len: number) => {
  let result = 0
  while (len--) {
    result += len
  }
  return result
}

const insertP = (content: string) => {
  const p = document.createElement('span')
  p.innerHTML = content
  doSomeBuzyWork(20000000)
  document.body.appendChild(p)
}

const root = document.getElementById('root');

[LowPriority, NormalPriority, UserBlockingPriority, ImmediatePriority].forEach(priority => {

  const btn = document.createElement('button')
  root?.appendChild(btn)
  btn.innerText = ['',  'ImmediatePriority', 'UserBlockingPriority', 'NormalPriority', 'LowPriority'][priority] + priority

  btn.addEventListener('click', () => {
    workList.push({ count: 100, priority: priority as Priority })
    schedule()
  })
})