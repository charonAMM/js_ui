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
      const ethBalance = await ethProvider.getBalance(ethWallet.address);
      if (
        ethers.utils.formatEther(ethBalance) <
        ethers.utils.formatEther(fromAmount)
      ) {
        alert("You don't have enough ETH to make this swap");
        loader.style.display = "none";
        text.style.display = "inline";
        button.disabled = false;
        return;
      }
      await ethBaseToken.approve(ethCharon.address, fromAmount);
      ethCharon
        .swap(false, fromAmount, 0, ethers.utils.parseEther("999999"), {
          gasLimit,
        })
        .then((result) => {
          console.log(result);
          window.alert(
            "Transaction on Ethereum sent with hash: " + result.hash
          );
          loader.style.display = "none";
          text.style.display = "inline";
          button.disabled = false;
        });
    } else if (fromCurrency === "xDAI") {
      const xDAIBalance = await gnosisProvider.getBalance(gnoWallet.address);
      if (
        ethers.utils.formatEther(xDAIBalance) <
        ethers.utils.formatEther(fromAmount)
      ) {
        alert("You don't have enough xDAI to make this swap");
        loader.style.display = "none";
        text.style.display = "inline";
        button.disabled = false;
        return;
      }
      await gnosisBaseToken.approve(gnoCharon.address, fromAmount);
      gnoCharon
        .swap(false, fromAmount, 0, ethers.utils.parseEther("999999"), {
          gasLimit,
        })
        .then((result) => {
          console.log(result);
          window.alert(
            "Transaction on Gnosis Chain sent with hash: " + result.hash
          );
          loader.style.display = "none";
          text.style.display = "inline";
          button.disabled = false;
        });
    } else if (fromCurrency === "MATIC") {
      const MATICBalance = await polygonProvider.getBalance(polWallet.address);
      if (
        parseFloat(ethers.utils.formatEther(MATICBalance)) <
        parseFloat(ethers.utils.formatEther(fromAmount))
      ) {
        alert("You don't have enough MATIC to make this swap");
        loader.style.display = "none";
        text.style.display = "inline";
        button.disabled = false;
        return;
      }
      await polygonBaseToken.approve(polCharon.address, fromAmount);
      polCharon
        .swap(false, fromAmount, 0, ethers.utils.parseEther("999999"), {
          gasLimit,
        })
        .then((result) => {
          console.log(result);
          window.alert("Transaction on Polygon sent with hash: " + result.hash);
          loader.style.display = "none";
          text.style.display = "inline";
          button.disabled = false;
        });
    } else if (toCurrency == "ETH") {
      const chdBalance = await ethCHD.balanceOf(ethWallet.address);
      if (
        ethers.utils.formatEther(chdBalance) <
        ethers.utils.formatEther(fromAmount)
      ) {
        alert("You don't have enough CHD to make this swap");
        loader.style.display = "none";
        text.style.display = "inline";
        button.disabled = false;
        return;
      }
      await ethCHD.approve(ethCharon.address, fromAmount, { gasLimit });
      ethCharon
        .swap(true, fromAmount, 0, ethers.utils.parseEther("999999"), {
          gasLimit,
        })
        .then((result) => {
          console.log(result);
          window.alert(
            "Transaction on Ethereum sent with hash: " + result.hash
          );
          loader.style.display = "none";
          text.style.display = "inline";
          button.disabled = false;
        });
    } else if (toCurrency == "xDAI") {
      const chdBalance = await gnoCHD.balanceOf(gnoWallet.address);
      if (
        ethers.utils.formatEther(chdBalance) <
        ethers.utils.formatEther(fromAmount)
      ) {
        alert("You don't have enough CHD to make this swap");
        loader.style.display = "none";
        text.style.display = "inline";
        button.disabled = false;
        return;
      }
      await gnoCHD.approve(gnoCharon.address, fromAmount);
      gnoCharon
        .swap(true, fromAmount, 0, ethers.utils.parseEther("999999"), {
          gasLimit,
        })
        .then((result) => {
          console.log(result);
          window.alert(
            "Transaction on Gnosis Chain sent with hash: " + result.hash
          );
          loader.style.display = "none";
          text.style.display = "inline";
          button.disabled = false;
        });
    } else if (toCurrency == "MATIC") {
      const chdBalance = await polCHD.balanceOf(polWallet.address);
      if (
        ethers.utils.formatEther(chdBalance) <
        ethers.utils.formatEther(fromAmount)
      ) {
        alert("You don't have enough CHD to make this swap");
        loader.style.display = "none";
        text.style.display = "inline";
        button.disabled = false;
        return;
      }
      await polCHD.approve(polCharon.address, fromAmount);
      polCharon
        .swap(true, fromAmount, 0, ethers.utils.parseEther("999999"), {
          gasLimit,
        })
        .then((result) => {
          console.log(result);
          window.alert("Transaction on Polygon sent with hash: " + result.hash);
          loader.style.display = "none";
          text.style.display = "inline";
          button.disabled = false;
        });
    }
  } catch (err) {
    window.alert("Transaction failed, check console for more info");
    console.log(err);
    loader.style.display = "none";
    text.style.display = "inline";
    button.disabled = false;
  }
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

