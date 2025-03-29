//@ts-check
/*
  this handles the zooming and panning on mobile and desktop
  start with gpt promp of which there is nothing left except the touch controls
  because I haven't got round to redoing them yet.

  - boardWall
    is just the wall where the baord is, occupies whole screen and overflow hidden
  - boardFrame
    This is what holds the board, it has some extra height and width so the board itself
    can be put 
  - board
    this the actual board, the scale get applied to this, also origin center


  apologies for long comment, cruising at Bachman's peak and paranoid I will forget what I did

*/
const boardWall = document.getElementById("board-wall")
const boardFrame = document.getElementById("board-frame")
const board = document.getElementById("board")

//if (!boardWall || !boardFrame || !board) throw new Error("Bruh")

// center board initially
let translateX = 0;
let translateY = 0;

if (boardFrame) {
  boardFrame.style.transform = `translate(${0}px, ${0}px)`
}
let startX, startY;
let isDragging = false;

let pinchStartDistance = 0;
let pinchStartScale = 1;

/* 
  * ===================
  * ZOOMING and SCALING
  * ===================
*/

// this is defined in css of the .board-frame
// needs to be halfed and set here for screen to board calcs
const FRAME_MARGIN = 100
let scale = 1;
let scaleMin
let scaleMax
setScaleRange()
zoomOnPoint(-10, -1, -1)


function setScaleRange() {
  if (!boardFrame) return
  const widthRatio = window.innerWidth / boardFrame.offsetWidth
  const heightRatio = window.innerHeight / boardFrame.offsetHeight

  if (widthRatio < heightRatio)
    scaleMin = widthRatio
  else scaleMin = heightRatio
  scaleMax = 3
  // centers the board so spacing for dimension where board doesn't reach window edge is even
  boardFrame.style.left = (window.innerWidth - boardFrame?.offsetWidth * scaleMin) / 2 + "px"
  boardFrame.style.top = (window.innerHeight - boardFrame?.offsetHeight * scaleMin) / 2 + "px"
}

window.addEventListener("resize", () => {
  setScaleRange()
  zoomOnPoint(-10, -1, -1)
})

// mouse scroll zooming
boardWall?.addEventListener("wheel", (event) => {
  if (window.claimMode) return
  event.preventDefault();
  //console.log(event.clientX)
  zoomOnPoint(event.deltaY < 0 ? 1 : -1, event.clientX, event.clientY);
});

function debugMarker(x, y, color) {
  const marker = document.createElement("div")
  marker.style.position = "absolute"
  marker.style.backgroundColor = color || "cyan"
  marker.style.height = "10px"
  marker.style.width = "10px"
  marker.style.left = x + "px"
  marker.style.top = y + "px"
  boardFrame?.appendChild(marker)
}

function screenToBoardSpace(x, y) {
  const boardRect = boardFrame?.getBoundingClientRect()
  if (!boardRect) return
  // don't worry, the scale stored does equal observed scale
  //  const empiricScale = boardRect?.width / boardFrame?.offsetWidth
  //  console.log("Screen to board space call", scale, empiricScale)
  let xFrame = (x - boardRect.left) / scale - FRAME_MARGIN
  let yFrame = (y - boardRect.top) / scale - FRAME_MARGIN
  return [xFrame, yFrame]
}

function boardToScreenSpace(x, y) {
  const boardRect = boardFrame?.getBoundingClientRect()
  if (!boardRect) return
  // don't worry, the scale stored does equal observed scale
  //  const empiricScale = boardRect?.width / boardFrame?.offsetWidth
  //  console.log("Screen to board space call", scale, empiricScale)
  console.log(x, y, "input")
  let xBoard = (x + FRAME_MARGIN) * scale + boardRect.left
  let yBoard = (y + FRAME_MARGIN) * scale + boardRect.top
  return [xBoard, yBoard]
}

function calculateScaleChangeCompensationVector(x, y, currentScale, newScale) {
  // first find current point in frame space, relative to origin at top-left corner
  const boardRect = boardFrame?.getBoundingClientRect()
  if (!boardRect) return
  let xFrame = (x - boardRect.left) / currentScale
  let yFrame = (y - boardRect.top) / currentScale
  // calculate where it will be with new scale
  // essentially v_1 = v_0 + v_0*deltaScale
  // then v_1 - v_0, and this is the compensation
  const newX = xFrame + xFrame * (newScale - currentScale)
  const xComp = newX - xFrame
  const newY = yFrame + yFrame * (newScale - currentScale)
  const yComp = newY - yFrame
  //  debugMarker(xFrame, yFrame)
  //  debugMarker(newX, newY, "red")

  return [-xComp, -yComp]
}

function zoomOnPoint(scaleFactor, x, y) {
  // only allow between 0.5x and 3x zoom
  const newScale = Math.max(scaleMin, Math.min(scaleMax, scale + 0.1 * scaleFactor));
  if (newScale === scale) return
  if (x == -1 && y == -1) {
    // if initializing zoom
    scale = newScale
    setTranslateX(translateX, newScale)
    setTranslateY(translateY, newScale)
    updateTransform()
    return
  }

  const [xComp, yComp] = calculateScaleChangeCompensationVector(x, y, scale, newScale)

  scale = newScale

  // make sure translates adjust accordingly so we aren't showing out of bounds when just zooming
  // we provide second param (overrideScale) bc boardWall.clientWidth hasn't yet been updated, so translates
  // can't be updated accordingly
  setTranslateX(translateX + xComp, newScale)
  setTranslateY(translateY + yComp, newScale)
  updateTransform()
}

