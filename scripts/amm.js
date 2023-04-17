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

async function swap() {
  const fromAmountInput = document.getElementById('from-amount');
  const fromCurrencyDropdown = document.getElementById('from-currency');
  const toCurrencyDropdown = document.getElementById('to-currency');
  const fromAmount = ethers.utils.parseEther(fromAmountInput.value);
  const fromCurrency = fromCurrencyDropdown.value;
  const toCurrency = toCurrencyDropdown.value;
  const gasLimit = 300000;

  if (fromCurrency === "ETH") {
    console.log("swapping ETH to CHD")
    console.log("record balance", ethers.utils.formatEther(await ethCharon.recordBalance()))
    console.log("record balance synth", ethers.utils.formatEther(await ethCharon.recordBalanceSynth()))
    const EthspotPrice = await ethCharon.calcSpotPrice(
      await ethCharon.recordBalance(), // uint256 _tokenBalanceIn
      await ethCharon.recordBalanceSynth(), // tokenBalanceOut
      0
    );
    console.log("spotPrice", ethers.utils.formatEther(EthspotPrice));
    const expectedIn = EthspotPrice * fromAmountInput.value
    console.log("expectedIn", ethers.utils.formatEther(expectedIn.toString()))
    const minAmountOut = await ethCharon.calcOutGivenIn(
      await ethCharon.recordBalance(), // uint256 _tokenBalanceIn
      await ethCharon.recordBalanceSynth(), // tokenBalanceOut
      ethers.utils.parseEther(expectedIn.toString()), //adjustedIn
      0 //swapFee
    )
    console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
    //bool inisCHD, tokenAmountIn, minAmountOut, maxPrice (max price willing to send the pool to)
    ethCharon.swap(false, fromAmount, minAmountOut, EthspotPrice, { gasLimit }).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    })
  } else if (fromCurrency === "xDAI") {
    console.log("swapping xDAI to CHD")
    console.log("record balance", ethers.utils.formatEther(await gnoCharon.recordBalance()))
    console.log("record balance synth", ethers.utils.formatEther(await gnoCharon.recordBalanceSynth()))
    const GnospotPrice = await gnoCharon.calcSpotPrice(
      await gnoCharon.recordBalance(), // uint256 _tokenBalanceIn
      await gnoCharon.recordBalanceSynth(), // tokenBalanceOut
      0
    );
    console.log("spotPrice", ethers.utils.formatEther(GnospotPrice));
    const expectedIn = GnospotPrice * fromAmountInput.value
    console.log("expectedIn", ethers.utils.formatEther(expectedIn.toString()))
    const minAmountOut = await gnoCharon.calcOutGivenIn(
      await gnoCharon.recordBalance(), // uint256 _tokenBalanceIn
      await gnoCharon.recordBalanceSynth(), // tokenBalanceOut
      ethers.utils.parseEther(expectedIn.toString()), //adjustedIn
      0 //swapFee
    )
    console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
    //bool inisCHD, tokenAmountIn, minAmountOut, maxPrice (max price willing to send the pool to)
    gnoCharon.swap(false, fromAmount, minAmountOut, GnospotPrice, { gasLimit }).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    })
  } else if (fromCurrency === "MATIC") {
    console.log("swapping MATIC to CHD")
    console.log("record balance", ethers.utils.formatEther(await polCharon.recordBalance()))
    console.log("record balance synth", ethers.utils.formatEther(await polCharon.recordBalanceSynth()))
    const PolspotPrice = await polCharon.calcSpotPrice(
      await polCharon.recordBalance(), // uint256 _tokenBalanceIn
      await polCharon.recordBalanceSynth(), // tokenBalanceOut
      0
    );
    console.log("spotPrice", ethers.utils.formatEther(PolspotPrice));
    const expectedIn = PolspotPrice * fromAmountInput.value
    console.log("expectedIn", ethers.utils.formatEther(expectedIn.toString()))
    const minAmountOut = await polCharon.calcOutGivenIn(
      await polCharon.recordBalance(), // uint256 _tokenBalanceIn
      await polCharon.recordBalanceSynth(), // tokenBalanceOut
      ethers.utils.parseEther(expectedIn.toString()), //adjustedIn
      0 //swapFee
    )
    console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
    //bool inisCHD, tokenAmountIn, minAmountOut, maxPrice (max price willing to send the pool to)
    polCharon.swap(false, fromAmount, minAmountOut, PolspotPrice, { gasLimit }).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    })
  }
  else if (toCurrency == "ETH") {
    console.log("swapping CHD to ETH")
    const chdSpotPrice = await ethCharon.calcSpotPrice(
      await ethCharon.recordBalanceSynth(), // uint256 _tokenBalanceIn
      await ethCharon.recordBalance(), // tokenBalanceOut
      0
    );
    console.log("spotPrice", ethers.utils.formatEther(chdSpotPrice));
    const expectedIn = chdSpotPrice * fromAmountInput.value
    console.log("expectedIn", ethers.utils.formatEther(expectedIn.toString()))
    const minAmountOut = await ethCharon.calcSingleOutGivenIn(
      await ethCharon.recordBalanceSynth(), // uint256 _tokenBalanceIn
      await ethCharon.recordBalance(), // tokenBalanceOut
      ethers.utils.parseEther(expectedIn.toString()), //adjustedIn
      0, //swapFee
      false // bool isPool
    )
    ethCharon.swap(true, fromAmount, minAmountOut, chdSpotPrice, { gasLimit }).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    }
    )
  } else if (toCurrency == "xDAI") {
    console.log("swapping CHD to xDAI")
    const chdSpotPrice = await gnoCharon.calcSpotPrice(
      await gnoCharon.recordBalanceSynth(), // uint256 _tokenBalanceIn
      await gnoCharon.recordBalance(), // tokenBalanceOut
      0
    );
    console.log("spotPrice", ethers.utils.formatEther(chdSpotPrice));
    const expectedIn = chdSpotPrice * fromAmountInput.value
    console.log("expectedIn", ethers.utils.formatEther(expectedIn.toString()))
    const minAmountOut = await gnoCharon.calcSingleOutGivenIn(
      await gnoCharon.recordBalanceSynth(), // uint256 _tokenBalanceIn
      await gnoCharon.recordBalance(), // tokenBalanceOut
      ethers.utils.parseEther(expectedIn.toString()), //adjustedIn
      0, //swapFee
      false // bool isPool
    )
    gnoCharon.swap(true, fromAmount, minAmountOut, chdSpotPrice, { gasLimit }).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    }
    )
  } else if (toCurrency == "MATIC") {
    console.log("swapping CHD to MATIC")
    const chdSpotPrice = await polCharon.calcSpotPrice(
      await polCharon.recordBalanceSynth(), // uint256 _tokenBalanceIn
      await polCharon.recordBalance(), // tokenBalanceOut
      0
    );
    console.log("spotPrice", ethers.utils.formatEther(chdSpotPrice));
    const expectedIn = chdSpotPrice * fromAmountInput.value
    console.log("expectedIn", ethers.utils.formatEther(expectedIn.toString()))
    const minAmountOut = await polCharon.calcSingleOutGivenIn(
      await polCharon.recordBalanceSynth(), // uint256 _tokenBalanceIn
      await polCharon.recordBalance(), // tokenBalanceOut
      ethers.utils.parseEther(expectedIn.toString()), //adjustedIn
      0, //swapFee
      false // bool isPool
    )
    polCharon.swap(true, fromAmount, minAmountOut, chdSpotPrice, { gasLimit }).then((result) => {
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
fromAmountBox.addEventListener('input', async function (event) {
  const swapButton = document.getElementById('swapButton');
  const inputValue = event.target.value;
  const toAmountBox = document.getElementById('to-amount');
  if (!isNaN(inputValue)) {
    console.log('Number typed:', inputValue);
    toAmountBox.disabled = true
    swapButton.disabled = true
    toAmountBox.value = "..."
    const EthspotPrice = await ethCharon.calcSpotPrice(
      await ethCharon.recordBalance(), // uint256 _tokenBalanceIn
      await ethCharon.recordBalanceSynth(), // tokenBalanceOut
      0
    );
    const expectedIn = EthspotPrice * inputValue
    console.log("expectedIn", ethers.utils.formatEther(expectedIn.toString()))
    console.log("balance", ethers.utils.formatEther(await ethCharon.recordBalance()))
    console.log("balanceSynth", ethers.utils.formatEther(await ethCharon.recordBalanceSynth()))
    const outputAmount = ethers.utils.formatEther(expectedIn.toString());
    console.log("outputAmount", outputAmount)
    toAmountBox.value = (parseFloat(outputAmount).toFixed(3));
    toAmountBox.disabled = false
    swapButton.disabled = false
    $('#gas-estimate').text("0.000000")
  }
});

const toAmountBox = document.getElementById('to-amount');
toAmountBox.addEventListener('input', function (event) {
  const inputValue = event.target.value;
  if (!isNaN(inputValue)) {
    console.log('Number typed:', inputValue);
    // TODO: call output amount function
    const outputAmount = calcOutGivenIn(inputValue);
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