const fromAmountBox = document.getElementById("from-amount");
fromAmountBox.addEventListener("input", () => calculateConversion());

async function calculateConversion() {
  const inputValue = fromAmountBox.value;
  const toAmountBox = document.getElementById("to-amount");
  if (inputValue == 0 || isNaN(inputValue)) {
    toAmountBox.value = "";
    return;
  }
  if (inputValue !== 0 || !isNaN(inputValue)) {
    toAmountBox.value = "...";
    const fromCurrencyDropdown = document.getElementById("from-currency");
    const toCurrencyDropdown = document.getElementById("to-currency");
    let spotPrice;
    let slippage;
    let gasEstimate;
    $("#slippage").text("...");
    $("#slippage").css("color", "white");
    $("#gas-estimate").text("...");
    if (fromCurrencyDropdown.value == "ETH") {
      spotPrice = await ethCharon.calcSpotPrice(
        await ethCharon.recordBalanceSynth(), // tokenBalanceIn
        await ethCharon.recordBalance(), // uint256 _tokenBalanceOut
        0
      );
      const expectedOut = spotPrice * inputValue;
      const exitFee =
        inputValue * ethers.utils.formatEther(await ethCharon.fee());
      const adjustedIn = inputValue - exitFee;
      const minAmountOut = await ethCharon.calcOutGivenIn(
        await ethCharon.recordBalance(), // uint256 _tokenBalanceIn
        await ethCharon.recordBalanceSynth(), // tokenBalanceOut
        ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
        0 //swapFee
      );
      slippage = (minAmountOut - expectedOut) / expectedOut;
      try {
        gasEstimate = await ethCharon.estimateGas.swap(
          false, // bool _isSynthIn
          ethers.utils.parseEther(inputValue), // uint256 _tokenAmountIn
          minAmountOut, // uint256 _minAmountOut
          spotPrice, // uint256 _spotPrice
          { gasLimit: 10000000 }
        );
        $("#gas-estimate").text(gasEstimate);
      } catch (e) {
        $("#gas-estimate").text("n/a");
      }
    } else if (fromCurrencyDropdown.value == "xDAI") {
      spotPrice = await gnoCharon.calcSpotPrice(
        await gnoCharon.recordBalanceSynth(), // tokenBalanceIn
        await gnoCharon.recordBalance(), // uint256 _tokenBalanceOut
        0
      );
      const expectedOut = spotPrice * inputValue;
      const exitFee =
        inputValue * ethers.utils.formatEther(await gnoCharon.fee());
      const adjustedIn = inputValue - exitFee;
      const minAmountOut = await gnoCharon.calcOutGivenIn(
        await gnoCharon.recordBalance(), // uint256 _tokenBalanceIn
        await gnoCharon.recordBalanceSynth(), // tokenBalanceOut
        ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
        0 //swapFee
      );
      slippage = (minAmountOut - expectedOut) / expectedOut;
      try {
        gasEstimate = await gnoCharon.estimateGas.swap(
          false, // bool _isSynthIn
          ethers.utils.parseEther(inputValue), // uint256 _tokenAmountIn
          minAmountOut, // uint256 _minAmountOut
          spotPrice, // uint256 _spotPrice
          { gasLimit: ethers.BigNumber.from("100000000000") }
        );
        $("#gas-estimate").text(gasEstimate);
      } catch (e) {
        $("#gas-estimate").text("n/a");
      }
    } else if (fromCurrencyDropdown.value == "MATIC") {
      spotPrice = await polCharon.calcSpotPrice(
        await polCharon.recordBalanceSynth(), // tokenBalanceIn
        await polCharon.recordBalance(), // uint256 _tokenBalanceOut
        0
      );
      const expectedOut = spotPrice * inputValue;
      const exitFee =
        inputValue * ethers.utils.formatEther(await polCharon.fee());
      const adjustedIn = inputValue - exitFee;
      const minAmountOut = await polCharon.calcOutGivenIn(
        await polCharon.recordBalance(), // uint256 _tokenBalanceIn
        await polCharon.recordBalanceSynth(), // tokenBalanceOut
        ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
        0 //swapFee
      );
      slippage = (minAmountOut - expectedOut) / expectedOut;
      try {
        gasEstimate = await polCharon.estimateGas.swap(
          false, // bool _isSynthIn
          ethers.utils.parseEther(inputValue), // uint256 _tokenAmountIn
          minAmountOut, // uint256 _minAmountOut
          spotPrice // uint256 _spotPrice
        );
        $("#gas-estimate").text(gasEstimate);
      } catch (e) {
        $("#gas-estimate").text("n/a");
      }
    } else if (toCurrencyDropdown.value == "ETH") {
      spotPrice = await ethCharon.calcSpotPrice(
        await ethCharon.recordBalance(), // tokenBalanceIn
        await ethCharon.recordBalanceSynth(), // uint256 _tokenBalanceOut
        0
      );
      const expectedOut = spotPrice * inputValue;
      const exitFee =
        inputValue * ethers.utils.formatEther(await ethCharon.fee());
      const adjustedIn = inputValue - exitFee;
      const minAmountOut = await ethCharon.calcSingleOutGivenIn(
        await ethCharon.recordBalance(), // uint256 _tokenBalanceOut
        await ethCharon.recordBalanceSynth(), // tokenBalanceIn
        ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
        0, //swapFee
        false //isPool
      );
      slippage = (minAmountOut - expectedOut) / expectedOut;
      try {
        gasEstimate = await ethCharon.estimateGas.swap(
          true, // bool _isSynthIn
          ethers.utils.parseEther(inputValue), // uint256 _tokenAmountIn
          minAmountOut, // uint256 _minAmountOut
          spotPrice // uint256 _spotPrice
        );
        $("#gas-estimate").text(gasEstimate);
      } catch (e) {
        $("#gas-estimate").text("n/a");
      }
    } else if (toCurrencyDropdown.value == "xDAI") {
      spotPrice = await gnoCharon.calcSpotPrice(
        await gnoCharon.recordBalance(), // tokenBalanceIn
        await gnoCharon.recordBalanceSynth(), // uint256 _tokenBalanceOut

        0
      );
      const expectedOut = spotPrice * inputValue;
      const exitFee =
        inputValue * ethers.utils.formatEther(await gnoCharon.fee());
      const adjustedIn = inputValue - exitFee;
      const minAmountOut = await gnoCharon.calcSingleOutGivenIn(
        await gnoCharon.recordBalance(), // uint256 _tokenBalanceOut
        await gnoCharon.recordBalanceSynth(), // tokenBalanceIn
        ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
        0, //swapFee
        false //isPool
      );
      slippage = (minAmountOut - expectedOut) / expectedOut;
      try {
        gasEstimate = await gnoCharon.estimateGas.swap(
          true, // bool _isSynthIn
          ethers.utils.parseEther(inputValue), // uint256 _tokenAmountIn
          minAmountOut, // uint256 _minAmountOut
          spotPrice // uint256 _spotPrice
        );
        $("#gas-estimate").text(gasEstimate);
      } catch (e) {
        $("#gas-estimate").text("n/a");
      }
    } else if (toCurrencyDropdown.value == "MATIC") {
      spotPrice = await polCharon.calcSpotPrice(
        await polCharon.recordBalance(), // tokenBalanceIn
        await polCharon.recordBalanceSynth(), // uint256 _tokenBalanceOut
        0
      );
      const expectedOut = spotPrice * inputValue;
      const exitFee =
        inputValue * ethers.utils.formatEther(await polCharon.fee());
      const adjustedIn = inputValue - exitFee;
      const minAmountOut = await polCharon.calcSingleOutGivenIn(
        await polCharon.recordBalance(), // uint256 tokenBalanceOut
        await polCharon.recordBalanceSynth(), // tokenBalanceIn
        ethers.utils.parseEther(adjustedIn.toString()), //adjustedIn
        0, //swapFee
        false //isPool
      );
      slippage = (minAmountOut - expectedOut) / expectedOut;
      try {
        gasEstimate = await polCharon.estimateGas.swap(
          true, // bool _isSynthIn
          ethers.utils.parseEther(inputValue), // uint256 _tokenAmountIn
          minAmountOut, // uint256 _minAmountOut
          spotPrice // uint256 _spotPrice
        );
        $("#gas-estimate").text(gasEstimate);
      } catch (e) {
        $("#gas-estimate").text("n/a");
      }
    }
    const expectedOut = spotPrice * inputValue;
    const outputAmount = ethers.utils.formatEther(expectedOut.toString());
    toAmountBox.value = outputAmount;
    const slippageValue = (slippage * 100).toFixed(2);
    const slippageElement = $("#slippage");
    slippageElement.text(slippageValue + "%");
    if (slippage < 0) {
      slippageElement.css("color", "#DC143C");
    } else if (slippage > 0) {
      slippageElement.css("color", "#00FF7F");
    }
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
