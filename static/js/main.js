import * as navigation from "./modules/navigation.js"
import * as claim from "./modules/claim.js"
import * as plant from "./modules/plant.js"

//document.body.addEventListener('htmx:configRequest', function(evt) {
//  console.log(evt.detail.elt.id)
//  if (evt.detail.elt.id === "") {
//    console.log(window.selectedTiles)
//  }
//})


// default to view mode where panning and zooming work (handled by navigation.js)
// @ts-ignore
window.claimMode = false
// this essentially switches between allowing navigation vs claim to run
//

window.addEventListener("dblclick", (e) => {
  console.log("handling dblclick")

  if (e.target.id === "board") {
    claim.handleDoubleClick(e)
  }

  console.log(e)
  if (e.target.classList.contains("bulletin"))
    plant.handleDoubleClick(e)

})
