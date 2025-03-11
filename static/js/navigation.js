//@ts-check
/*
  this handles the zooming and panning on mobile and desktop
  start with gpt promp that was okay, but sorted it out
  with this (genius) workaround that requires no extra js
  keep the board centered on the page on scrolling
  while also keeping centerd while zooming

  - boardWall
    is just the wall where the baord is, occupies whole screen and overflow hidden
  - boardFrame
    this is the fixed scale fram within which the actual board is origin center
    this is what the translateX and Y are relative to
  - board
    this the actual board, the scale get applied to this, also origin center


  apologies for long comment, cruising at Bachman's peak and paranoid I will forget what I did

*/
const boardWall = document.getElementById("board-wall")
const boardFrame = document.getElementById("board-frame")
const board = document.getElementById("board")

if (!boardWall || !boardFrame || !board) throw new Error("Bruh")

// center board initially
let translateX = 0;
let translateY = 0;

boardFrame.style.transform = `translate(${0}px, ${0}px)`
let startX, startY;
let isDragging = false;

let pinchStartDistance = 0;
let pinchStartScale = 1;

// for when we need to know if mouse has
// move since last we used
let lastMouseX
let lastMouseY

/* 
  * ===================
  * ZOOMING and SCALING
  * ===================
*/

let scale = 1;
let scaleMin
let scaleMax
setScaleRange()
zoomOnPoint(0, -1, -1)

function setScaleRange() {
  const limitingDimension = boardWall.clientWidth > boardWall.clientHeight ? "height" : "width"
  if (limitingDimension === "height")
    scaleMin = boardWall.clientWidth / boardFrame.offsetWidth
  else
    scaleMin = boardWall.clientHeight / boardFrame.offsetHeight
  scaleMax = 3
  //console.log("Scale Range:", scaleMin, scaleMax)
}

window.addEventListener("resize", setScaleRange)

