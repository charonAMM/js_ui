let $ = require('jquery')
let fs = require('fs')
const electron = require('electron');
const { BrowserWindow } = require('@electron/remote')
const url = require('url')
const path = require('path')
const ethers = require('ethers');
const { abi: citABI } = require("../artifacts/incentiveToken/contracts/Auction.sol/Auction.json")
require('dotenv').config()
// //Check if file exists
// Connect a wallet to mainnet
ethProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_ETHEREUM);

ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
$('#myAddress').text(ethWallet.address)
ethCIT = new ethers.Contract(process.env.ETHEREUM_CIT, citABI, ethWallet);


// function bid() {
//    console.log("here")
//    let _to = $('#toAddy').val()
//    let _amount = $('#toAmount').val()
//    let _network = $('input[name="netType"]:checked').val();
//    let _visType = $('input[name="visType"]:checked').val();
//    console.log(_network, _visType)
//    console.log("to: ", _to, "amount ", _amount)
//    if (_visType == "visible") {
//       if (_network == "ethereum") {
//          ethCHD.transfer(_to, _amount).then((result) => console.log(result));;
//       }
//       else if (_network == "gnosis") {
//          gnoCHD.transfer(_to, _amount).then((result) => console.log(result));
//       }
//       else if (_network == "polygon") {
//          polCHD.transfer(_to, _amount).then((result) => console.log(result));
//       }
//    }
// }

$('#signAndBid').on('click', () => {
   console.log("sign and bid clicked")
   if($('#bidAmount').val() > $('#topBid').text()) {
      ethCIT.bid().then((result) => console.log(result));
   }
   else {
      console.log("bid too low")
   }
})

$('#bid').on('click', () => {
   makeBidModal()
})

$('bidAmount').on('input', () => {
   console.log("here")
})

function timeLeft(timestamp) {
   const now = Date.now();
   const timeLeft = timestamp - now;
   const seconds = Math.floor(timeLeft / 1000);
   const days = Math.floor(seconds / (24 * 60 * 60));
   const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
   const minutes = Math.floor((seconds % (60 * 60)) / 60);
   let timeString = '';
   if (days > 0) {
     timeString += days + ' day' + (days > 1 ? 's' : '') + ', ';
   }
   if (hours > 0) {
     timeString += hours + ' hour' + (hours > 1 ? 's' : '') + ', ';
   }
   timeString += minutes + ' minute' + (minutes > 1 ? 's' : '');
   return timeString;
 }
 

async function setPublicBalances() {
   await ethCIT.topBidder().then((result) => $('#topBidder').text(result))
   await ethCIT.currentTopBid().then((result) => $('#topBid').text(Math.round(ethers.utils.formatEther(result) * 100) / 100));

   const currentDate = new Date();
   const currentUnix = Math.floor(currentDate.getTime()/1000);
   const endDateUnix = await ethCIT.endDate();
   console.log("end date unix " + endDateUnix)
   const endDateString = new Date( endDateUnix * 1000).toLocaleString();
   console.log("curent date " + currentDate)
   console.log("end date " + endDateString)

   console.log("time left " + timeLeft(endDateUnix * 1000))
  

   if (endDateUnix <= currentUnix) {
      $('#timeLeft').text("0 day, 0 hours, 0 minutes,");
      $('#endFeeRoundButton').removeAttr('disabled');
      $('#bid').attr('disabled', true);
      $('#endFeeRoundButton').on('click', async () => {
         console.log("end date" + endDateUnix)
         await ethCIT.startNewAuction().then((result) => console.log(result));
         loadAndDisplay()
      })
   }else {
   await ethCIT.endDate().then((result) => $('#timeLeft').text(timeLeft(result * 1000)));
   $('#bid').removeAttr('disabled');
   }
}
function loadAndDisplay() {
   setPublicBalances()
}

function makeBidModal() {

   bidModal = new BrowserWindow({
      width: 700, height: 300, webPreferences: {
         contentSecurityPolicy: "default-src 'self';",
      }
   })

   bidModal.loadURL(url.format({
      pathname: path.join(__dirname, '../modals/bidModal.html'),
      protocol: 'file:',
      slashes: true
   }))
}


// function addListener() {
//    bidAmountField = document.getElementById('bidAmount')
//    bidButton = document.getElementById('bidSignAndSend')
//    // const currentTopBid = Math.round(ethers.utils.formatEther(ethCIT.currentTopBid()) * 100) / 100
//    const currentTopBid = 100

//    console.log(currentTopBid)
   
//    bidAmountField.addEventListener('input', () => {
//       const bidValue = parseInt(bidAmountField.value)
//       console.log(bidValue)
//       if (bidValue > currentTopBid) {
//          bidButton.removeAttribute('disabled')
//       }
//       else {
//          bidButton.setAttribute('disabled', true)
//       }
//    })
// }

loadAndDisplay()