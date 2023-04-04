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


function timeUntil(timeStamp) {
   var now = new Date(),
      ms = (timeStamp - now.getTime()) / 1000;
   ms = Math.abs(Number(ms))
   var d, h, m, s;
   s = Math.floor(ms / 1000);
   m = Math.floor(s / 60);
   h = Math.floor(m / 60);
   m = m % 60;
   d = Math.floor(h / 24);
   h = h % 24;
   return d + " days, " + h + " hours, " + m + " minutes, ";
}

function setPublicBalances() {
   ethCIT.topBidder().then((result) => $('#topBidder').text(result))
   ethCIT.currentTopBid().then((result) => $('#topBid').text(Math.round(ethers.utils.formatEther(result) * 100) / 100));
   ethCIT.endDate().then((result) => $('#timeLeft').text(timeUntil(result)));
}
function loadAndDisplay() {
   setPublicBalances()

   if (timeUntil(ethCIT.endDate()) == "0 days, 0 hours, 0 minutes, ") {
      $('#claimFundsButton').removeAttr('disabled');
      $('#claimFundsButton').on('click', () => {
         ethCIT.startNewAuction().then((result) => console.log(result));
      })
   }
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