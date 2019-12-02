import { createElement } from './didact/vdom.js'

function render(element, container) {
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode(element.props.nodeValue)
      : document.createElement(element.type)

  Object.keys(element.props).forEach(name => {
    if (name !== 'children') {
      dom[name] = element.props[name]
    }
  })

  element.props.children.forEach(child => {
    render(child, dom)
  })

  container.appendChild(dom)
}

window.Didact = {
  createElement,
  render
}

export default Didact
