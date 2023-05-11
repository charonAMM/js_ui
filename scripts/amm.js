let $ = require("jquery");
let fs = require("fs");
const electron = require("electron");
const BrowserWindow = electron.BrowserWindow;
const url = require("url");
const path = require("path");
const ethers = require("ethers");
const {
  abi: chdABI,
} = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json");
const {
  abi: charonABI,
} = require("../artifacts/charonAMM/contracts/Charon.sol/Charon.json");
require("dotenv").config();
let ethBal, gnoBal, polBal;
let chdEthBal, chdGnoBal, chdPolBal;
const button = document.getElementById("swapButton");
const text = document.getElementById("swapText");
const loader = document.getElementById("swapLoader");
// //Check if file exists
// Connect a wallet to mainnet

ethProvider = new ethers.providers.JsonRpcProvider(
  process.env.NODE_URL_ETHEREUM
);
gnosisProvider = new ethers.providers.JsonRpcProvider(
  process.env.NODE_URL_GNOSIS
);
polygonProvider = new ethers.providers.JsonRpcProvider(
  process.env.NODE_URL_POLYGON
);

ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
gnoWallet = new ethers.Wallet(process.env.PRIVATE_KEY, gnosisProvider);
polWallet = new ethers.Wallet(process.env.PRIVATE_KEY, polygonProvider);
$("#myAddress").text(ethWallet.address);
ethCHD = new ethers.Contract(process.env.ETHEREUM_CHD, chdABI, ethWallet);
gnoCHD = new ethers.Contract(process.env.GNOSIS_CHD, chdABI, gnoWallet);
polCHD = new ethers.Contract(process.env.POLYGON_CHD, chdABI, polWallet);

ethCharon = new ethers.Contract(
  process.env.ETHEREUM_CHARON,
  charonABI,
  ethWallet
);
gnoCharon = new ethers.Contract(
  process.env.GNOSIS_CHARON,
  charonABI,
  gnoWallet
);
polCharon = new ethers.Contract(
  process.env.POLYGON_CHARON,
  charonABI,
  polWallet
);

EthBaseToken = process.env.ETHEREUM_BASETOKEN;
GnoBaseToken = process.env.GNOSIS_BASETOKEN;
PolBaseToken = process.env.POLYGON_BASETOKEN;
approveABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
];

polygonBaseToken = new ethers.Contract(PolBaseToken, approveABI, polWallet);
gnosisBaseToken = new ethers.Contract(GnoBaseToken, approveABI, gnoWallet);
ethBaseToken = new ethers.Contract(EthBaseToken, approveABI, ethWallet);

async function setPublicBalances() {
  //chdTokens
  chdEthBal = await ethCHD.balanceOf(ethWallet.address);
  chdGnoBal = await gnoCHD.balanceOf(gnoWallet.address);
  chdPolBal = await polCHD.balanceOf(polWallet.address);
  $("#chdETHBal").text(
    Math.round(ethers.utils.formatEther(chdEthBal) * 100) / 100
  );
  $("#chdGNOBal").text(
    Math.round(ethers.utils.formatEther(chdGnoBal) * 100) / 100
  );
  $("#chdPOLBal").text(
    Math.round(ethers.utils.formatEther(chdPolBal) * 100) / 100
  );

  //baseTokens
  ethBal = await ethProvider.getBalance(ethWallet.address);
  gnoBal = await gnosisProvider.getBalance(gnoWallet.address);
  polBal = await polygonProvider.getBalance(polWallet.address);
  $("#ethBal").text(Math.round(ethers.utils.formatEther(ethBal) * 100) / 100);
  $("#xDAIBal").text(Math.round(ethers.utils.formatEther(gnoBal) * 100) / 100);
  $("#maticBal").text(Math.round(ethers.utils.formatEther(polBal) * 100) / 100);

  //lpTokens
  ethCharon
    .balanceOf(ethWallet.address)
    .then((result) =>
      $("#lpETHBal").text(
        Math.round(ethers.utils.formatEther(result) * 100) / 100
      )
    );
  gnoCharon
    .balanceOf(gnoWallet.address)
    .then((result) =>
      $("#lpGNOBal").text(
        Math.round(ethers.utils.formatEther(result) * 100) / 100
      )
    );
  polCharon
    .balanceOf(polWallet.address)
    .then((result) =>
      $("#lpPOLBal").text(
        Math.round(ethers.utils.formatEther(result) * 100) / 100
      )
    );
}
function loadAndDisplay() {
  setPublicBalances();
  prepareSwitchButtonClick();
}

