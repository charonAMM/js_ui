let $ = require('jquery')
let fs = require('fs')
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const url = require('url') 
const path = require('path')  
const ethers = require('ethers');
const { abi : citABI } = require("../artifacts/incentiveToken/contracts/Auction.sol/Auction.json")
require('dotenv').config()
// //Check if file exists
// Connect a wallet to mainnet
ethProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_ETHEREUM);

ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
$('#myAddress').text(ethWallet.address)
ethCIT = new ethers.Contract(process.env.ETHEREUM_CIT, citABI , ethWallet);



function makeSendModal(){
   send= new BrowserWindow({width: 700, height: 500}) 
   console.log("loading")
   send.loadURL(url.format ({ 
       pathname: path.join(__dirname, '../modals/bidModal.html'), 
       protocol: 'file:', 
       slashes: true 
    })) 
    console.log("done")
}

function bid(){
   console.log("here")
   let _to = $('#toAddy').val()
   let _amount = $('#toAmount').val()
   let _network = $('input[name="netType"]:checked').val();
   let _visType = $('input[name="visType"]:checked').val();
   console.log(_network,_visType)
   console.log("to: ",_to, "amount ",_amount)
   if(_visType == "visible"){
      if(_network == "ethereum"){
         ethCHD.transfer(_to,_amount).then((result) => console.log(result));;
      }
      else if(_network == "gnosis"){
         gnoCHD.transfer(_to,_amount).then((result) => console.log(result));
      }
      else if (_network == "polygon"){
         polCHD.transfer(_to,_amount).then((result) => console.log(result));
      }
   }

}

$('#signAndBid').on('click', () => {
   bid()
})

$('#bid').on('click', () => {
   makeBidModal()
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

function setPublicBalances(){
   ethCIT.topBidder().then((result) =>  $('#topBidder').text(result))
   ethCIT.currentTopBid().then((result) =>  $('#topBid').text(Math.round(ethers.utils.formatEther(result)*100)/100));
   ethCIT.endDate().then((result) =>  $('#timeLeft').text(timeUntil(result)));
}
function loadAndDisplay() {  
   setPublicBalances()

}

loadAndDisplay()