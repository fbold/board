import { hideFloatingMenu, showFloatingMenu } from "./floating-menu.js"
import { currentBoardScale, screenToBoardSpace } from "./navigation.js"


let planting = false
let flowerPos = [0, 0]

const flowerPreview = document.getElementById("flower-preview")
const flowerPreviewForm = document.getElementById("flower-preview-form")
const flowerPreviewFormPosition = document.querySelector("#flower-preview-form > [name='position']")

function endPlanting() {
  flowerPreview.hidden = true
}

function showForm(left = false) {
  if (left)
    flowerPreviewForm.classList.add("left")
  else flowerPreviewForm.classList.remove("left")
  flowerPreviewForm.style.opacity = 1
}

function hideForm() {
  flowerPreviewForm.style.opacity = 0
}

htmx.on("#flower-preview-form", "htmx:afterRequest", (e) => {
  console.log(e)
  if (e.detail.success) {
    //successful
  }
  endPlanting()
})

const moveFlowerButton = document.getElementById("move-flower-button")
moveFlowerButton.onclick = () => {
  hideForm()
  setTimeout(() => planting = true, 100)
}

function handleDoubleClick(e) {
  const [x, y] = screenToBoardSpace(e.x, e.y)
  let startPos = [Math.round(x), Math.round(y)]
  flowerPreviewForm.style.opacity = 0
  showFloatingMenu(startPos, [{ text: "Plant Flower", onclick: () => { planting = true; hideFloatingMenu() } }])
  flowerPreview.hidden = false
}


window.addEventListener("mousemove", (e) => {
  if (!planting) return
  if (e.target.classList.contains("bulletin")) {
    flowerPreview.style.opacity = 1
  } else
    flowerPreview.style.opacity = 0.5

  const flowerPosRaw = screenToBoardSpace(e.x, e.y)
  flowerPos = flowerPosRaw.map(a => Math.round(a))
  flowerPreview.style.left = flowerPos[0] + "px"
  flowerPreview.style.top = flowerPos[1] + "px"
})

window.addEventListener("click", (e) => {
  if (e.target.classList.contains("bulletin") && planting) {
    planting = false
    flowerPreviewFormPosition.value = flowerPos.join(",")
    flowerPreviewForm.style.scale = 1 / currentBoardScale
    showForm(flowerPos[0] > 1500)
    flowerPreviewForm.style.opacity = 1
  }
})

export {
  handleDoubleClick
}