async function swap() {
  const fromAmountInput = document.getElementById("from-amount");
  const fromCurrencyDropdown = document.getElementById("from-currency");
  const toCurrencyDropdown = document.getElementById("to-currency");
  const fromAmount = ethers.utils.parseEther(fromAmountInput.value);
  const fromCurrency = fromCurrencyDropdown.value;
  const toCurrency = toCurrencyDropdown.value;
  const gasLimit = 300000;

  try {
    if (fromCurrency === "ETH") {
      await swapToken(
        fromAmount,
        ethBaseToken,
        ethCharon,
        ethBal,
        "ETH",
        "Ethereum",
        gasLimit
      );
    } else if (fromCurrency === "xDAI") {
      await swapToken(
        fromAmount,
        gnosisBaseToken,
        gnoCharon,
        gnoBal,
        "xDAI",
        "Gnosis Chain",
        gasLimit
      );
    } else if (fromCurrency === "MATIC") {
      await swapToken(
        fromAmount,
        polygonBaseToken,
        polCharon,
        polBal,
        "MATIC",
        "Polygon",
        gasLimit
      );
    } else if (toCurrency === "ETH") {
      await swapToken(
        fromAmount,
        ethCHD,
        ethCharon,
        chdEthBal,
        "CHD",
        "Ethereum",
        gasLimit
      );
    } else if (toCurrency === "xDAI") {
      await swapToken(
        fromAmount,
        gnoCHD,
        gnoCharon,
        chdGnoBal,
        "CHD",
        "Gnosis Chain",
        gasLimit
      );
    } else if (toCurrency === "MATIC") {
      await swapToken(
        fromAmount,
        polCHD,
        polCharon,
        chdPolBal,
        "CHD",
        "Polygon",
        gasLimit
      );
    }
  } catch (err) {
    window.alert("Transaction failed, check console for more info");
    console.log(err);
    enableSwapButton();
  }
}

async function swapToken(
  fromAmount,
  baseToken,
  charon,
  balance,
  tokenSymbol,
  networkName,
  gasLimit
) {
  if (
    parseInt(ethers.utils.formatEther(balance)) <
    parseInt(ethers.utils.formatEther(fromAmount))
  ) {
    alert(
      `You don't have enough ${tokenSymbol} to make this swap on ${networkName}`
    );
    enableSwapButton();
    return;
  }
  await baseToken.approve(charon.address, fromAmount, { gasLimit });
  charon
    .swap(
      tokenSymbol === "CHD",
      fromAmount,
      0,
      ethers.utils.parseEther("999999"),
      {
        gasLimit,
      }
    )
    .then((result) => {
      console.log(result);
      window.alert(
        `Transaction on ${networkName} sent with hash: ${result.hash}`
      );
      enableSwapButton();
    });
}

const maxButton = document.getElementById("max-button");
maxButton.addEventListener("click", async () => {
  const fromAmountBox = document.getElementById("from-amount");
  const fromCurrencyDropdown = document.getElementById("from-currency");
  const fromCurrency = fromCurrencyDropdown.value;
  const toCurrencyDropdown = document.getElementById("to-currency");
  const toCurrency = toCurrencyDropdown.value;
  if (fromCurrency == "ETH") {
    fromAmountBox.value = ethers.utils.formatEther(ethBal);
  } else if (fromCurrency == "xDAI") {
    fromAmountBox.value = ethers.utils.formatEther(gnoBal);
  } else if (fromCurrency == "MATIC") {
    fromAmountBox.value = ethers.utils.formatEther(polBal);
  } else if (fromCurrency == "chd") {
    if (toCurrency == "ETH") {
      fromAmountBox.value = ethers.utils.formatEther(chdEthBal);
    } else if (toCurrency == "xDAI") {
      fromAmountBox.value = ethers.utils.formatEther(chdGnoBal);
    } else if (toCurrency == "MATIC") {
      fromAmountBox.value = ethers.utils.formatEther(chdPolBal);
    }
  }
  calculateConversion();
});

$("#swapButton").on("click", () => {
  if (fromAmountBox.value == 0 || isNaN(fromAmountBox.value)) {
    window.alert("Please enter a valid amount");
    return;
  }
  showLoadingAnimation();
  swap();
});

function showLoadingAnimation() {
  button.disabled = true;
  text.style.display = "none";
  loader.style.display = "block";
}

function enableSwapButton() {
  loader.style.display = "none";
  text.style.display = "inline";
  button.disabled = false;
}

const fromAmountBox = document.getElementById("from-amount");
fromAmountBox.addEventListener("input", () => calculateConversion());

