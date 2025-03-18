import { hideFloatingMenu, showFloatingMenu } from "./floating-menu.js"
import { currentBoardScale, screenToBoardSpace } from "./navigation.js"


let planting = false
let flowerPos = [0, 0]

const flowerPreview = document.getElementById("flower-preview")
const flowerPreviewForm = document.getElementById("flower-preview-form")
const flowerPreviewFormPosition = document.querySelector("#flower-preview-form > [name='position']")

function handleDoubleClick(e) {
  const [x, y] = screenToBoardSpace(e.x, e.y)
  let startPos = [Math.round(x), Math.round(y)]
  showFloatingMenu(startPos, [{ text: "Plant Flower", onclick: () => { planting = true; hideFloatingMenu() } }])
}


window.addEventListener("mousemove", (e) => {
  if (!planting) return
  const flowerPosRaw = screenToBoardSpace(e.x, e.y)
  flowerPos = flowerPosRaw.map(a => Math.round(a))
  console.log("splanting?")

  flowerPreview.style.left = flowerPos[0] + "px"
  flowerPreview.style.top = flowerPos[1] + "px"
})

window.addEventListener("click", (e) => {
  console.log(e.target)
  if (e.target.classList.contains("bulletin") && planting) {
    planting = false
    flowerPreviewFormPosition.value = flowerPos.join(",")
    flowerPreviewForm.style.opacity = 1
    flowerPreviewForm.style.scale = 1 / currentBoardScale
  }
})

export {
  handleDoubleClick
}
