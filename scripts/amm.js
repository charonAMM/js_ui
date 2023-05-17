const $ = require("jquery");
const ethers = require("ethers");
require("dotenv").config();
let ethBal, gnoBal, polBal;
let chdEthBal, chdGnoBal, chdPolBal;
const {
  ethCHD,
  gnoCHD,
  polCHD,
  ethCharon,
  gnoCharon,
  polCharon,
  polygonBaseToken,
  gnosisBaseToken,
  ethBaseToken,
} = require("../src/tokens");
const {
  ethProvider,
  gnosisProvider,
  polygonProvider,
  ethWallet,
  gnoWallet,
  polWallet,
} = require("../src/providers");
const button = document.getElementById("swapButton");
const text = document.getElementById("swapText");
const loader = document.getElementById("swapLoader");
$("#myAddress").text(ethWallet.address);

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
  ethBal = await ethBaseToken.balanceOf(ethWallet.address);
  gnoBal = await gnosisBaseToken.balanceOf(gnoWallet.address);
  polBal = await polygonBaseToken.balanceOf(polWallet.address);
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
    parseFloat(ethers.utils.formatEther(balance)) <
    parseFloat(ethers.utils.formatEther(fromAmount))
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
fromAmountBox.addEventListener("input", () => {
  setTimeout(calculateConversion, 800);
});

async function calculateConversionDetails(
  charon,
  inputValue,
  isSynthIn,
  provider
) {
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
  try {
    const gasPrice = await provider.getGasPrice();
    const transaction = {
      to: "0x1234567890123456789012345678901234567890",
      data: "0x59542ca900000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000ad78ebc5ac6200000",
    };
    const gasLimit = await provider.estimateGas(transaction);
    const gasCost = gasPrice.mul(gasLimit);
    $("#gas-estimate").text(
      parseFloat(ethers.utils.formatUnits(gasCost, "gwei")).toFixed(2)
    );
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
      true,
      ethProvider
    ));
  } else if (toCurrencyDropdown.value == "xDAI") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      gnoCharon,
      inputValue,
      true,
      gnosisProvider
    ));
  } else if (toCurrencyDropdown.value == "MATIC") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      polCharon,
      inputValue,
      true,
      polygonProvider
    ));
  } else if (fromCurrencyDropdown.value == "ETH") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      ethCharon,
      inputValue,
      false,
      ethProvider
    ));
  } else if (fromCurrencyDropdown.value == "xDAI") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      gnoCharon,
      inputValue,
      false,
      gnosisProvider
    ));
  } else if (fromCurrencyDropdown.value == "MATIC") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      polCharon,
      inputValue,
      false,
      polygonProvider
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
