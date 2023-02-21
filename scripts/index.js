let $ = require('jquery')
let fs = require('fs')
const electron = require('electron');
const BrowserWindow = electron.remote.BrowserWindow;
const url = require('url') 
const path = require('path')  
const ethers = require('ethers');
const { abi : chdABI } = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json")
require('dotenv').config()
let filename = 'bootstrap'
let sno = 0
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

$('#add-to-list').on('click', () => {
   let name = $('#Name').val()
   let email = $('#Email').val()

   fs.appendFile('contacts', name + ',' + email + '\n')

   addEntry(name, email)
})

function addEntry(name, email) {
   if(name && email) {
      sno++
      let updateString = '<tr><td>'+ sno + '</td><td>'+ name +'</td><td>' 
         + email +'</td></tr>'
      $('#contact-table').append(updateString)
   }
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
      console.log("data", data)
      ethSet = [data[0],data[1]]
      polSet = [data[2],data[3]]
      gnoSet = [data[4],data[5]]
      fs.unlinkSync(filename);
   }

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

         ethSet[0] = Number(ethSet[0]) + 1;
         polSet[1] = Number(polSet[1])+ 10;
         gnoSet[0] = Number(gnoSet[0]) + 300;
      //set dom state

         console.log(ethSet[0])
      console.log(ethSet, "eth")
      console.log(gnoSet, "gno")
      console.log(polSet, "pol")
      //update baseblock and balance in local file
      fs.writeFile(filename, '', (err) => {
         if(err)
            console.log(err)
      })
      fs.appendFile(filename, ethSet[0] + ',' + ethSet[1] + ',' + polSet[0] + ',' + polSet[1] + ',' + gnoSet[0]+ ',' + gnoSet[1] )
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
   $('#totalBal').text(Math.round((eVal + gVal + pVal)*100)/100)
}

function loadAndDisplayContacts() {  
   setData().then((result) => loadPrivateBalances());
   setPublicBalances().then((result) => loadPublicBalances());

}

loadAndDisplayContacts()