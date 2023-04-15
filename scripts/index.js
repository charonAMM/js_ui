let $ = require('jquery')
let fs = require('fs')
const { BrowserWindow } = require('@electron/remote')
const { Keypair } = require('../src/keypair')
const url = require('url') 
const path = require('path')  
const ethers  = require("ethers");
const Utxo = require('../src/utxo')
const { abi : chdABI } = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json")
const { abi : charonABI } = require("../artifacts/charonAMM/contracts/Charon.sol/Charon.json")
const { buildPoseidon } = require("circomlibjs");
const { toFixedHex } = require('../src/utils.js')
const { isFunction } = require('jquery')
require('dotenv').config()
let filename = 'bootstrap'
let sno = 0
let builtPoseidon, myKeypair
let eVal,gVal,pVal, peVal, pgVal,ppVal;
let ethSet = [0,0] //block, balnce initSet
let gnoSet = [0,0] //block, balnce initSet
let polSet = [0,0] //block, balnce initSet
let polUTXOs = [] //beSure to add in save mode
let ethUTXOs = [] 
let gnoUTXOs = [] 

//   0x2a4eA8464bd2DaC1Ad4f841Dcc7A8EFB4d84A27d
console.log("here")
// //Check if file exists
// Connect a wallet to mainnet
ethProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_ETHEREUM);
gnosisProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_GNOSIS);
polygonProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_POLYGON);

ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
gnoWallet = new ethers.Wallet(process.env.PRIVATE_KEY, gnosisProvider);
polWallet = new ethers.Wallet(process.env.PRIVATE_KEY, polygonProvider);
console.log("using address ", ethWallet.address)
$('#myAddress').text(ethWallet.address)
ethCHD = new ethers.Contract(process.env.ETHEREUM_CHD, chdABI , ethWallet);
gnoCHD = new ethers.Contract(process.env.GNOSIS_CHD, chdABI , gnoWallet);
polCHD = new ethers.Contract(process.env.POLYGON_CHD, chdABI , polWallet);
ethCharon= new ethers.Contract(process.env.ETHEREUM_CHARON, charonABI , ethWallet);
gnoCharon = new ethers.Contract(process.env.GNOSIS_CHARON, charonABI , gnoWallet);
polCharon = new ethers.Contract(process.env.POLYGON_CHARON, charonABI , polWallet);


function poseidon(inputs){
   let val = builtPoseidon(inputs)
   return builtPoseidon.F.toString(val)
 }


function makeSendModal(){
   sendWindow= new BrowserWindow({width: 700, height: 550, webPreferences: {nodeIntegration:false}})
   console.log("loading")
   sendWindow.loadURL(url.format ({ 
       pathname: path.join(__dirname, '../modals/sendModal.html'), 
       protocol: 'file:', 
       slashes: true 
    })) 
    console.log("done")
}

function makeBridgeModal(){
   bridgeWindow= new BrowserWindow({width: 700, height: 500, webPreferences: {nodeIntegration:false}})
   console.log("loading")
   bridgeWindow.loadURL(url.format ({ 
       pathname: path.join(__dirname, '../modals/bridgeModal.html'), 
       protocol: 'file:', 
       slashes: true 
    })) 
    console.log("done")
}

