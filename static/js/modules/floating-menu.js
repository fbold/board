
const floatingMenu = document.getElementById("floating-menu")
const floatingMenuButtons = document.getElementById("floating-menu-buttons")


function hideFloatingMenu() {
  floatingMenu.hidden = true
  floatingMenu.classList.add("disappear")
  floatingMenu.replaceChildren
}

function showFloatingMenu([x, y], buttons) {
  floatingMenu.style.left = x + "px"
  floatingMenu.style.top = y + "px"
  floatingMenu.classList.add("appear")

  let newButtons = buttons.map(button => {
    const buttonNode = document.createElement("button")
    buttonNode.innerText = button.text
    buttonNode.onclick = button.onclick
    return buttonNode
  })

  console.log(newButtons)

  floatingMenuButtons.replaceChildren(...newButtons)
  floatingMenu.hidden = false
}


export {
  showFloatingMenu,
  hideFloatingMenu
}
