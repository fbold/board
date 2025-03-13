/*
  * Handles claiming of tiles on the board
  * Should only work when in "claim mode"
  *
  */

import { screenToBoardSpace } from "/static/js/navigation.js"

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
  selecting = false
})


let startPos = [0, 0]
let endPos = [0, 0]
let selecting = false

const board = document.getElementById("board")

const floatingMenu = document.getElementById("floating-menu")
const floatingMenuClaimButtom = document.getElementById("floating-menu-claim-button")

const floatingMenuShown = false

function hideFloatingMenu() {
  floatingMenu.hidden = true
  floatingMenu.classList.add("disappear")
}
function showFloatingMenu([x, y]) {
  floatingMenu.style.left = x + "px"
  floatingMenu.style.top = y + "px"
  floatingMenu.hidden = false
  floatingMenu.classList.add("appear")
  floatingMenuShown = true
}
board.addEventListener("dblclick", (e) => {
  const [x, y] = screenToBoardSpace(e.x, e.y)
  startPos = [Math.round(x), Math.round(y)]
  showFloatingMenu(startPos)
  setStartInput(startPos)
})

floatingMenuClaimButtom.onclick = () => {
  selecting = true
  board.style.cursor = "crosshair"
  hideFloatingMenu()
}

board.addEventListener("click", (e) => {
  if (!selecting) return
  if (e.target.id !== "board") return
  console.log("end click")
  const [x, y] = screenToBoardSpace(e.x, e.y)
  endPos = [Math.round(x), Math.round(y)]
  // find tiles in selection
  selecting = false
  board.style.cursor = "grab"
  highlightTiles(startPos, endPos)
})

window.addEventListener("mousemove", (e) => {
  //if (!window.claimMode) return
  if (e.target.id !== "board") return
  if (!selecting) return
  console.log("over")
  const [x, y] = screenToBoardSpace(e.x, e.y)
  endPos = [Math.round(x), Math.round(y)]
  showBulletinOutline(startPos, endPos)
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

function highlightTiles(startPos, endPos) {
  setStartInput(startPos)
  setEndInput(endPos)
  // need to now show input for the contents of the bulletin
  // perhaps render an input that looks like a temp version of the bulleting
  // fomatted such that the characters you type in are placed as they would be
  // once claimed.....
  showBulletinContentInput(startPos, endPos)
}

const contentPreview = document.getElementById("content-preview")
function showBulletinContentInput([x_, y_], [x, y]) {
  console.log("setting bulletin content input position")
  contentPreview.style.left = (x_ < x ? x_ : x) + "px"
  contentPreview.style.top = (y_ < y ? y_ : y) + "px"
  contentPreview.style.width = Math.abs(x - x_) + "px"
  contentPreview.style.height = Math.abs(y - y_) + "px"
  contentPreview.hidden = false
}


const contentInput = document.getElementById("content-input")
contentInput.addEventListener("input", (e) => {
  contentPreview.innerHTML = e.target.value
})





























