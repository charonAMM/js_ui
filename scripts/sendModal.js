let $ = require('jquery')
const ethers = require("ethers");
const { abi: chdABI } = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json")
require('dotenv').config()

console.log("sendModal.js loaded");

ethProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_ETHEREUM);
gnosisProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_GNOSIS);
polygonProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_POLYGON);
ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
gnoWallet = new ethers.Wallet(process.env.PRIVATE_KEY, gnosisProvider);
polWallet = new ethers.Wallet(process.env.PRIVATE_KEY, polygonProvider);
ethCHD = new ethers.Contract(process.env.ETHEREUM_CHD, chdABI, ethWallet);
gnoCHD = new ethers.Contract(process.env.GNOSIS_CHD, chdABI, gnoWallet);
polCHD = new ethers.Contract(process.env.POLYGON_CHD, chdABI, polWallet);

$('#signAndSend').on('click', () => {
   console.log("sending")
   send()
   console.log("sent")
})

function send() {
   console.log("here")
   let _to = $('#toAddy').val()
   let _amount = $('#toAmount').val()
   let _network = $('input[name="netType"]:checked').val();
   let _visType = $('#txType-switch').prop('checked') ? 'private' : 'public';
   console.log(_network, _visType)
   console.log("to: ", _to, "amount ", _amount)
   if (_visType == "visible") {
      if (_network == "ethereum") {
         ethCHD.transfer(_to, _amount).then((result) => console.log(result));
         window.alert("Transaction sent on Ethereum network! public tx hash: " + result.hash + " (https://etherscan.io/tx/" + result.hash)
      }
      else if (_network == "gnosis") {
         gnoCHD.transfer(_to, _amount).then((result) => console.log(result));
         window.alert("Transaction sent on Gnosis network! public tx hash: " + result.hash + " (https://gnosisscan.io/tx/" + result.hash)
      }
      else if (_network == "polygon") {
         polCHD.transfer(_to, _amount).then((result) => console.log(result));
         window.alert("Transaction sent on Polygon network! public tx hash: " + result.hash + " (https://polygonscan.com/tx/" + result.hash)
      }
   }
   else if (_visType == "private") {
      if (_network == "ethereum") {
         window.alert("Transaction sent on Ethereum network! private tx hash: xxx")
      }
      else if (_network == "gnosis") {
         window.alert("Transaction sent on Gnosis network! private tx hash: xxx")
      }
      else if (_network == "polygon") {
         window.alert("Transaction sent on Polygon network! private tx hash: xxx")
      }
   }

}