/* 
  * =======================
  * PANNING AND TRANSLATING
  * =======================
*/

// this clamps translate x such that the board frame never move so far as to expose background
// this allows board frame to give some margin between board and window edge while maintaining control
// to adjust this edge just adjust width and height of #board-frame
function setTranslateX(value, overrideScale) {
  if (!boardFrame || !boardWall) return
  let scaledX = 0
  if (overrideScale)
    scaledX = boardFrame.offsetWidth * overrideScale
  else
    scaledX = boardFrame.getBoundingClientRect().width

  // this keeps it centered as we zoom in if this dimesion is smaller than window's
  if (scaledX < boardWall.clientWidth)
    boardFrame.style.left = (window.innerWidth - scaledX) / 2 + "px"

  // this doesn't include the translate, this is the left value to center it on the wall
  const boardFrameLeft = parseFloat(boardFrame.style.left.split("px")[0])

  const newTranslateX = Math.min(
    // the value (which is negative) or the total x 
    Math.max(value, (boardWall.clientWidth - scaledX - boardFrameLeft)),
    // should only applied when doesn't have to be centered, so once zoomed enough that board is >= wall
    scaledX >= boardWall.clientWidth ? -boardFrameLeft : 0
  )

  translateX = newTranslateX
}
function setTranslateY(value, overrideScale) {
  if (!boardFrame || !boardWall) return
  let scaledY = 0
  if (overrideScale)
    scaledY = boardFrame.offsetHeight * overrideScale
  else
    scaledY = boardFrame.getBoundingClientRect().height

  // this keeps it centered as we zoom in if this dimesion is smaller than window's
  if (scaledY < boardWall.clientHeight)
    boardFrame.style.top = (window.innerHeight - scaledY) / 2 + "px"

  const boardFrameTop = parseFloat(boardFrame.style.top.split("px")[0])

  const newTranslateY = Math.min(
    Math.max(value, boardWall.clientHeight - scaledY - boardFrameTop),
    // should only applied when doesn't have to be centered, so once zoomed enough that board is >= wall
    scaledY >= boardWall.clientHeight ? -boardFrameTop : 0
  )

  translateY = newTranslateY
}


// mouse panning
document.addEventListener("mousedown", (event) => {
  if (!board || event.target.classList.contains("menu")) return
  let scaledX = 0
  if (window.claimMode) return
  isDragging = true;
  startX = event.clientX - translateX;
  startY = event.clientY - translateY;
  board.style.cursor = "grabbing";
});

// moving and mouse up are done on whole document
// so move can be cancelled even if mouse leave board
document.addEventListener("mousemove", (event) => {
  if (window.claimMode) return
  if (!isDragging) return;
  //translateX = (event.clientX - startX) * 1;
  setTranslateX((event.clientX - startX) * 1)
  setTranslateY((event.clientY - startY) * 1)
  updateTransform();
});

document.addEventListener("mouseup", () => {
  if (!board) return
  if (window.claimMode) return
  isDragging = false;
  board.style.cursor = "grab";
});


/* 
  * ===================
*/
// touch pan and pinch zoom
boardWall?.addEventListener("touchstart", (event) => {
  if (window.claimMode) return
  if (event.touches.length === 1) {
    // Single touch for panning
    isDragging = true;
    startX = event.touches[0].clientX - translateX;
    startY = event.touches[0].clientY - translateY;
  } else if (event.touches.length === 2) {
    // Two-finger touch for pinch-to-zoom
    isDragging = false; // Disable panning during pinch
    pinchStartDistance = getDistance(event.touches[0], event.touches[1]);
    pinchStartScale = scale;
  }
});

boardWall?.addEventListener("touchmove", (event) => {
  if (window.claimMode) return
  if (event.touches.length === 1 && isDragging) {
    // Single finger drag for panning
    translateX = event.touches[0].clientX - startX;
    translateY = event.touches[0].clientY - startY;
    updateTransform();
  } else if (event.touches.length === 2) {
    // Two-finger pinch for zooming
    const newDistance = getDistance(event.touches[0], event.touches[1]);
    const scaleFactor = newDistance / pinchStartDistance;
  }
});

boardWall?.addEventListener("touchend", () => {
  if (window.claimMode) return
  isDragging = false;
});

function getDistance(touch1, touch2) {
  return Math.sqrt(
    (touch1.clientX - touch2.clientX) ** 2 +
    (touch1.clientY - touch2.clientY) ** 2
  );
}

function updateTransform() {
  //  boardFrame.style.transform = `translate(${translateX}px, ${translateY}px)`;
  //  board.style.transform = `scale(${scale})`;
  if (!boardFrame) return
  boardFrame.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

export {
  screenToBoardSpace,
  boardToScreenSpace,
  scale as currentBoardScale,
}
