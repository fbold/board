/*
  * Handles claiming of tiles on the board
  * Should only work when in "claim mode"
  *
  */

import { hideFloatingMenu, showFloatingMenu } from "./floating-menu.js"
import { screenToBoardSpace, boardToScreenSpace } from "./navigation.js"

const startInput = document.getElementById("start_pos")
const endInput = document.getElementById("end_pos")

function setStartInput([x, y]) {
  startInput.setAttribute("value", `${x},${y}`)
}
function setEndInput([x, y]) {
  endInput.setAttribute("value", `${x},${y}`)
}

document.addEventListener('htmx:afterSwap', function(evt) {
  // these are set to hx-preserve, so need to clear their values
  // hx-preserve is so these js references to them aren't lost
  startInput.setAttribute("value", "")
  endInput.setAttribute("value", "")
  bulletinClaimButton.style.display = "none";
  selecting = false
})


let startPos = [0, 0]
let endPos = [0, 0]
let selecting = false

const board = document.getElementById("board")

const floatingMenuClaimButtom = document.getElementById("floating-menu-claim-button")


function handleDoubleClick(e) {
  const [x, y] = screenToBoardSpace(e.x, e.y)
  startPos = [Math.round(x), Math.round(y)]
  showFloatingMenu(startPos, [{
    text: "Claim Land", onclick: () => {
      bulletinClaimButton.style.display = "none";
      selecting = true
      board.style.cursor = "crosshair"
      hideFloatingMenu()
    }
  }])
  setStartInput(startPos)
}

if (floatingMenuClaimButtom)
  floatingMenuClaimButtom.onclick = () => {
    selecting = true
    board.style.cursor = "crosshair"
    hideFloatingMenu()
  }

window.addEventListener("mousemove", (e) => {
  //if (!window.claimMode) return
  if (e.target.id !== "board") return
  if (!selecting) return
  console.log("over")
  const [x, y] = screenToBoardSpace(e.x, e.y)
  endPos = [Math.round(x), Math.round(y)]
  showBulletinOutline(startPos, endPos)
})

board?.addEventListener("click", (e) => {
  if (!selecting) return
  if (e.target.id !== "board") return
  console.log("end click")
  const [x, y] = screenToBoardSpace(e.x, e.y)
  endPos = [Math.round(x), Math.round(y)]
  // find tiles in selection
  selecting = false
  board.style.cursor = "grab"
  highlightSelectedArea(startPos, endPos)
})

const bulletinOutline = document.getElementById("bulletin-outline")
function showBulletinOutline([x_, y_], [x, y]) {
  console.log("setting bulletin content input position")

  bulletinOutline.style.left = (x_ < x ? x_ : x) + "px"
  bulletinOutline.style.top = (y_ < y ? y_ : y) + "px"
  bulletinOutline.style.width = Math.abs(x - x_) + "px"
  bulletinOutline.style.height = Math.abs(y - y_) + "px"
  bulletinOutline.hidden = false
}

const bulletinClaimButton = document.getElementById("bulletin-claim-button")
function highlightSelectedArea(startPos, endPos) {
  setStartInput(startPos)
  setEndInput(endPos)
  // need to now show input for the contents of the bulletin
  // perhaps render an input that looks like a temp version of the bulleting
  // fomatted such that the characters you type in are placed as they would be
  // once claimed.....
  bulletinClaimButton.setAttribute("href", `/claim?from=${startPos.join(",")}&to=${endPos.join(",")}`)
  bulletinClaimButton.style.display = "flex";
}

const contentInput = document.getElementById("content-input")
contentInput?.addEventListener("input", (e) => {
  bulletinPreview.innerHTML = e.target.value
})

export {
  handleDoubleClick
}

