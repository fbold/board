import { hideFloatingMenu, showFloatingMenu } from "./floating-menu.js"
import { currentBoardScale, screenToBoardSpace } from "./navigation.js"


let planting = false
let flowerPos = [0, 0]

const flowerPreview = document.getElementById("flower-preview")
const flowerPreviewForm = document.getElementById("flower-preview-form")
const flowerPreviewFormPosition = document.querySelector("#flower-preview-form > [name='position']")
const flowerPreviewCircle = document.getElementById("flower-preview-circle")
const flowerPreviewImage = document.getElementById("flower-preview-image")
const flowerSize = document.getElementById("flower-size")

const flowerSpeciesSelector = document.getElementById("flower-species-selector")
const flowerSpeciesInput = document.getElementById("flower-species-input")

const flowerSrc = (n) => `/static/images/flower-${n}.svg`

if (flowerSpeciesSelector?.children && flowerSpeciesInput)
  for (let i = 0; i < flowerSpeciesSelector.children.length; i++) {
    let specie = flowerSpeciesSelector.children.item(i)
    specie.onclick = (e) => {
      const flowerValue = e.target.getAttribute("data-value")
      flowerSpeciesInput.value = flowerValue
      flowerPreviewImage.setAttribute("src", flowerSrc(flowerValue))
      console.log(e.target.getAttribute("src"))
    }
  }

flowerPreviewForm.onchange = (e) => {
  if (e.target.name === "scale") {
    const scale = e.target.value //0.5 + 0.5 * e.target.value / 10
    flowerPreviewImage.style.scale = scale
  }
}

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

//htmx.on("#flower-preview-form", "htmx:afterRequest", (e) => {
//  console.log(e)
//  if (e.detail.success) {
//    //successful
//  }
//  endPlanting()
//})

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
