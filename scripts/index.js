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
require('dotenv').config()
let filename = 'bootstrap'
let sno = 0
let builtPoseidon, myKeypair
let eVal,gVal,pVal;
let ethSet = [0,0] //block, balnce initSet
let gnoSet = [0,0] //block, balnce initSet
let polSet = [0,0] //block, balnce initSet

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
   console.log(builtPoseidon)
   let val = builtPoseidon(inputs)
   return builtPoseidon.F.toString(val)
 }


function makeSendModal(){
   send= new BrowserWindow({width: 700, height: 500}) 
   console.log("loading")
   send.loadURL(url.format ({ 
       pathname: path.join(__dirname, '../modals/sendModal.html'), 
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

function setData(){
   if(fs.existsSync(filename)) {
      let data = fs.readFileSync(filename, 'utf8').split(',')
      ethSet = [data[0],data[1]]
      polSet = [data[2],data[3]]
      gnoSet = [data[4],data[5]]
      fs.unlinkSync(filename);
   }

      console.log(ethSet[0])
      console.log(polSet[0])
      console.log(gnoSet[0])
   const eventFilter = ["0xf3843eddcfcac65d12d9f26261dab50671fdbf5dc44441816c8bbdace2411afd"];
   let myUtxo;

const filter =  ethCharon.filters.NewCommitment();
ethCharon.queryFilter(filter, ethSet[0], "latest").then(function(evtData){
   let index;
   console.log("ETH evtData", evtData)
   for (index in evtData) {
      if(evtData[0].args._encryptedOutput){
         console.log("encryptedOutput", evtData[0].args._encryptedOutput)
         try{
            myUtxo = Utxo.decrypt(myKeypair, evtData[0].args._encryptedOutput, evtData[0].args._index)
            if(myUtxo.amount > 0){
               ethSet[1] = ethSet[1] + myUtxo.amount;
            }
         }
         catch{}
      }
   }
})
gnoCharon.queryFilter(filter, gnoSet[0], "latest").then(function(evtData){
   let index;
   console.log("GNO evtData", evtData)
   for (index in evtData) {
      if(evtData[0].args._encryptedOutput){
         console.log("encryptedOutput", evtData[0].args._encryptedOutput)
         try{
            myUtxo = Utxo.decrypt(myKeypair, evtData[0].args._encryptedOutput, evtData[0].args._index)
            console.log("good decrypt :",myUtxo)
            if(myUtxo.amount > 0){
               console.log("good set", myUtxo.amount)
               gnoSet[1] = gnoSet[1] + myUtxo.amount;
            }
         }catch{}
      }
   }
})
polCharon.queryFilter(filter, polSet[0], "latest").then(function(evtData){
   let index;
   console.log("POL evtData", evtData)
   for (index in evtData) {
      if(evtData[0].args._encryptedOutput){
         console.log("encryptedOutput", evtData[0].args._encryptedOutput)
         try{
            myUtxo = Utxo.decrypt(myKeypair, evtData[0].args._encryptedOutput, evtData[0].args._index)
            if(myUtxo.amount > 0){
               polSet[1] = polSet[1] + myUtxo.amount;
            }
         }catch{}
      }
   }
})

   ethProvider.getBlockNumber().then((result) => ethSet[0] = result);
   polygonProvider.getBlockNumber().then((result) => polSet[0] = result);
   gnosisProvider.getBlockNumber().then((result) => gnoSet[0] = result);

   return new Promise(resolve => {
      setTimeout(() => {
        resolve('resolved');
      }, 2000);
    });
}

$('#signAndSend').on('click', () => {
   send()
})

$('#send').on('click', () => {
   makeSendModal()
})

function loadPrivateBalances(){
   //try and load from stored file and set base block / balance (contract start if not)
      //loop through all other events and get new ones
      //set dom state
      console.log(ethSet, "eth")
      console.log(gnoSet, "gno")
      console.log(polSet, "pol")
      $('#ethPCHD').text(Math.round(ethers.utils.formatEther(ethSet[1])*100)/100)
      $('#gnoPCHD').text(Math.round(ethers.utils.formatEther(gnoSet[1])*100)/100)
      $('#polPCHD').text(Math.round(ethers.utils.formatEther(polSet[1])*100)/100)
      $('#totalBal').text(Math.round((eVal + gVal + pVal + ethSet[1] + gnoSet[1] + polSet[1])*100)/100)

      //update baseblock and balance in local file
      fs.writeFile(filename, '', (err) => {
         if(err)
            console.log(err)
      })
      let _data = ethSet[0] + ',' + ethSet[1] + ',' + polSet[0] + ',' + polSet[1] + ',' + gnoSet[0]+ ',' + gnoSet[1]
      fs.appendFile(filename, JSON.stringify(_data), (err) => err && console.error(err));
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
   $('#totalBal').text(Math.round((eVal + gVal + pVal + ethSet[1] + gnoSet[1] + polSet[1])*100)/100)
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