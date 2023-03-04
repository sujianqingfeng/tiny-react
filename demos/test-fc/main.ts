const button = document.querySelector('button')

interface Work {
  count: number
}

const workList: Work[] = []

const schedule = () => {
  const curWork = workList.pop()

  if (curWork) {
    perform(curWork)
  }
}

const perform = (work: Work) => {
  while (work.count) {
    work.count--
    insertP(`${work.count}`)
  }
  schedule()
}

const insertP = (content: string) => {
  const p = document.createElement('p')
  p.innerHTML = content
  document.body.appendChild(p)
}

button && button.addEventListener('click', () => {
  workList.push({ count: 100 })
  schedule()
})