import { createElement } from './didact/vdom.js'
import { createDom } from './didact/dom.js'

let nextUnitofWork = null

function render(element, container) {
  nextUnitofWork = {
    dom: container,
    props: {
      children: [element]
    }
  }
}

function workLoop(deadline) {
  let shouldYield = false

  while (nextUnitofWork && !shouldYield) {
    nextUnitofWork = performUnitofWork(nextUnitofWork)
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}

function performUnitofWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
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
