import "./navigation.js"
import "./claim.js"

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