// mouse scroll zooming
boardWall.addEventListener("wheel", (event) => {
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

/*
  * Calculate
  * @param {number} x - The x pos of fixed point in screen space
  * @param {number} y - The y pos " " "
  * @param {number} currentScale - bruh
  * @param {number} newScale - "
  * @returns {number} Returns the vector that should be applied to parent for fixed point to remain assuming top-left origin
  */
function calculateScaleChangeCompensationVector(x, y, currentScale, newScale) {
  // first find current point in frame space, relative to origin at top-left corner
  const boardRect = boardFrame?.getBoundingClientRect()
  console.log(boardRect.left, boardRect.top)
  console.log(translateX, translateY)
  console.log("=---------------=")
  let xFrame = x / currentScale - boardRect.left / currentScale
  let yFrame = y / currentScale - boardRect.top / currentScale
  // calculate where it will be with new scale
  const deltaScale = 1 + newScale - currentScale
  console.log(newScale, currentScale)
  const newX = xFrame + xFrame * (newScale - currentScale)
  const xComp = newX - xFrame
  const newY = yFrame + yFrame * (newScale - currentScale)
  const yComp = newY - yFrame
  debugMarker(xFrame, yFrame)
  debugMarker(newX, newY, "red")

  return [-xComp, -yComp]
}

function zoomOnPoint(scaleFactor, x, y) {
  // only allow between 0.5x and 3x zoom
  const newScale = Math.max(scaleMin, Math.min(3, scale + 0.1 * scaleFactor));
  if (newScale === scale) return
  if (x == -1 && y == -1) {
    // if initializing zoom
    scale = newScale
    setTranslateX(translateX, newScale)
    setTranslateY(translateY, newScale)
    updateTransform()
    return
  }
  // This is C = (0,0) where C is the center of the board
  // this was only needed if zoomin only happening on center
  // not needed for zooming on mouse, as it happens
  //    const xScaleDrift = boardFrame.offsetWidth * newScale - boardFrame.offsetWidth * scale
  //    const yScaleDrift = boardFrame.offsetHeight * newScale - boardFrame.offsetHeight * scale
  //console.log("MOUSE POS", x, y, lastMouseX, lastMouseY)
  // account for possibility mouse has changed position
  //  let mouseMoveXCompensation = 0
  //  let mouseMoveYCompensation = 0
  //  if (scale !== 1 && lastMouseX && (lastMouseX !== x || lastMouseY !== y)) {
  //    console.log("mouse moved since last zoom, compensating")
  //    // convert x and y of mouse to boardFrame space
  //    let xInFrame = lastMouseX / window.innerWidth * boardFrame.clientWidth
  //    let yInFrame = lastMouseY / window.innerHeight * boardFrame.clientHeight
  //
  //    // calculates the drift due to (top-left-origin) scaling
  //    let xMouseScaleDrift = xInFrame * scale - xInFrame
  //    let yMouseScaleDrift = yInFrame * scale - yInFrame
  //    mouseMoveXCompensation = xMouseScaleDrift
  //    mouseMoveYCompensation = yMouseScaleDrift
  //  }
  //  lastMouseX = x
  //  lastMouseY = y
  //


  // convert x and y of mouse to boardFrame space
  //  let lastXInFrame = (lastMouseX || x) / window.innerWidth * boardFrame.clientWidth
  //  let lastYInFrame = (lastMouseY || y) / window.innerHeight * boardFrame.clientHeight

  let xInFrame = (x / window.innerWidth) * boardFrame.clientWidth - translateX
  let yInFrame = (y / window.innerHeight) * boardFrame.clientHeight// - translateY

  const [xComp, yComp] = calculateScaleChangeCompensationVector(x, y, scale, newScale)

  console.log("XCOMP:", xComp, "YCOMP", yComp)
  // calculates the drift due to (top-left-origin) scaling
  let xMouseScaleDrift = xInFrame * newScale - xInFrame * scale
  let yMouseScaleDrift = yInFrame * newScale - yInFrame * scale

  //  let mouseMoveXCompensation = 0
  //  let mouseMoveYCompensation = 0
  //  if (lastMouseX && lastMouseX !== x) {
  //    mouseMoveXCompensation = xInFrame * newScale - lastXInFrame * scale
  //    mouseMoveYCompensation = yInFrame * newScale - lastYInFrame * scale
  //  }

  //  lastMouseX = x
  //  lastMouseY = y


  // so it can be applied as negative to whole board to counteract it
  const xToCompensate = -xMouseScaleDrift// + mouseMoveXCompensation
  const yToCompensate = -yMouseScaleDrift// + mouseMoveYCompensation
  //    const xToCompensate = - xScaleDrift / 2 - xMouseScaleDrift / 2
  //    const yToCompensate = - yScaleDrift / 2 - yMouseScaleDrift / 2

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

function setTranslateX(value, overrideScale) {
  let scaledX = 0
  if (overrideScale)
    scaledX = boardFrame.offsetWidth * overrideScale
  else
    scaledX = boardFrame.getBoundingClientRect().width

  // this clamps translate x such that the board frame never move so far as to expose background
  // this allows board frame to give some margin between board and window edge while maintaining control
  // to adjust this edge just adjust width and height of #board-frame
  const newTranslateX = Math.min(Math.max(value, boardWall.clientWidth - scaledX), 0)
  if (Math.round(value) != Math.round(newTranslateX)) console.log("CLAMPED")
  //console.log("X Set Translate X:", boardWall.clientWidth, scaledX, newTranslateX)
  translateX = newTranslateX
}
function setTranslateY(value, overrideScale) {
  let scaledY = 0
  if (overrideScale)
    scaledY = boardFrame.offsetHeight * overrideScale
  else
    scaledY = boardFrame.getBoundingClientRect().height

  const newTranslateY = Math.min(Math.max(value, boardWall.clientHeight - scaledY), 0)
  //console.log("Y Set Translate Y:", boardWall.clientHeight, scaledY, newTranslateY)
  translateY = newTranslateY
}


// mouse panning
boardWall.addEventListener("mousedown", (event) => {
  if (window.claimMode) return
  isDragging = true;
  startX = event.clientX - translateX;
  startY = event.clientY - translateY;
  boardWall.style.cursor = "grabbing";
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
  if (window.claimMode) return
  isDragging = false;
  boardWall.style.cursor = "grab";
});


/* 
  * ===================
*/
// touch pan and pinch zoom
boardWall.addEventListener("touchstart", (event) => {
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

boardWall.addEventListener("touchmove", (event) => {
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
    zoom(pinchStartScale * scaleFactor / scale,
      (event.touches[0].clientX + event.touches[1].clientX) / 2,
      (event.touches[0].clientY + event.touches[1].clientY) / 2);
  }
});

boardWall.addEventListener("touchend", () => {
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
  boardFrame.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}
