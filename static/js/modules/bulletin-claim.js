const claimFormTextarea = document.getElementById("bulletin-claim-form-textarea")
const claimBulletinCard = document.getElementById("claim-bulletin-card")
const claimBulletinCardFace = document.querySelector("#claim-bulletin-card .bulletin-face")
const claimBulletinCardSlot = document.getElementById("claim-bulletin-card-slot")


const xScale = claimBulletinCardSlot.clientWidth / claimBulletinCard.offsetWidth
const yScale = claimBulletinCardSlot.clientHeight / claimBulletinCard.offsetHeight
claimBulletinCard.style.scale = xScale < yScale ? xScale : yScale

claimFormTextarea.oninput = (e) => {
  console.log("value change")
  if (claimBulletinCardFace)
    claimBulletinCardFace.innerText = e.target.value
}