async function calculateConversionDetails(charon, inputValue, isSynthIn) {
  const spotPrice = isSynthIn
    ? await charon.calcSpotPrice(
        await charon.recordBalance(),
        await charon.recordBalanceSynth(),
        0
      )
    : await charon.calcSpotPrice(
        await charon.recordBalanceSynth(),
        await charon.recordBalance(),
        0
      );
  const expectedOut = spotPrice * inputValue;
  const exitFee = inputValue * ethers.utils.formatEther(await charon.fee());
  const adjustedIn = inputValue - exitFee;
  const minAmountOut = isSynthIn
    ? await charon.calcSingleOutGivenIn(
        await charon.recordBalance(),
        await charon.recordBalanceSynth(),
        ethers.utils.parseEther(adjustedIn.toString()),
        0,
        false
      )
    : await charon.calcOutGivenIn(
        await charon.recordBalance(),
        await charon.recordBalanceSynth(),
        ethers.utils.parseEther(adjustedIn.toString()),
        0
      );
  const slippage = (minAmountOut - expectedOut) / expectedOut;
  let gasEstimate;
  try {
    gasEstimate = await charon.estimateGas.swap(
      isSynthIn,
      ethers.utils.parseEther(inputValue),
      0,
      ethers.utils.parseEther("999999"),
      { gasLimit: 100000 }
    );
    $("#gas-estimate").text(gasEstimate);
  } catch (e) {
    $("#gas-estimate").text("n/a");
  }
  return { spotPrice, slippage };
}

async function calculateConversion() {
  const inputValue = fromAmountBox.value;
  const toAmountBox = document.getElementById("to-amount");
  if (inputValue == 0 || isNaN(inputValue)) {
    toAmountBox.value = "";
    return;
  }

  toAmountBox.value = "...";
  const fromCurrencyDropdown = document.getElementById("from-currency");
  const toCurrencyDropdown = document.getElementById("to-currency");
  let spotPrice;
  let slippage;

  $("#slippage").text("...");
  $("#slippage").css("color", "white");
  $("#gas-estimate").text("...");

  if (toCurrencyDropdown.value == "ETH") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      ethCharon,
      inputValue,
      true
    ));
  } else if (toCurrencyDropdown.value == "xDAI") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      gnoCharon,
      inputValue,
      true
    ));
  } else if (toCurrencyDropdown.value == "MATIC") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      polCharon,
      inputValue,
      true
    ));
  } else if (fromCurrencyDropdown.value == "ETH") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      ethCharon,
      inputValue,
      false
    ));
  } else if (fromCurrencyDropdown.value == "xDAI") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      gnoCharon,
      inputValue,
      false
    ));
  } else if (fromCurrencyDropdown.value == "MATIC") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      polCharon,
      inputValue,
      false
    ));
  }
  const expectedOut =
    parseFloat(ethers.utils.formatEther(spotPrice.toString())) *
    parseFloat(inputValue);
  toAmountBox.value = expectedOut;

  const slippageValue = (slippage * 100).toFixed(2);
  const slippageElement = $("#slippage");
  slippageElement.text(slippageValue + "%");
  if (slippage <= -0.05) {
    slippageElement.css("color", "#DC143C");
  } else if (slippage <= -0.01) {
    slippageElement.css("color", "#FF8C00");
  } else {
    slippageElement.css("color", "#00FF7F");
  }
}

function prepareSwitchButtonClick() {
  const fromAmountInput = document.getElementById("from-amount");
  const toAmountInput = document.getElementById("to-amount");
  const arrowImg = document.querySelector(".card-arrow img");
  const fromCurrencyDropdown = document.getElementById("from-currency");
  const toCurrencyDropdown = document.getElementById("to-currency");
  let temp, selectedIndex, toCurrencyOptions;
  arrowImg.addEventListener("click", () => {
    if (toAmountInput.value === "...") return;
    if (fromCurrencyDropdown.value == "chd") {
      temp = fromAmountInput.value;
      fromAmountInput.value = toAmountInput.value;
      toAmountInput.value = temp;
      selectedIndex = toCurrencyDropdown.selectedIndex;
      toCurrencyOptions = fromCurrencyDropdown.innerHTML;
      fromCurrencyDropdown.innerHTML = toCurrencyDropdown.innerHTML;
      toCurrencyDropdown.innerHTML = toCurrencyOptions;
      fromCurrencyDropdown.selectedIndex = selectedIndex;
    } else {
      temp = fromAmountInput.value;
      fromAmountInput.value = toAmountInput.value;
      toAmountInput.value = temp;
      selectedIndex = fromCurrencyDropdown.selectedIndex;
      toCurrencyOptions = fromCurrencyDropdown.innerHTML;
      fromCurrencyDropdown.innerHTML = toCurrencyDropdown.innerHTML;
      toCurrencyDropdown.innerHTML = toCurrencyOptions;
      toCurrencyDropdown.selectedIndex = selectedIndex;
    }
    calculateConversion();
  });
}

loadAndDisplay();
