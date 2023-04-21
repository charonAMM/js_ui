let $ = require('jquery')
const ethers = require("ethers");
const { abi: chdABI } = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json")
const fs = require('fs');
require('dotenv').config()

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
   send()
})

const networkButtons = document.querySelectorAll('input[type="radio"]');
const toAmountInput = document.querySelector('#toAmount');

networkButtons.forEach((networkButton) => {
   networkButton.addEventListener('change', () => {
    toAmountInput.value = '';
  });
});


$("#maxButton").on('click', () => {
   let amountInput = document.querySelector('#toAmount')
   // amountInput.value = 100
   const _network = $('input[name="netType"]:checked').val();
   const _visType = $('#txType-switch').prop('checked') ? 'private' : 'public';
   if (_visType == "public") {
      if (_network == "ethereum") {
         ethCHD.balanceOf(ethWallet.address).then((result) => amountInput.value = ethers.utils.formatEther(result));
      }
      else if (_network == "gnosis") {
         gnoCHD.balanceOf(gnoWallet.address).then((result) => amountInput.value = ethers.utils.formatEther(result));
      }
      else if (_network == "polygon") {
         polCHD.balanceOf(polWallet.address).then((result) => amountInput.value = ethers.utils.formatEther(result));
      }
   }
   else {
      if (_network == "ethereum") {
         //private balance of eth
      }
      else if (_network == "gnosis") {
         //private balance of gno
      }
      else if (_network == "polygon") {
         //private balance of pol 
      }
   }
})

// readUTXOs()
// function readUTXOs() {
//    const utxos = JSON.parse(fs.readFileSync('utxos.txt'));
//    fs.unlinkSync('utxos.txt');
//    console.log(utxos);
// }

function send() {
   console.log("here")
   const _to = $('#toAddy').val()
   const _amount = $('#toAmount').val()
   const _network = $('input[name="netType"]:checked').val();
   const _visType = $('#txType-switch').prop('checked') ? 'private' : 'public';
   const _withdrawal = $('#withdrawalCheckbox').prop('checked') ? true : false;
   console.log(_network, _visType)
   console.log("to: ", _to, "amount ", _amount)
   console.log("withdrawal: ", _withdrawal)
   if (_visType == "public") {
      if (_network == "ethereum") {
         ethCHD.transfer(_to, _amount).then((result) => console.log(result));;
         window.alert("Transaction sent on Ethereum network! public tx hash: " + result.hash + " (https://etherscan.io/tx/" + result.hash)
         console.log("sent")
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
   else {
      if (_network == "ethereum") {
         console.log("private send eth")
         window.alert("Transaction sent on Ethereum network! private tx hash: xxx")
      }
      else if (_network == "gnosis") {
         console.log("private send gno")
         window.alert("Transaction sent on Gnosis network! private tx hash: xxx")
      }
      else if (_network == "polygon") {
         //ADD checkbox if withdraw, add MAX button to autofill balance
         //get amount and address (can we just use an address?  Test that that person can then do something with it, if not, you need a registry?)
         if (ppVal < _amount) {
            alert("not enough private balance on mumbai!!")
         }
         else {
            let myUTXOs = []
            let utxoAmount = 0
            let changeUtxos = []
            for (i = 0; i < polUTXOs.length; i++) {
               if (utxoAmount >= amount) {
                  break
               }
               else {
                  myUTXOs.push(polUTXOs[i])
                  utxoAmount += parseInt(polUTXOs[i].amount)
               }
            }
            if (_withdrawal) {
               if (utxoAmount != amount) {
                  changeUtxos.push(new Utxo({
                     amount: utxoAmount.sub(_amount),
                     myHashFunc: poseidon,
                     keypair: myKeypair,
                     chainID: 80001
                  }))
               }
            }
            else {
               changeUtxos.push(new Utxo({ amount: _amount, myHashFunc: poseidon, keypair: Keypair.fromString(_to, poseidon), chainID: 80001 }))
               changeUtxos.push(new Utxo({
                  amount: utxoAmount.sub(_amount),
                  myHashFunc: poseidon,
                  keypair: myKeypair,
                  chainID: 80001
               }))
               _to = "0x0000000000000000000000000000000000000000"
            }
            //submit
            prepareTransaction({
               charon: polCharon,
               inputs: myUTXOs,
               outputs: changeUtxos,
               recipient: _to,
               privateChainID: 80001,
               myHasherFunc: poseidon,
               myHasherFunc2: poseidon2
            }).then(function (inputData) {
               polCharon.transact(inputData.args, inputData.extData)
            })
            //to add, if fee > 0, send to relayer network!! (not built yet)
         }
         console.log("private send pol")
      }
   }
}

