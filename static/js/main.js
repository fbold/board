document.body.addEventListener('htmx:configRequest', function(evt) {
  console.log(evt.detail.elt.id)
  if (evt.detail.elt.id === "claim-button") {
    console.log(window.selectedTiles)
    evt.detail.parameters["selected-tiles"] = [1, 2, 3]
  }
})

const board = document.getElementById("board")
const tiles = document.getElementsByClassName("tile")

const startInput = document.getElementById("start_pos")
const endInput = document.getElementById("end_pos")

function setStartInput(x, y) {
  startInput.setAttribute("value", `${x},${y}`)
}
function setEndInput(x, y) {
  endInput.setAttribute("value", `${x},${y}`)
}

document.addEventListener('htmx:afterSwap', function(evt) {
  // these are set to hx-preserve, so need to clear their values
  // hx-preserve is so these js references to them aren't lost
  startInput.setAttribute("value", "")
  endInput.setAttribute("value", "")
})


let startPos = [0, 0]
let endPos = [0, 0]
let selecting = false

window.addEventListener("mousedown", (e) => {
  if (e.target.id !== "board") return
  console.log("down")
  startPos = [e.x, e.y]
  selecting = true
})

window.addEventListener("mousemove", (e) => {
  if (e.target.id !== "board") return
  if (!selecting) return
  console.log("over")
  hoverHighlight(startPos, [e.x, e.y])
})

window.addEventListener("mouseup", (e) => {
  if (e.target.id !== "board") return
  console.log("up")
  endPos = [e.x, e.y]
  // find tiles in selection
  selecting = false
  highlightTiles(startPos, endPos)
})


function normalizeSelection(startPos, endPos) {
  if (startPos[0] > endPos[0]) {
    let _startX = startPos[0]
    startPos[0] = endPos[0]
    endPos[0] = _startX
  }
  if (startPos[1] > endPos[1]) {
    let _startY = startPos[1]
    startPos[1] = endPos[1]
    endPos[1] = _startY
  }
  return startPos, endPos
}

function getTilePos(tile) {
  let tileRect = tile.getBoundingClientRect()
  let x = tileRect.left + tileRect.width / 2
  let y = tileRect.top + tileRect.height / 2
  return [x, y]
}

function hoverHighlight(startPos_, currentPos) {
  let startPos = startPos_.slice()
  let tilesInSection = []
  let tilesNotInSection = []
  console.log(startPos, currentPos)
  for (let i = 0; i < tiles.length; i++) {
    let tile = tiles.item(i)
    let [tileX, tileY] = getTilePos(tile)
    // make sure positions are always in right order
    startPos, currentPos = normalizeSelection(startPos, currentPos)

    // check tiles within selection
    if (startPos[0] < tileX && tileX < currentPos[0])
      if (startPos[1] < tileY && tileY < currentPos[1]) {
        tilesInSection.push(tile)
        continue
      }

    tilesNotInSection.push(tile)
  }

  console.log(tilesInSection.length)
  const [x_, y_] = tilesInSection[0].getAttribute("name").split(",")
  const [x, y] = tilesInSection[tilesInSection.length - 1].getAttribute("name").split(",")

  setStartInput(x_, y_)
  setEndInput(x, y)
  showBulletinOutline([x_, y_], [x, y])

  //tilesInSection.forEach(tile => {
  //tile.classList.add("highlight-preview")
  //})
  //
  //tilesNotInSection.forEach(tile => {
  //tile.classList.remove("highlight-preview")
  //})
}

const bulletinOutline = document.getElementById("bulletin-outline")
function showBulletinOutline(start, end) {
  console.log("setting bulletin content input position")
  bulletinOutline.style.left = start[0] * 10 - 1 + "px"
  bulletinOutline.style.top = start[1] * 10 - 1 + "px"
  bulletinOutline.style.width = (end[0] - start[0] + 1) * 10 + "px"
  bulletinOutline.style.height = (end[1] - start[1] + 1) * 10 + "px"
  bulletinOutline.hidden = false
}

function highlightTiles(startPos, endPos) {
  let tilesInSection = []
  console.log(startPos, endPos)
  for (let i = 0; i < tiles.length; i++) {
    let tile = tiles.item(i)
    let [tileX, tileY] = getTilePos(tile)
    // make sure positions are always in right order
    startPos, endPos = normalizeSelection(startPos, endPos)

    // check tiles within selection
    if (startPos[0] < tileX && tileX < endPos[0])
      if (startPos[1] < tileY && tileY < endPos[1])
        tilesInSection.push(tile)
  }

  console.log(tilesInSection.length)

  // TODO do this programatically with math finding nearest rounded value
  // instead of with divs?
  const [x_, y_] = tilesInSection[0].getAttribute("name").split(",")
  const [x, y] = tilesInSection[tilesInSection.length - 1].getAttribute("name").split(",")

  setStartInput(x_, y_)
  setEndInput(x, y)

  //tilesInSection.forEach(tile => {
  //tile.classList.add("highlight-preview")
  //})

  // need to now show input for the contents of the bulletin
  // perhaps render an input that looks like a temp version of the bulleting
  // fomatted such that the characters you type in are placed as they would be
  // once claimed.....
  showBulletinContentInput([x_, y_], [x, y])
}

const contentPreview = document.getElementById("content-preview")
function showBulletinContentInput(start, end) {
  console.log("setting bulletin content input position")
  contentPreview.style.left = start[0] * 10 - 1 + "px"
  contentPreview.style.top = start[1] * 10 - 1 + "px"
  contentPreview.style.width = (end[0] - start[0] + 1) * 10 + "px"
  contentPreview.style.height = (end[1] - start[1] + 1) * 10 + "px"
  contentPreview.hidden = false
}


const contentInput = document.getElementById("content-input")
contentInput.addEventListener("input", (e) => {
  contentPreview.innerHTML = e.target.value
})





























