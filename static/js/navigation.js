
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

// center board initially
let translateX = boardWall.clientWidth / 2 - board.clientWidth / 2;
let translateY = boardWall.clientHeight / 2 - board.clientHeight / 2;

boardFrame.style.transform = `translate(${translateX}px, ${translateY}px)`
let startX, startY;
let isDragging = false;

let pinchStartDistance = 0;
let pinchStartScale = 1;

/* 
  * ===================
  * ZOOMING and SCALING
  * ===================
*/

let scale = 1;
let scaleMin
let scaleMax
setScaleRange()
zoomOnPoint(0)

function setScaleRange() {
  const limitingDimension = boardWall.clientWidth > boardWall.clientHeight ? "height" : "width"
  if (limitingDimension === "height")
    scaleMin = boardWall.clientWidth / boardFrame.offsetWidth
  else
    scaleMin = boardWall.clientHeight / boardFrame.offsetHeight
  scaleMax = 3
  console.log("Scale Range:", scaleMin, scaleMax)
}

window.addEventListener("resize", setScaleRange)

// mouse scroll zooming
boardWall.addEventListener("wheel", (event) => {
  if (window.claimMode) return
  event.preventDefault();
  zoomOnPoint(event.deltaY < 0 ? 1.1 : 0.9, event.clientX, event.clientY);
});

function zoomOnPoint(scaleFactor, x, y) {
  // only allow between 0.5x and 3x zoom
  const newScale = Math.max(scaleMin, Math.min(3, scale * scaleFactor));
  if (newScale !== scale) {
    const xToCompensate = boardFrame.offsetWidth * newScale - boardFrame.offsetWidth * scale
    const yToCompensate = boardFrame.offsetHeight * newScale - boardFrame.offsetHeight * scale
    scale = newScale
    // zoom in to the point where mouse is



    // make sure translates adjust accordingly so we aren't showing out of bounds when just zooming
    setTranslateX(translateX - xToCompensate / 2, newScale)
    setTranslateY(translateY - yToCompensate / 2, newScale)
    updateTransform()
  }
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
  console.log("X Set Translate X:", boardWall.clientWidth, scaledX, newTranslateX)
  translateX = newTranslateX
}
function setTranslateY(value, overrideScale) {
  let scaledY = 0
  if (overrideScale)
    scaledY = boardFrame.offsetHeight * overrideScale
  else
    scaledY = boardFrame.getBoundingClientRect().height

  const newTranslateY = Math.min(Math.max(value, boardWall.clientHeight - scaledY), 0)
  console.log("Y Set Translate Y:", boardWall.clientHeight, scaledY, newTranslateY)
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
  * TOUCH CONTROLS OUTDATED OUTDATED OUTDATED TODO TODO
  * TODO TODO TODO
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
