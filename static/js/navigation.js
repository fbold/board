
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
  const limitingDimension = window.innerWidth > window.innerHeight ? "height" : "width"
  if (limitingDimension === "height")
    scaleMin = window.innerWidth / board.offsetWidth
  else
    scaleMin = window.innerHeight / board.offsetHeight
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

function zoomOnPoint(scaleFactor) {
  // only allow between 0.5x and 3x zoom
  const newScale = Math.max(scaleMin, Math.min(3, scale * scaleFactor));
  if (newScale !== scale) {
    scale = newScale
    updateTransform()

  }
}

/* 
  * =======================
  * PANNING AND TRANSLATING
  * =======================
*/

// center board initially
let translateX = window.innerWidth / 2 - board.clientWidth / 2;
let translateY = window.innerHeight / 2 - board.clientHeight / 2;

board.style.transform = `translate(${translateX}px, ${translateY}px)`
let startX, startY;
let isDragging = false;

let pinchStartDistance = 0;
let pinchStartScale = 1;


function setTranslateX(value) {
  const scaledX = board.getBoundingClientRect().width
  const newTranslateX = Math.min(Math.max(value, window.innerWidth - scaledX), 0)
  console.log("X Set Translate X:", window.innerWidth, scaledX, newTranslateX)
  translateX = newTranslateX
}
function setTranslateY(value) {
  const scaledY = board.getBoundingClientRect().height
  const newTranslateY = Math.min(Math.max(value, window.innerHeight - scaledY), 0)
  console.log("Y Set Translate Y:", window.innerHeight, scaledY, newTranslateY)
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
  board.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}
