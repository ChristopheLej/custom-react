import { createElement } from './didact/vdom.js'
import { createDom, updateDom } from './didact/dom.js'

let nextUnitofWork = null
let wipRoot = null
let currentRoot = null
let deletions = []

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  }

  nextUnitofWork = wipRoot
}

function commitRoot() {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
  deletions = []
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }

  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }

  const domParent = domParentFiber.dom
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent)
    return
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
    domParent.appendChild(fiber.dom)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
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
  if (fiber.type instanceof Function) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

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

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  const elements = fiber.props.children
  reconcileChildren(fiber, elements)
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function reconcileChildren(wipFiber, elements) {
  let index = 0
  let prevSibling = null
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child

  while (index < elements.length || oldFiber) {
    const element = elements[index]
    const sameType = oldFiber && element && element.type === oldFiber.type
    let newFiber = null

    if (sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        parent: wipFiber,
        dom: oldFiber.dom,
        alternate: oldFiber,
        effectTag: 'UPDATE'
      }
    }

    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        parent: wipFiber,
        dom: null,
        alternate: null,
        effectTag: 'PLACEMENT'
      }
    }

    if (oldFiber && !sameType) {
      oldFiber.effectTag = 'DELETION'
      deletions.push(oldFiber)
    }

    oldFiber = oldFiber && oldFiber.sibling

    if (index === 0) {
      wipFiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }
    prevSibling = newFiber

    index++
  }
}

requestIdleCallback(workLoop)

window.Didact = {
  createElement,
  render
}

export default Didact
