
document.body.addEventListener('htmx:configRequest', function(evt) {
  console.log(evt.detail.elt.id)
  if (evt.detail.elt.id === "claim-button") {
    console.log(window.selectedTiles)
    evt.detail.parameters["selected-tiles"] = [1, 2, 3]
  }
})

const board = document.getElementById("board")
const tiles = document.getElementsByClassName("tile")

let startPos = [0, 0]
let endPos = [0, 0]
let selecting = false

window.addEventListener("mousedown", (e) => {
  console.log("down")
  startPos = [e.x, e.y]
  selecting = true
})

window.addEventListener("mouseup", (e) => {
  console.log("up")
  endPos = [e.x, e.y]
  // find tiles in selection
  highlightTiles(startPos, endPos)
  selecting = false
})

window.addEventListener("mousemove", (e) => {
  console.log("over")
  if (!selecting) return
  console.log("over")
  hoverHighlight(startPos, [e.x, e.y])
})

function hoverHighlight(startPos_, currentPos) {
  let startPos = [...startPos_]
  let tilesInSection = []
  let tilesNotInSection = []
  console.log(startPos, currentPos)
  for (let i = 0; i < tiles.length; i++) {
    let tile = tiles.item(i)
    let tileRect = tile.getBoundingClientRect()
    let tileX = tileRect.left + tileRect.width / 2
    let tileY = tileRect.top + tileRect.height / 2
    // make sure positions are always in right order
    if (startPos[0] > currentPos[0]) {
      let _startX = startPos[0]
      startPos[0] = currentPos[0]
      currentPos[0] = _startX
    }
    if (startPos[1] > currentPos[1]) {
      let _startY = startPos[1]
      startPos[1] = currentPos[1]
      currentPos[1] = _startY
    }

    // need a better way of limiting area
    // this doesn't always leave with rectangular plot
    //    if (tilesInSection.length >= 20) {
    //      tilesNotInSection.push(tile)
    //      continue
    //    }

    // check tiles within selection
    if (startPos[0] < tileX && tileX < currentPos[0])
      if (startPos[1] < tileY && tileY < currentPos[1]) {
        tilesInSection.push(tile)
        continue
      }

    tilesNotInSection.push(tile)
  }

  console.log(tilesInSection.length)

  tilesInSection.forEach(tile => {
    tile.classList.add("green")
  })

  tilesNotInSection.forEach(tile => {
    tile.classList.remove("green")
  })
}

function highlightTiles(startPos, endPos) {
  let tilesInSection = []
  console.log(startPos, endPos)
  for (let i = 0; i < tiles.length; i++) {
    let tile = tiles.item(i)
    let tileX = tile.getBoundingClientRect().x + tile.clientWidth / 2
    let tileY = tile.getBoundingClientRect().y + tile.clientHeight / 2
    // make sure positions are always in right order
    if (startPos[0] > endPos[0]) {
      let _startX = startPos[0]
      startPos[0] = endPos[0]
      endPos[0] = _startX
    }
    if (startPos[1] > endPos[1]) {
      let _startX = startPos[1]
      startPos[1] = endPos[1]
      endPos[1] = _startX
    }

    // check tiles within selection
    if (startPos[0] < tileX && tileX < endPos[0])
      if (startPos[1] < tileY && tileY < endPos[1])
        tilesInSection.push(tile)
  }

  console.log(tilesInSection.length)

  tilesInSection.forEach(tile => {
    tile.classList.add("green")
  })

  window.selectedTiles = tilesInSection.map((_, i) => i)
}
