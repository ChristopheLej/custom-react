export function createDom(fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode(fiber.props.nodeValue)
      : document.createElement(fiber.type)

  Object.keys(fiber.props).forEach(name => {
    if (name !== 'children') {
      dom[name] = fiber.props[name]
    }
  })

  //console.log('createDom', dom)
  return dom
}

const isProperty = k => k !== 'children'
export function updateDom(dom, prevProps, nextProps) {
  // Supprime old props
  Object.keys(prevProps)
    .filter(isProperty)
    .forEach(name => {
      if (!(name in nextProps)) {
        dom[name] = ''
      }
    })

  // Ajoute new props
  Object.keys(nextProps)
    .filter(isProperty)
    .forEach(name => {
      if (prevProps[name] !== nextProps[name]) {
        dom[name] = nextProps[name]
      }
    })
}
