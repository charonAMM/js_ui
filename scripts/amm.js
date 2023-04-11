let $ = require('jquery')
let fs = require('fs')
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const url = require('url')
const path = require('path')
const ethers = require('ethers');
const { abi: chdABI } = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json")
const { abi: charonABI } = require("../artifacts/charonAMM/contracts/Charon.sol/Charon.json")
require('dotenv').config()
let eVal, gVal, pVal;
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
ethCHD = new ethers.Contract(process.env.ETHEREUM_CHD, chdABI, ethWallet);
gnoCHD = new ethers.Contract(process.env.GNOSIS_CHD, chdABI, gnoWallet);
polCHD = new ethers.Contract(process.env.POLYGON_CHD, chdABI, polWallet);

ethCharon = new ethers.Contract(process.env.ETHEREUM_CHARON, charonABI, ethWallet);
gnoCharon = new ethers.Contract(process.env.GNOSIS_CHARON, charonABI, gnoWallet);
polCharon = new ethers.Contract(process.env.POLYGON_CHARON, charonABI, polWallet);

function setPublicBalances() {

  //chdTokens
  ethCHD.balanceOf(ethWallet.address).then((result) => $('#chdETHBal').text(Math.round(ethers.utils.formatEther(result) * 100) / 100));
  gnoCHD.balanceOf(gnoWallet.address).then((result) => $('#chdGNOBal').text(Math.round(ethers.utils.formatEther(result) * 100) / 100));
  polCHD.balanceOf(polWallet.address).then((result) => $('#chdPOLBal').text(Math.round(ethers.utils.formatEther(result) * 100) / 100));

  //baseTokens

  ethProvider.getBalance(ethWallet.address).then((result) => $('#ethBal').text(Math.round(ethers.utils.formatEther(result) * 100) / 100));
  gnosisProvider.getBalance(gnoWallet.address).then((result) => $('#xDAIBal').text(Math.round(ethers.utils.formatEther(result) * 100) / 100));
  polygonProvider.getBalance(polWallet.address).then((result) => $('#maticBal').text(Math.round(ethers.utils.formatEther(result) * 100) / 100));

  //lpTokens
  ethCharon.balanceOf(ethWallet.address).then((result) => $('#lpETHBal').text(Math.round(ethers.utils.formatEther(result) * 100) / 100));
  gnoCharon.balanceOf(gnoWallet.address).then((result) => $('#lpGNOBal').text(Math.round(ethers.utils.formatEther(result) * 100) / 100));
  polCharon.balanceOf(polWallet.address).then((result) => $('#lpPOLBal').text(Math.round(ethers.utils.formatEther(result) * 100) / 100));

}
function loadAndDisplay() {
  setPublicBalances()
  prepareSwitchButtonClick()
}

function swap() {
  const fromAmountInput = document.getElementById('from-amount');
  const toAmountInput = document.getElementById('to-amount');
  const fromCurrencyDropdown = document.getElementById('from-currency');
  const toCurrencyDropdown = document.getElementById('to-currency');
  const fromAmount = ethers.utils.parseEther(fromAmountInput.value);
  const toAmount = ethers.utils.parseEther(toAmountInput.value);
  const fromCurrency = fromCurrencyDropdown.value;
  const toCurrency = toCurrencyDropdown.value;
  // TODO: get the actual max price
  const maxPrice = ethers.utils.parseEther("1.0");

  if (fromCurrency === "ETH") {
    console.log("swapping ETH to CHD")
    //bool inisCHD, tokenAmountIn, minAmountOut, maxPrice (max price willing to send the pool to)
    ethCharon.swap(false, fromAmount, toAmount, maxPrice).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    })
  } else if (fromCurrency === "xDAI") {
    gnoCharon.swap(false, fromAmount, toAmount, maxPrice).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    })
  } else if (fromCurrency === "MATIC") {
    polCharon.swap(false, fromAmount, toAmount, maxPrice).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    })
  }
  else if (toCurrency == "ETH") {
    console.log("swapping CHD to ETH")
    ethCharon.swap(true, fromAmount, toAmount, maxPrice).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    }
    )
  } else if (toCurrency == "xDAI") {
    console.log("swapping CHD to xDAI")
    gnoCharon.swap(true, fromAmount, toAmount, maxPrice).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    }
    )
  } else if (toCurrency == "MATIC") {
    console.log("swapping CHD to MATIC")
    polCharon.swap(true, fromAmount, toAmount, maxPrice).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    }
    )
  }
}

  $("#swapButton").on('click', () => {
    swap()
  });

  const fromAmountBox = document.getElementById('from-amount');
  fromAmountBox.addEventListener('input', function (event) {
    const inputValue = event.target.value;
    if (!isNaN(inputValue)) {
      console.log('Number typed:', inputValue);
      // TODO: call output amount function
      const outputAmount = inputValue * 1.5;
      const toAmountBox = document.getElementById('to-amount');
      toAmountBox.value = outputAmount;

      // TODO: call estimateGas
      $('#gas-estimate').text("0.000000")
    }
  });

  const toAmountBox = document.getElementById('to-amount');
  toAmountBox.addEventListener('input', function (event) {
    const inputValue = event.target.value;
    if (!isNaN(inputValue)) {
      console.log('Number typed:', inputValue);
      // TODO: call output amount function
      const outputAmount = inputValue * 1.5;
      const fromAmountBox = document.getElementById('from-amount');
      fromAmountBox.value = outputAmount;

      // TODO: call estimateGas
      $('#gas-estimate').text("0.000000")

    }
  });



  function prepareSwitchButtonClick() {
    const fromAmountInput = document.getElementById('from-amount');
    const toAmountInput = document.getElementById('to-amount');
    const arrowImg = document.querySelector('.card-arrow img');
    const fromCurrencyDropdown = document.getElementById('from-currency');
    const toCurrencyDropdown = document.getElementById('to-currency');

    arrowImg.addEventListener('click', () => {
      const temp = fromAmountInput.value;
      fromAmountInput.value = toAmountInput.value;
      toAmountInput.value = temp;

      const toCurrencyOptions = fromCurrencyDropdown.innerHTML;

      fromCurrencyDropdown.innerHTML = toCurrencyDropdown.innerHTML;
      toCurrencyDropdown.innerHTML = toCurrencyOptions;
    });
  }


  loadAndDisplay()
