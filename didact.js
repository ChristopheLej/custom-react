import { createElement } from './didact/vdom.js'
import { createDom } from './didact/dom.js'

let nextUnitofWork = null
let wipRoot = null

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    }
  }

  nextUnitofWork = wipRoot
}

function commitRoot() {
  commitWork(wipRoot.child)
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }

  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function workLoop(deadline) {
  let shouldYield = false

  while (nextUnitofWork && !shouldYield) {
    nextUnitofWork = performUnitofWork(nextUnitofWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitofWork && wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

function performUnitofWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  const elements = fiber.props.children
  let index = 0
  let prevSibling = null

  while (index < elements.length) {
    const element = elements[index]
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null
    }

    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }
    prevSibling = newFiber

    index++
  }

  console.log('fiber', fiber)

  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }

    nextFiber = nextFiber.parent
  }

  return null
}

requestIdleCallback(workLoop)

window.Didact = {
  createElement,
  render
}

export default Didact
