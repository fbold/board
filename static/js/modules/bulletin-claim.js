const claimFormTextarea = document.getElementById("bulletin-claim-form-textarea")
const claimBulletinCard = document.getElementById("claim-bulletin-card")
const claimBulletinCardSlot = document.getElementById("claim-bulletin-card-slot")


const xScale = claimBulletinCardSlot.clientWidth / claimBulletinCard.offsetWidth
const yScale = claimBulletinCardSlot.clientHeight / claimBulletinCard.offsetHeight
claimBulletinCard.style.scale = xScale < yScale ? xScale : yScale

claimFormTextarea.oninput = (e) => {
  console.log("value change")
  claimBulletinCard.innerText = e.target.value
}