function send(){
   console.log("here")
   let _to = $('#toAddy').val()
   let _amount = $('#toAmount').val()
   let _network = $('input[name="netType"]:checked').val();
   // let _visType = $('input[name="visType"]:checked').val();
   let _visType = $('#txType-switch').prop('checked') ? 'public' : 'private';
   console.log(_network,_visType)
   console.log("to: ",_to, "amount ",_amount)
   if(_visType == "visible"){
      if(_network == "ethereum"){
         ethCHD.transfer(_to,_amount).then((result) => console.log(result));;
         console.log("sent")
      }
      else if(_network == "gnosis"){
         gnoCHD.transfer(_to,_amount).then((result) => console.log(result));
      }
      else if (_network == "polygon"){
         polCHD.transfer(_to,_amount).then((result) => console.log(result));
      }
   }      
   else{
      if(_network == "ethereum"){
         console.log("private send eth")
      }
      else if(_network == "gnosis"){
         console.log("private send gno")
      }
      else if (_network == "polygon"){
         //ADD checkbox if withdraw, add MAX button to autofill balance
         //get amount and address (can we just use an address?  Test that that person can then do something with it, if not, you need a registry?)
         if(ppVal < _amount){
            alert("not enough private balance on mumbai!!")
         }
         else{
         let myUTXOs = []
         let utxoAmount = 0
         let changeUtxos = []
         for(i=0;i<polUTXOs.length;i++){
            if (utxoAmount >= amount){
               break
            }
            else{
               myUTXOs.push(polUTXOs[i])
               utxoAmount += parseInt(polUTXOs[i].amount)
            }
         }
           if(_withdrawal){
              if(utxoAmount != amount){
                  changeUtxos.push(new Utxo({
                     amount: utxoAmount.sub(_amount),
                     myHashFunc: poseidon,
                     keypair: myKeypair,
                     chainID: 80001
                  }))
              }
           }
           else{
            changeUtxos.push(new Utxo({ amount: _amount,myHashFunc: poseidon, keypair: Keypair.fromString(_to,poseidon), chainID: 80001 }))
            changeUtxos. push(new Utxo({
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
               inputs:myUTXOs,
               outputs: changeUtxos,
               recipient: _to,
               privateChainID: 80001,
               myHasherFunc: poseidon,
               myHasherFunc2: poseidon2
            }).then(function(inputData){
               polCharon.transact(inputData.args,inputData.extData)
            })
         //to add, if fee > 0, send to relayer network!! (not built yet)
         }
         console.log("private send pol")
      }
   }

}

function setData(){
   let myKeypair = new Keypair({privkey:process.env.PRIVATE_KEY, myHashFunc: poseidon});
   // if(fs.existsSync(filename)) {
   //    let data = fs.readFileSync(filename, 'utf8').split(',')
   //    ethSet = [data[0],data[1]]
   //    polSet = [data[2],data[3]]
   //    gnoSet = [data[4],data[5]]
   //    fs.unlinkSync(filename);
   //    console.log("it exists!!")
   // }

      console.log(ethSet[0])
      console.log(polSet[0])
      console.log(gnoSet[0])
let eventFilter = ethCharon.filters.NewCommitment()
ethCharon.queryFilter(eventFilter,0,"latest").then(function(evtData){
   let index;
   for (let i=0;i< evtData.length; i++) {
            try{
               myUtxo = Utxo.decrypt(myKeypair, evtData[i].args._encryptedOutput, evtData[i].args._index)
               myUtxo.chainID = 5;
            //nowCreate nullifier
               myNullifier = myUtxo.getNullifier(poseidon)
               myNullifier = toFixedHex(myNullifier)
               ethCharon.isSpent(myNullifier).then(function(result){
                  if(!result){
                     ethSet[1] = ethSet[1] + parseInt(myUtxo.amount);
                  }
               })
            }catch{}
      }
})
eventFilter = gnoCharon.filters.NewCommitment()
gnoCharon.queryFilter(eventFilter,0, "latest").then(function(evtData){
   let index;
   for (let i=0;i< evtData.length; i++) {
      try{
         myUtxo = Utxo.decrypt(myKeypair, evtData[i].args._encryptedOutput, evtData[i].args._index)
         myUtxo.chainID = 10200;
      //nowCreate nullifier
         myNullifier = myUtxo.getNullifier(poseidon)
         myNullifier = toFixedHex(myNullifier)
         gnoCharon.isSpent(myNullifier).then(function(result){
            if(!result){
               gnoSet[1] = gnoSet[1] + parseInt(myUtxo.amount);
            }
         })
      }catch{}
}
})
eventFilter = polCharon.filters.NewCommitment()
polCharon.queryFilter(eventFilter,0, "latest").then(function(evtData){
   let index, myNullifier;
   for (let i=0;i< evtData.length; i++) {
      try{
         myUtxo = Utxo.decrypt(myKeypair, evtData[i].args._encryptedOutput, evtData[i].args._index)
         myUtxo.chainID = 80001;
      //nowCreate nullifier
         myNullifier = myUtxo.getNullifier(poseidon)
         myNullifier = toFixedHex(myNullifier)
         polCharon.isSpent(myNullifier).then(function(result){
            if(!result){
               polSet[1] = polSet[1] + parseInt(myUtxo.amount);
            }
         })
      }catch{}
}
})
   //for testing, turn back on
   // ethProvider.getBlockNumber().then((result) => ethSet[0] = result);
   // polygonProvider.getBlockNumber().then((result) => polSet[0] = result);
   // gnosisProvider.getBlockNumber().then((result) => gnoSet[0] = result);

   return new Promise(resolve => {
      setTimeout(() => {
        resolve('resolved');
      }, 2000);
    });
}


$('#send').on('click', () => {
   makeSendModal()
})

$('#bridge').on('click', () => {
   makeBridgeModal()
})

$('#signAndSend').on('click', () => {
   console.log("sending")
   send()
   console.log("sent")
})

function loadPrivateBalances(){
   //try and load from stored file and set base block / balance (contract start if not)
      //loop through all other events and get new ones
      //set dom state
      console.log(ethSet, "eth")
      console.log(gnoSet, "gno")
      console.log(polSet, "pol")
      peVal = Math.round(ethers.utils.formatEther(ethSet[1].toString())*100)/100;
      pgVal = Math.round(ethers.utils.formatEther(gnoSet[1].toString())*100)/100;
      ppVal = Math.round(ethers.utils.formatEther(polSet[1].toString())*100)/100
      $('#ethPCHD').text(peVal)
      $('#gnoPCHD').text(pgVal)
      $('#polPCHD').text(ppVal)
      $('#totalBal').text(Math.round((eVal + gVal + pVal + peVal + pgVal +ppVal)*100)/100)

      //update baseblock and balance in local file
      fs.writeFile(filename, '', (err) => {
         if(err)
            console.log(err)
      })
      //let _data = ethSet[0] + ',' + ethSet[1] + ',' + polSet[0] + ',' + polSet[1] + ',' + gnoSet[0]+ ',' + gnoSet[1]
      //fs.appendFile(filename, JSON.stringify(_data), (err) => err && console.error(err));
      //fs.appendFile(filename,  )
      //fs.unlinkSync(filename);//for testing
}

function setPublicBalances(){


   ethCHD.balanceOf(ethWallet.address).then((result) => eVal = Math.round(ethers.utils.formatEther(result)*100)/100) ;
   gnoCHD.balanceOf(gnoWallet.address).then((result) => gVal = Math.round(ethers.utils.formatEther(result)*100)/100) ;
   polCHD.balanceOf(polWallet.address).then((result) => pVal = Math.round(ethers.utils.formatEther(result)*100)/100) ;

   return new Promise(resolve => {
      setTimeout(() => {
        resolve('resolved');
      }, 2000);
    });
}

function loadPublicBalances(){
   $('#ethCHD').text(eVal)
   $('#gnoCHD').text(gVal)
   $('#polCHD').text(pVal)
   $('#totalBal').text(Math.round((eVal + gVal + pVal + peVal + pgVal + ppVal)*100)/100)
}

function loadAndDisplayContacts() {  
   setData().then((result) => loadPrivateBalances());
   setPublicBalances().then((result) => loadPublicBalances());

}

function pBuild(){
   
   buildPoseidon().then(function(res) {
      builtPoseidon = res;
      myKeypair = new Keypair({privKey:process.env.PRIVATE_KEY,myHashFunc:poseidon}) // contains private and public keys
   })
   return new Promise(resolve => {
      setTimeout(() => {
        resolve('resolved');
      }, 2000);
    });
}

pBuild().then(() => loadAndDisplayContacts())