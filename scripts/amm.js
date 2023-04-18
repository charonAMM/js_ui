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

  //record balance xdai
  console.log("record balance xdai", ethers.utils.formatEther(await gnoCharon.recordBalance()))
  //record balance synth xdai
  console.log("record balance synth xdai", ethers.utils.formatEther(await gnoCharon.recordBalanceSynth()))
  //record balance matic
  console.log("record balance matic", ethers.utils.formatEther(await polCharon.recordBalance()))
  //record balance synth matic
  console.log("record balance synth matic", ethers.utils.formatEther(await polCharon.recordBalanceSynth()))

  if (fromCurrency === "ETH") {
    const ethBalance = await ethProvider.getBalance(ethWallet.address)
    if (ethers.utils.formatEther(ethBalance) < ethers.utils.formatEther(fromAmount)) {
      alert("You don't have enough ETH to make this swap")
      return
    }
    console.log("swapping ETH to CHD")
    console.log("record balance", ethers.utils.formatEther(await ethCharon.recordBalance()))
    console.log("record balance synth", ethers.utils.formatEther(await ethCharon.recordBalanceSynth()))
    const EthspotPrice = await ethCharon.calcSpotPrice(
      await ethCharon.recordBalance(), // uint256 _tokenBalanceIn
      await ethCharon.recordBalanceSynth(), // tokenBalanceOut
      0
    );
    console.log("spotPrice", ethers.utils.formatEther(EthspotPrice));
    const exitFee = ethers.utils.formatEther(fromAmount) * ethers.utils.formatEther(await ethCharon.fee())
    console.log("fromAmount", fromAmount)
    const adjustedIn = ethers.utils.formatEther(fromAmount) - exitFee
    const minAmountOut = await ethCharon.calcOutGivenIn(
      await ethCharon.recordBalance(), // uint256 _tokenBalanceIn
      await ethCharon.recordBalanceSynth(), // tokenBalanceOut
      ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
      0 //swapFee
    )
    console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
    //bool inisCHD, tokenAmountIn, minAmountOut, maxPrice (max price willing to send the pool to)
    ethCharon.swap(false, fromAmount, minAmountOut, EthspotPrice, { gasLimit }).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    })
  } else if (fromCurrency === "xDAI") {
    const xDAIBalance = await gnosisProvider.getBalance(gnoWallet.address)
    if (ethers.utils.formatEther(xDAIBalance) < ethers.utils.formatEther(fromAmount)) {
      alert("You don't have enough xDAI to make this swap")
      return
    }
    console.log("swapping xDAI to CHD")
    console.log("record balance", ethers.utils.formatEther(await gnoCharon.recordBalance()))
    console.log("record balance synth", ethers.utils.formatEther(await gnoCharon.recordBalanceSynth()))
    const GnospotPrice = await gnoCharon.calcSpotPrice(
      await gnoCharon.recordBalance(), // uint256 _tokenBalanceIn
      await gnoCharon.recordBalanceSynth(), // tokenBalanceOut
      0
    );
    console.log("spotPrice", ethers.utils.formatEther(GnospotPrice));
    const exitFee = ethers.utils.formatEther(fromAmount) * ethers.utils.formatEther(await gnoCharon.fee())
    console.log("fromAmount", fromAmount)
    const adjustedIn = ethers.utils.formatEther(fromAmount) - exitFee
    const minAmountOut = await gnoCharon.calcOutGivenIn(
      await gnoCharon.recordBalance(), // uint256 _tokenBalanceIn
      await gnoCharon.recordBalanceSynth(), // tokenBalanceOut
      ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
      0 //swapFee
    )
    console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
    //bool inisCHD, tokenAmountIn, minAmountOut, maxPrice (max price willing to send the pool to)
    gnoCharon.swap(false, fromAmount, minAmountOut, GnospotPrice, { gasLimit }).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    })
  } else if (fromCurrency === "MATIC") {
    const MATICBalance = await polygonProvider.getBalance(polWallet.address)
    if (ethers.utils.formatEther(MATICBalance) < ethers.utils.formatEther(fromAmount)) {
      alert("You don't have enough MATIC to make this swap")
      return
    }
    console.log("swapping MATIC to CHD")
    console.log("record balance", ethers.utils.formatEther(await polCharon.recordBalance()))
    console.log("record balance synth", ethers.utils.formatEther(await polCharon.recordBalanceSynth()))
    const PolspotPrice = await polCharon.calcSpotPrice(
      await polCharon.recordBalance(), // uint256 _tokenBalanceIn
      await polCharon.recordBalanceSynth(), // tokenBalanceOut
      0
    );

    console.log("spotPrice", ethers.utils.formatEther(PolspotPrice));
    const exitFee = ethers.utils.formatEther(fromAmount) * ethers.utils.formatEther(await polCharon.fee())
    console.log("fromAmount", fromAmount)
    const adjustedIn = ethers.utils.formatEther(fromAmount) - exitFee
    const minAmountOut = await polCharon.calcOutGivenIn(
      await polCharon.recordBalance(), // uint256 _tokenBalanceIn
      await polCharon.recordBalanceSynth(), // tokenBalanceOut
      ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
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
    const chdBalance = await ethCHD.balanceOf(ethWallet.address)
    if (ethers.utils.formatEther(chdBalance) < ethers.utils.formatEther(fromAmount)) {
      alert("You don't have enough CHD to make this swap")
      return
    }
    console.log("swapping CHD to ETH")
    const chdSpotPrice = await ethCharon.calcSpotPrice(
      await ethCharon.recordBalanceSynth(), // uint256 _tokenBalanceIn
      await ethCharon.recordBalance(), // tokenBalanceOut
      0
    );
    console.log("spotPrice", ethers.utils.formatEther(chdSpotPrice));
    const exitFee = ethers.utils.formatEther(fromAmount) * ethers.utils.formatEther(await ethCharon.fee())
    console.log("fromAmount", fromAmount)
    const adjustedIn = ethers.utils.formatEther(fromAmount) - exitFee
    const minAmountOut = await ethCharon.calcSingleOutGivenIn(
      await ethCharon.recordBalance(), // tokenBalanceOut
      await ethCharon.recordBalanceSynth(), // uint256 tokenBalanceIn
      ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
      0, //swapFee
      false // bool isPool
    )
    console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
    ethCharon.swap(true, fromAmount, minAmountOut, chdSpotPrice, { gasLimit }).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    })
  } else if (toCurrency == "xDAI") {
    const chdBalance = await gnoCHD.balanceOf(gnoWallet.address)
    if (ethers.utils.formatEther(chdBalance) < ethers.utils.formatEther(fromAmount)) {
      alert("You don't have enough CHD to make this swap")
      return
    }
    console.log("swapping CHD to xDAI")
    const chdSpotPrice = await gnoCharon.calcSpotPrice(
      await gnoCharon.recordBalanceSynth(), // uint256 _tokenBalanceIn
      await gnoCharon.recordBalance(), // tokenBalanceOut
      0
    );
    console.log("spotPrice", ethers.utils.formatEther(chdSpotPrice));
    const exitFee = ethers.utils.formatEther(fromAmount) * ethers.utils.formatEther(await gnoCharon.fee())
    const adjustedIn = ethers.utils.formatEther(fromAmount) - exitFee
    const minAmountOut = await gnoCharon.calcSingleOutGivenIn(
      await gnoCharon.recordBalance(), // tokenBalanceOut
      await gnoCharon.recordBalanceSynth(), // uint256 _tokenBalanceIn
      ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
      0, //swapFee
      false // bool isPool
    )
    console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
    gnoCharon.swap(true, fromAmount, minAmountOut, chdSpotPrice, { gasLimit }).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    })
  } else if (toCurrency == "MATIC") {
    const chdBalance = await polCHD.balanceOf(polWallet.address)
    if (ethers.utils.formatEther(chdBalance) < ethers.utils.formatEther(fromAmount)) {
      alert("You don't have enough CHD to make this swap")
      return
    }
    console.log("swapping CHD to MATIC")
    const chdSpotPrice = await polCharon.calcSpotPrice(
      await polCharon.recordBalanceSynth(), // uint256 _tokenBalanceIn
      await polCharon.recordBalance(), // tokenBalanceOut
      0
    );
    console.log("spotPrice", ethers.utils.formatEther(chdSpotPrice));
    const exitFee = ethers.utils.formatEther(fromAmount) * ethers.utils.formatEther(await polCharon.fee())
    const adjustedIn = ethers.utils.formatEther(fromAmount) - exitFee
    const minAmountOut = await polCharon.calcSingleOutGivenIn(
      await polCharon.recordBalance(), // tokenBalanceOut
      await polCharon.recordBalanceSynth(), // uint256 _tokenBalanceIn
      ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
      0, //swapFee
      false // bool isPool
    )
    console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
    polCharon.swap(true, fromAmount, minAmountOut, chdSpotPrice, { gasLimit }).then((result) => {
      console.log("swap result", result)
      loadAndDisplay()
    })
  }
}

