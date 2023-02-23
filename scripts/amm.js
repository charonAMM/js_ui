let $ = require('jquery')
let fs = require('fs')
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const url = require('url') 
const path = require('path')  
const ethers = require('ethers');
const { abi : chdABI } = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json")
const { abi : charonABI } = require("../artifacts/charonAMM/contracts/Charon.sol/Charon.json")
require('dotenv').config()
let eVal,gVal,pVal;
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

ethCharon = new ethers.Contract(process.env.ETHEREUM_CHARON, charonABI , ethWallet);
gnoCharon = new ethers.Contract(process.env.GNOSIS_CHARON, charonABI , gnoWallet);
polCharon = new ethers.Contract(process.env.POLYGON_CHARON, charonABI , polWallet);

function setPublicBalances(){

    //chdTokens
   ethCHD.balanceOf(ethWallet.address).then((result) =>  $('#chdETHBal').text(Math.round(ethers.utils.formatEther(result)*100)/100)) ;
   gnoCHD.balanceOf(gnoWallet.address).then((result) => $('#chdGNOBal').text(Math.round(ethers.utils.formatEther(result)*100)/100)) ;
   polCHD.balanceOf(polWallet.address).then((result) => $('#chdPOLBal').text(Math.round(ethers.utils.formatEther(result)*100)/100)) ;

   //baseTokens

   ethProvider.getBalance(ethWallet.address).then((result) =>  $('#ethBal').text(Math.round(ethers.utils.formatEther(result)*100)/100)) ;
   gnosisProvider.getBalance(gnoWallet.address).then((result) => $('#xDAIBal').text(Math.round(ethers.utils.formatEther(result)*100)/100)) ;
   polygonProvider.getBalance(polWallet.address).then((result) => $('#maticBal').text(Math.round(ethers.utils.formatEther(result)*100)/100)) ;

   //lpTokens
   ethCharon.balanceOf(ethWallet.address).then((result) =>  $('#lpETHBal').text(Math.round(ethers.utils.formatEther(result)*100)/100)) ;
   gnoCharon.balanceOf(gnoWallet.address).then((result) => $('#lpGNOBal').text(Math.round(ethers.utils.formatEther(result)*100)/100)) ;
   polCharon.balanceOf(polWallet.address).then((result) => $('#lpPOLBal').text(Math.round(ethers.utils.formatEther(result)*100)/100)) ;

}
function loadAndDisplay() {  
   setPublicBalances()

}

loadAndDisplay()