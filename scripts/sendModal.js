let $ = require('jquery')
const ethers = require("ethers");
const { abi: chdABI } = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json")
const { abi: charonABI } = require("../artifacts/charonAMM/contracts/Charon.sol/Charon.json")
const { buildPoseidon } = require("circomlibjs");
const fs = require('fs');
require('dotenv').config()
const { Keypair } = require('../src/keypair')
const { prepareTransaction } = require('../src/index')
const Utxo = require('../src/utxo');
const { toFixedHex } = require('../src/utils');
const { BigNumber } = ethers
let m
console.log("sendModal.js loaded");
let myKeypair, builtPoseidon;
ethProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_ETHEREUM);
gnosisProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_GNOSIS);
polygonProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_POLYGON);
ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
gnoWallet = new ethers.Wallet(process.env.PRIVATE_KEY, gnosisProvider);
polWallet = new ethers.Wallet(process.env.PRIVATE_KEY, polygonProvider);
ethCHD = new ethers.Contract(process.env.ETHEREUM_CHD, chdABI, ethWallet);
gnoCHD = new ethers.Contract(process.env.GNOSIS_CHD, chdABI, gnoWallet);
polCHD = new ethers.Contract(process.env.POLYGON_CHD, chdABI, polWallet);
ethCharon = new ethers.Contract(process.env.ETHEREUM_CHARON, charonABI, ethWallet);
gnoCharon = new ethers.Contract(process.env.GNOSIS_CHARON, charonABI, gnoWallet);
polCharon = new ethers.Contract(process.env.POLYGON_CHARON, charonABI, polWallet);

function poseidon2(a,b){
   return poseidon([a,b])
   }

$('#signAndSend').on('click', () => {
   console.log("sending")
   send()
   console.log("sent")
})

function poseidon(inputs){
   let val = builtPoseidon(inputs)
   return builtPoseidon.F.toString(val)
}


readUTXOs()
   buildPoseidon().then(function (res) {
      builtPoseidon = res;
      //myKeypair = new Keypair({ privKey: process.env.PRIVATE_KEY, myHashFunc: poseidon }) // contains private and public keys
      console.log("ready to submit!!!")
   })
   function readUTXOs() {
   m = JSON.parse(fs.readFileSync('utxos.txt'));
   console.log(m);
}

let newUTXOs = []
let utxoAmount = BigNumber.from("0")
let changeUtxos = []
async function prepare2(){
   let _to = $('#toAddy').val()
   let _amount = $('#toAmount').val()
   let _withdrawal = false
   let toKey = Keypair.fromString(_to,poseidon)

   if(_withdrawal){
      if(utxoAmount != amount){
          changeUtxos.push(new Utxo({
             amount: utxoAmount - _amount,
             myHashFunc: poseidon,
             keypair: myKeypair,
             chainID: 80001
          }))
      }
   }
   else{
      console.log(utxoAmount)
      console.log("newUTXOs", newUTXOs)
       changeUtxos.push(new Utxo({ amount: _amount,myHashFunc: poseidon, keypair:toKey, chainID: 80001 }))
       changeUtxos. push(new Utxo({
        amount: BigNumber.from(utxoAmount).sub(_amount),
        myHashFunc: poseidon,
        keypair: myKeypair,
        chainID: 80001
    }))
    _to = "0x0000000000000000000000000000000000000000"
   }
}
async function prepareSend(){

   let _amount = $('#toAmount').val()
   console.log(ethers.utils.parseEther(m.ppVal.toString()),_amount)
   if(ethers.utils.parseEther(m.ppVal.toString()) < _amount){
      alert("not enough private balance on mumbai!!")
   }
   else{
   newUTXOs = []
   let myIndex;
   let jj = 0;
   let tUtxo
      while (utxoAmount < _amount && jj < m.polUTXOs.length){
         console.log(m.polUTXOs[jj].index)
         myIndex = m.polUTXOs[jj].index
         console.log("index",myIndex)
         console.log("index2",parseInt(m.polUTXOs[jj].index.hex))
         tUtxo = new Utxo({amount:m.polUTXOs[jj].amount, myHashFunc: poseidon, keypair: myKeypair, blinding:m.polUTXOs[jj].blinding, index:parseInt(m.polUTXOs[jj].index.hex), chainID : m.polUTXOs[jj].chainID})
         console.log('txt',toFixedHex(tUtxo.getCommitment(poseidon)))
         tUtxo._commitment = m.polUTXOs[jj]._commitment
         tUtxo._nullifier = m.polUTXOs[jj]._nullifier
         newUTXOs.push(tUtxo)
         utxoAmount = utxoAmount.add(m.polUTXOs[jj].amount)
         console.log("my us ", newUTXOs)
      }
   console.log("starting2")
   await prepare2();
   }
}

async function send() {
   myKeypair = new Keypair({ privkey: process.env.PRIVATE_KEY, myHashFunc: poseidon }) // contains private and public keys
   await myKeypair.pubkey
   console.log("here", myKeypair)
   let _to = $('#toAddy').val()
   let _amount = $('#toAmount').val()
   let _network = $('input[name="netType"]:checked').val();
   let _visType = $('#txType-switch').prop('checked') ? 'private' : 'public';
   let _withdrawal = false
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
         console.log(myKeypair.pubkey)
          //ADD checkbox if withdraw, add MAX button to autofill balance
         //get amount and address (can we just use an address?  Test that that person can then do something with it, if not, you need a registry?)
         await prepareSend();
         prepareTransaction({
               charon: polCharon,
               inputs: newUTXOs,
               outputs: changeUtxos,
               privateChainID: 80001,
               myHasherFunc: poseidon,
               myHasherFunc2: poseidon2
            }).then(function(inputData){
               polCharon.transact(inputData.args,inputData.extData).then((result) => console.log(result));
            })
         //to add, if fee > 0, send to relayer network!! (not built yet)
         console.log("private send pol")
         window.alert("Transaction sent on Polygon network! private tx hash: xxx")
      }
   }
}