$("#swapButton").on('click', () => {
  swap()
});

const fromAmountBox = document.getElementById('from-amount');
fromAmountBox.addEventListener('input', () => calculateConversion());

async function calculateConversion() {
  const inputValue = fromAmountBox.value;
  const toAmountBox = document.getElementById('to-amount');
  if (!isNaN(inputValue)) {
    console.log('Number typed:', inputValue);
    toAmountBox.value = "..."
    const fromCurrencyDropdown = document.getElementById('from-currency');
    const toCurrencyDropdown = document.getElementById('to-currency');
    let spotPrice;
    let slippage;
    $('#slippage').text((slippage * 100).toFixed(3))
    if (fromCurrencyDropdown.value == "ETH") {
      spotPrice = await ethCharon.calcSpotPrice(
        await ethCharon.recordBalanceSynth(), // tokenBalanceIn
        await ethCharon.recordBalance(), // uint256 _tokenBalanceOut
        0
      );
      const expectedOut = spotPrice * inputValue
      const exitFee = inputValue * ethers.utils.formatEther(await ethCharon.fee())
      console.log("exitFee", exitFee)
      const adjustedIn = inputValue - exitFee
      console.log("adjustedIn", ethers.utils.parseEther(adjustedIn.toString()))
      const minAmountOut = await ethCharon.calcOutGivenIn(
        await ethCharon.recordBalance(), // uint256 _tokenBalanceIn
        await ethCharon.recordBalanceSynth(), // tokenBalanceOut
        ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
        0, //swapFee
      )
      console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
      slippage = (minAmountOut - expectedOut) / expectedOut;
      console.log("slippage", slippage)
      const gasEstimate = await ethCharon.estimateGas.swap(
        false, // bool _isSynthIn
        ethers.utils.parseEther(inputValue), // uint256 _tokenAmountIn
        minAmountOut, // uint256 _minAmountOut
        spotPrice, // uint256 _spotPrice
      )
      console.log("gasEstimate", gasEstimate.toString())
      $('#gas-estimate').text(gasEstimate)
    } else if (fromCurrencyDropdown.value == "xDAI") {
      console.log("recordBalance",ethers.utils.formatEther(await gnoCharon.recordBalance()))
      console.log("recordBalanceSynth", ethers.utils.formatEther(await gnoCharon.recordBalanceSynth()))
      spotPrice = await gnoCharon.calcSpotPrice(
        await gnoCharon.recordBalanceSynth(), // tokenBalanceIn
        await gnoCharon.recordBalance(), // uint256 _tokenBalanceOut
        0
      );
      const expectedOut = spotPrice * inputValue
      const exitFee = inputValue * ethers.utils.formatEther(await gnoCharon.fee())
      console.log("exitFee", exitFee)
      const adjustedIn = inputValue - exitFee
      console.log("adjustedIn", ethers.utils.parseEther(adjustedIn.toString()))
      const minAmountOut = await gnoCharon.calcOutGivenIn(
        await gnoCharon.recordBalance(), // uint256 _tokenBalanceIn
        await gnoCharon.recordBalanceSynth(), // tokenBalanceOut
        ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
        0, //swapFee
      )
      console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
      slippage = (minAmountOut - expectedOut) / expectedOut;
      console.log("slippage", slippage)
      // const gasEstimate = await gnoCharon.estimateGas.swap(
      //   false, // bool _isSynthIn
      //   ethers.utils.parseEther(inputValue), // uint256 _tokenAmountIn
      //   minAmountOut, // uint256 _minAmountOut
      //   spotPrice, // uint256 _spotPrice
      // )
      // console.log("gasEstimate", gasEstimate.toString())
      // $('#gas-estimate').text(gasEstimate)
    }
    else if (fromCurrencyDropdown.value == "MATIC") {
      spotPrice = await polCharon.calcSpotPrice(
        await polCharon.recordBalanceSynth(), // tokenBalanceIn
        await polCharon.recordBalance(), // uint256 _tokenBalanceOut
        0
      );
      const expectedOut = spotPrice * inputValue
      const exitFee = inputValue * ethers.utils.formatEther(await polCharon.fee())
      console.log("exitFee", exitFee)
      const adjustedIn = inputValue - exitFee
      console.log("adjustedIn", ethers.utils.parseEther(adjustedIn.toString()))
      const minAmountOut = await polCharon.calcOutGivenIn(
        await polCharon.recordBalance(), // uint256 _tokenBalanceIn
        await polCharon.recordBalanceSynth(), // tokenBalanceOut
        ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
        0, //swapFee
      )
      console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
      slippage = (minAmountOut - expectedOut) / expectedOut;
      console.log("slippage", slippage)
      // const gasEstimate = await polCharon.estimateGas.swap(
      //   false, // bool _isSynthIn
      //   ethers.utils.parseEther(inputValue), // uint256 _tokenAmountIn
      //   minAmountOut, // uint256 _minAmountOut
      //   spotPrice, // uint256 _spotPrice
      // )
      // console.log("gasEstimate", gasEstimate.toString())
      // $('#gas-estimate').text(gasEstimate)
    } else if (toCurrencyDropdown.value == "ETH") {
      spotPrice = await ethCharon.calcSpotPrice(
        await ethCharon.recordBalance(), // tokenBalanceIn
        await ethCharon.recordBalanceSynth(), // uint256 _tokenBalanceOut
        0
      );
      const expectedOut = spotPrice * inputValue
      const exitFee = inputValue * ethers.utils.formatEther(await ethCharon.fee())
      console.log("exitFee", exitFee)
      const adjustedIn = inputValue - exitFee
      console.log("adjustedIn", ethers.utils.parseEther(adjustedIn.toString()))
      const minAmountOut = await ethCharon.calcSingleOutGivenIn(
        await ethCharon.recordBalance(), // uint256 _tokenBalanceIn
        await ethCharon.recordBalanceSynth(), // tokenBalanceOut
        ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
        0, //swapFee
        false //isPool
      )
      console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
      slippage = (minAmountOut - expectedOut) / expectedOut;
      console.log("slippage", slippage)
      // const gasEstimate = await ethCharon.estimateGas.swap(
      //   true, // bool _isSynthIn
      //   ethers.utils.parseEther(inputValue), // uint256 _tokenAmountIn
      //   minAmountOut, // uint256 _minAmountOut
      //   spotPrice, // uint256 _spotPrice
      // )
      // console.log("gasEstimate", gasEstimate.toString())
      // $('#gas-estimate').text(gasEstimate)
    } else if (toCurrencyDropdown.value == "xDAI") {
      spotPrice = await gnoCharon.calcSpotPrice(
        await gnoCharon.recordBalance(), // tokenBalanceIn
        await gnoCharon.recordBalanceSynth(), // uint256 _tokenBalanceOut

        0
      );
      const expectedOut = spotPrice * inputValue
      const exitFee = inputValue * ethers.utils.formatEther(await gnoCharon.fee())
      console.log("exitFee", exitFee)
      const adjustedIn = inputValue - exitFee
      console.log("adjustedIn", ethers.utils.parseEther(adjustedIn.toString()))
      const minAmountOut = await gnoCharon.calcSingleOutGivenIn(
        await gnoCharon.recordBalance(), // uint256 _tokenBalanceIn
        await gnoCharon.recordBalanceSynth(), // tokenBalanceOut
        ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
        0, //swapFee
        false //isPool
      )
      console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
      slippage = (minAmountOut - expectedOut) / expectedOut;
      console.log("slippage", slippage)
      // const gasEstimate = await gnoCharon.estimateGas.swap(
      //   true, // bool _isSynthIn
      //   ethers.utils.parseEther(inputValue), // uint256 _tokenAmountIn
      //   minAmountOut, // uint256 _minAmountOut
      //   spotPrice, // uint256 _spotPrice
      // )
      // console.log("gasEstimate", gasEstimate.toString())
      // $('#gas-estimate').text(gasEstimate)
    } else if (toCurrencyDropdown.value == "MATIC") {
      spotPrice = await polCharon.calcSpotPrice(
        await polCharon.recordBalance(), // tokenBalanceIn
        await polCharon.recordBalanceSynth(), // uint256 _tokenBalanceOut
        0
      );
      const expectedOut = spotPrice * inputValue
      const exitFee = inputValue * ethers.utils.formatEther(await polCharon.fee())
      console.log("exitFee", exitFee)
      const adjustedIn = inputValue - exitFee
      console.log("adjustedIn", ethers.utils.parseEther(adjustedIn.toString()))
      const minAmountOut = await polCharon.calcSingleOutGivenIn(
        await polCharon.recordBalance(), // uint256 _tokenBalanceIn
        await polCharon.recordBalanceSynth(), // tokenBalanceOut
        ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
        0, //swapFee
        false //isPool
      )
      console.log("minAmountOut", ethers.utils.formatEther(minAmountOut))
      slippage = (minAmountOut - expectedOut) / expectedOut;
      console.log("slippage", slippage)
      // const gasEstimate = await polCharon.estimateGas.swap(
      //   true, // bool _isSynthIn
      //   ethers.utils.parseEther(inputValue), // uint256 _tokenAmountIn
      //   minAmountOut, // uint256 _minAmountOut
      //   spotPrice, // uint256 _spotPrice
      // )
      // console.log("gasEstimate", gasEstimate.toString())
      // $('#gas-estimate').text(gasEstimate)
    }
    const expectedOut = spotPrice * inputValue
    const outputAmount = ethers.utils.formatEther(expectedOut.toString());
    console.log("outputAmount", outputAmount)
    toAmountBox.value = (parseFloat(outputAmount).toFixed(3));
    const slippageValue = (slippage * 100).toFixed(2);
    const slippageElement = $('#slippage');
    slippageElement.text(slippageValue + "%");
    if (slippage < 0) {
      slippageElement.css('color', '#DC143C');
    } else if (slippage > 0) {
      slippageElement.css('color', '#00FF7F');
    }
  }
}

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
    calculateConversion();
  });
}

loadAndDisplay()
