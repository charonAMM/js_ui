const $ = require("jquery");
const ethers = require("ethers");
require("dotenv").config();
let sepoliaBal, chiadoBal, mumbaiBal, gnosisBal, polygonBal, optimismBal;
let sepoliaCHDBal,
  chiadoCHDBal,
  mumbaiCHDBal,
  gnosisCHDBal,
  polygonCHDBal,
  optimismCHDBal;
const {
  sepoliaCHD,
  sepoliaCharon,
  sepoliaBaseToken,
  chiadoCHD,
  chiadoCharon,
  chiadoBaseToken,
  mumbaiCHD,
  mumbaiCharon,
  mumbaiBaseToken,
  gnosisCHD,
  gnosisCharon,
  gnosisBaseToken,
  polygonCHD,
  polygonCharon,
  polygonBaseToken,
  optimismCHD,
  optimismCharon,
  optimismBaseToken,
} = require("../src/tokens");
const {
  sepoliaWallet,
  mumbaiWallet,
  chiadoWallet,
  gnosisWallet,
  polygonWallet,
  optimismWallet,
  sepoliaProvider,
  mumbaiProvider,
  chiadoProvider,
  gnosisProvider,
  polygonProvider,
  optimismProvider,
} = require("../src/providers");
const isTestnet = process.env.IS_TESTNET === "true";
const button = document.getElementById("swapButton");
const text = document.getElementById("swapText");
const loader = document.getElementById("swapLoader");
const toAmountCurrency = document.getElementById("to-currency");
const arrowImg = document.querySelector(".card-arrow img");
const maxButton = document.getElementById("max-button");
const fromAmountBox = document.getElementById("from-amount");
let handleSwitch, handleMax;
arrowImg.removeEventListener("click", handleSwitch);
maxButton.removeEventListener("click", handleMax);
fromAmountBox.removeEventListener("input", calculateConversion);

const walletsConfig = [
  {
    network: "testnet",
    wallets: ["sepolia", "mumbai", "chiado"],
    base: ["eth", "wmatic", "wxdai"],
    labels: ["first", "second", "third"],
  },
  {
    network: "mainnet",
    wallets: ["gnosis", "polygon", "optimism"],
    base: ["wxdai", "wmatic", "weth"],
    labels: ["first", "second", "third"],
  },
];

const selectElement = document.getElementById("from-currency");

const values = isTestnet
  ? ["eth", "wmatic", "wxdai"]
  : ["wxdai", "wmatic", "weth"];

for (let i = 0; i < selectElement.options.length; i++) {
  selectElement.options[i].value = values[i];
  selectElement.options[i].text = values[i];
}

const formatBalance = (balance) =>
  Math.round(ethers.utils.formatEther(balance) * 100) / 100;

async function setPublicBalances() {
  const config = walletsConfig.find(
    (cfg) => cfg.network === (isTestnet ? "testnet" : "mainnet")
  );

  $("#myAddress").text(eval(`${config.wallets[0]}Wallet.address`));

  for (let i = 0; i < config.wallets.length; i++) {
    const wallet = config.wallets[i];
    const label = config.labels[i];
    const base = config.base[i];
    try {
      const chdBal = await eval(
        `${wallet}CHD.balanceOf(${wallet}Wallet.address)`
      );
      const baseTokenBal = await eval(
        `${wallet}BaseToken.balanceOf(${wallet}Wallet.address)`
      );

      $(`#${label}Row`).text(wallet);
      $(`#${label}Base`).text(base);
      $(`#${label}CHDBal`).text(formatBalance(chdBal));
      // save the balances for later
      eval(`${wallet}CHDBal = ${ethers.utils.formatEther(chdBal)}`);
      $(`#${label}Bal`).text(formatBalance(baseTokenBal));
      // save the balances for later
      eval(`${wallet}Bal = ${ethers.utils.formatEther(baseTokenBal)}`);

      const lpBal = await eval(
        `${wallet}Charon.balanceOf(${wallet}Wallet.address)`
      );
      $(`#${label}LPBal`).text(formatBalance(lpBal));
    } catch (e) {
      window.alert(
        "could not get balance for " +
          wallet +
          ", please check your .env file configuration"
      );
      $(`#${label}Row`).text(wallet);
      $(`#${label}Base`).text("n/a");
      $(`#${label}CHDBal`).text("n/a");
      $(`#${label}Bal`).text("n/a");
      $(`#${label}LPBal`).text("n/a");
    }
  }
}

function loadAndDisplay() {
  setPublicBalances().then(() => {
    maxButton.addEventListener("click", handleMax);
  });

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
    if (fromCurrency === "eth") {
      await swapToken(
        fromAmount,
        sepoliaBaseToken,
        sepoliaCharon,
        sepoliaBal,
        "ETH",
        "Sepolia",
        gasLimit,
        sepoliaProvider,
        sepoliaWallet
      );
    } else if (fromCurrency === "wxdai") {
      await swapToken(
        fromAmount,
        isTestnet ? chiadoBaseToken : gnosisBaseToken,
        isTestnet ? chiadoCharon : gnosisCharon,
        isTestnet ? chiadoBal : gnosisBal,
        "WxDAI",
        isTestnet ? "Chiado" : "Gnosis Chain",
        gasLimit,
        isTestnet ? chiadoProvider : gnosisProvider,
        isTestnet ? chiadoWallet : gnosisWallet
      );
    } else if (fromCurrency === "wmatic") {
      await swapToken(
        fromAmount,
        isTestnet ? mumbaiBaseToken : polygonBaseToken,
        isTestnet ? mumbaiCharon : polygonCharon,
        isTestnet ? mumbaiBal : polygonBal,
        "WMATIC",
        isTestnet ? "Mumbai" : "Polygon",
        gasLimit,
        isTestnet ? mumbaiProvider : polygonProvider,
        isTestnet ? mumbaiWallet : polygonWallet
      );
    } else if (fromCurrency === "weth") {
      await swapToken(
        fromAmount,
        optimismBaseToken,
        optimismCharon,
        optimismBal,
        "WETH",
        "Optimism",
        gasLimit,
        optimismProvider,
        optimismWallet
      );
    } else if (toCurrency === "eth") {
      await swapToken(
        fromAmount,
        sepoliaCHD,
        sepoliaCharon,
        sepoliaCHDBal,
        "CHD",
        "Ethereum",
        gasLimit,
        sepoliaProvider,
        sepoliaWallet
      );
    } else if (toCurrency === "wxdai") {
      await swapToken(
        fromAmount,
        isTestnet ? chiadoCHD : gnosisCHD,
        isTestnet ? chiadoCharon : gnosisCharon,
        isTestnet ? chiadoCHDBal : gnosisCHDBal,
        "CHD",
        isTestnet ? "Chiado" : "Gnosis Chain",
        gasLimit,
        isTestnet ? chiadoProvider : gnosisProvider,
        isTestnet ? chiadoWallet : gnosisWallet
      );
    } else if (toCurrency === "wmatic") {
      await swapToken(
        fromAmount,
        isTestnet ? mumbaiCHD : polygonCHD,
        isTestnet ? mumbaiCharon : polygonCharon,
        isTestnet ? mumbaiCHDBal : polygonCHDBal,
        "CHD",
        isTestnet ? "Mumbai" : "Polygon",
        gasLimit,
        isTestnet ? mumbaiProvider : polygonProvider,
        isTestnet ? mumbaiWallet : polygonWallet
      );
    } else if (toCurrency === "weth") {
      await swapToken(
        fromAmount,
        optimismCHD,
        optimismCharon,
        optimismCHDBal,
        "CHD",
        "Optimism",
        gasLimit,
        optimismProvider,
        optimismWallet
      );
    }
  } catch (err) {
    window.alert("Transaction failed, check console for details");
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
  gasLimit,
  provider,
  wallet
) {
  if (balance < parseFloat(ethers.utils.formatEther(fromAmount))) {
    alert(
      `You don't have enough ${tokenSymbol} to make this swap on ${networkName}`
    );
    enableSwapButton();
    return;
  }
  try {
    let currentGasPrice = await provider.getGasPrice();
    await baseToken.approve(charon.address, fromAmount, {
      gasLimit: gasLimit,
      gasPrice: currentGasPrice,
    });
    let nonce = await provider.getTransactionCount(wallet.address);
    const tx = await charon.swap(
      tokenSymbol === "CHD",
      fromAmount,
      0,
      ethers.utils.parseEther("999999"),
      {
        gasLimit,
        gasPrice: currentGasPrice.mul(110).div(100),
        nonce: nonce + 1,
      }
    );
    const receipt = await tx.wait(); // Wait for the transaction to be mined
    console.log(receipt);
    if (receipt.status === 1) {
      console.log("Transaction was successful");
      window.alert(
        `Transaction was successful! \nNetwork: ${networkName} \nTransaction Hash: ${tx.hash}`
      );
    } else {
      console.log("Transaction failed");
      window.alert(`Transaction failed! \nPlease check your transaction.`);
    }
    enableSwapButton();
  } catch (err) {
    window.alert("Transaction failed, check console for details.");
    console.log(err);
    enableSwapButton();
  }
}

handleMax = () => {
  const fromAmountBox = document.getElementById("from-amount");
  const fromCurrencyDropdown = document.getElementById("from-currency");
  const fromCurrency = fromCurrencyDropdown.value;
  const toCurrencyDropdown = document.getElementById("to-currency");
  const toCurrency = toCurrencyDropdown.value;
  if (fromCurrency == "eth") {
    fromAmountBox.value = sepoliaBal;
  } else if (fromCurrency == "wxdai") {
    fromAmountBox.value = isTestnet ? chiadoBal : gnosisBal;
  } else if (fromCurrency == "wmatic") {
    fromAmountBox.value = isTestnet ? mumbaiBal : polygonBal;
  } else if (fromCurrency == "weth") {
    fromAmountBox.value = optimismBal;
  } else if (fromCurrency == "chd") {
    if (toCurrency == "eth") {
      fromAmountBox.value = sepoliaCHDBal;
    } else if (toCurrency == "wxdai") {
      fromAmountBox.value = isTestnet ? chiadoCHDBal : gnosisCHDBal;
    } else if (toCurrency == "wmatic") {
      fromAmountBox.value = isTestnet ? mumbaiCHDBal : polygonCHDBal;
    } else if (toCurrency == "weth") {
      fromAmountBox.value = optimismCHDBal;
    }
  }
  calculateConversion();
};

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
  button.style.pointerEvents = "none";
  text.style.display = "none";
  loader.style.display = "block";
}

function enableSwapButton() {
  loader.style.display = "none";
  text.style.display = "inline";
  button.style.pointerEvents = "";
  button.disabled = false;
}

fromAmountBox.addEventListener("input", calculateConversion);

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
        ethers.utils.parseEther(adjustedIn.toFixed(18).toString()),
        0,
        false
      )
    : await charon.calcOutGivenIn(
        await charon.recordBalance(),
        await charon.recordBalanceSynth(),
        ethers.utils.parseEther(adjustedIn.toFixed(18).toString()),
        0
      );
  const slippage = (minAmountOut - expectedOut) / expectedOut;
  try {
    const feeData = await provider.getFeeData();
    let gasPrice = feeData.gasPrice;
    if (selectElement.value === "eth" || toAmountCurrency.value === "eth") {
      gasPrice = ethers.utils.formatUnits(feeData.maxFeePerGas, "wei"); //EIP 1559
    }
    const gasEstimate = 153184;
    let gasCostWei = gasEstimate * gasPrice;
    if (selectElement.value === "weth" || toAmountCurrency.value === "weth") {
      gasCostWei =
        (parseInt(feeData.lastBaseFeePerGas) +
          parseInt(feeData.maxPriorityFeePerGas)) *
        gasEstimate;
    }
    const etherToUsdRate = await fetchCryptoPrice(
      selectElement.value === "chd"
        ? toAmountCurrency.value
        : selectElement.value
    );
    const totalCost = ethers.utils.formatEther(gasCostWei.toString());
    const totalCostUsd = totalCost * etherToUsdRate;

    $("#gas-estimate").text(parseFloat(totalCostUsd).toFixed(6) + " USD");
  } catch (e) {
    console.log(e);
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

  if (toCurrencyDropdown.value == "eth") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      sepoliaCharon,
      inputValue,
      true,
      sepoliaProvider
    ));
  } else if (toCurrencyDropdown.value == "wxdai") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      isTestnet ? chiadoCharon : gnosisCharon,
      inputValue,
      true,
      isTestnet ? chiadoProvider : gnosisProvider
    ));
  } else if (toCurrencyDropdown.value == "wmatic") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      isTestnet ? mumbaiCharon : polygonCharon,
      inputValue,
      true,
      isTestnet ? mumbaiProvider : polygonProvider
    ));
  } else if (toCurrencyDropdown.value == "weth") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      optimismCharon,
      inputValue,
      true,
      optimismProvider
    ));
  } else if (fromCurrencyDropdown.value == "eth") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      sepoliaCharon,
      inputValue,
      false,
      sepoliaProvider
    ));
  } else if (fromCurrencyDropdown.value == "wxdai") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      isTestnet ? chiadoCharon : gnosisCharon,
      inputValue,
      false,
      isTestnet ? chiadoProvider : gnosisProvider
    ));
  } else if (fromCurrencyDropdown.value == "wmatic") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      isTestnet ? mumbaiCharon : polygonCharon,
      inputValue,
      false,
      isTestnet ? mumbaiProvider : polygonProvider
    ));
  } else if (fromCurrencyDropdown.value == "weth") {
    ({ spotPrice, slippage } = await calculateConversionDetails(
      optimismCharon,
      inputValue,
      false,
      optimismProvider
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
  const fromCurrencyDropdown = document.getElementById("from-currency");
  const toCurrencyDropdown = document.getElementById("to-currency");
  const fromCurrencyStyle = fromCurrencyDropdown.style;
  const toCurrencyStyle = toCurrencyDropdown.style;
  let temp, selectedIndex, toCurrencyOptions;
  handleSwitch = () => {
    if (toAmountInput.value === "...") return;
    if (fromCurrencyDropdown.value == "chd") {
      temp = fromAmountInput.value;
      fromAmountInput.value = toAmountInput.value;
      toAmountInput.value = temp;
      selectedIndex = toCurrencyDropdown.selectedIndex;
      toCurrencyOptions = fromCurrencyDropdown.innerHTML;
      fromCurrencyDropdown.innerHTML = toCurrencyDropdown.innerHTML;
      toCurrencyDropdown.innerHTML = toCurrencyOptions;
      toCurrencyStyle.appearance = "none";
      fromCurrencyStyle.appearance = "auto";
      toCurrencyStyle.marginRight = "15px";
      fromCurrencyStyle.marginRight = "5px";
      fromCurrencyDropdown.selectedIndex = selectedIndex;
      toCurrencyDropdown.disabled = true;
      fromCurrencyDropdown.disabled = false;
    } else {
      temp = fromAmountInput.value;
      fromAmountInput.value = toAmountInput.value;
      toAmountInput.value = temp;
      selectedIndex = fromCurrencyDropdown.selectedIndex;
      toCurrencyOptions = fromCurrencyDropdown.innerHTML;
      fromCurrencyStyle.border = "none";
      fromCurrencyDropdown.innerHTML = toCurrencyDropdown.innerHTML;
      toCurrencyDropdown.innerHTML = toCurrencyOptions;
      toCurrencyDropdown.selectedIndex = selectedIndex;
      toCurrencyStyle.appearance = "auto";
      fromCurrencyStyle.appearance = "none";
      fromCurrencyStyle.marginRight = "15px";
      toCurrencyStyle.marginRight = "5px";
      toCurrencyDropdown.disabled = false;
      fromCurrencyDropdown.disabled = true;
    }
    calculateConversion();
  };
  arrowImg.addEventListener("click", handleSwitch);
}

async function fetchCryptoPrice(fromCurrency) {
  switch (fromCurrency) {
    case "eth":
    case "weth":
      return await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      )
        .then((response) => response.json())
        .then((data) => data.ethereum.usd);
    case "wxdai":
      return await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=xdai&vs_currencies=usd"
      )
        .then((response) => response.json())
        .then((data) => data.xdai.usd);
    case "wmatic":
      return await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd"
      )
        .then((response) => response.json())
        .then((data) => data["matic-network"].usd);
  }
}

async function fetchOptimismBaseFee() {
  return new Promise((resolve, reject) => {
    const url = process.env.NODE_URL_OPTIMISM;
    const data = {
      jsonrpc: "2.0",
      method: "eth_gasPrice",
      params: [],
      id: 1,
    };
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        const gasPriceInWei = parseInt(data.result);
        resolve(gasPriceInWei);
      })
      .catch((error) => {
        console.error("Error:", error);
        reject(error);
      });
  });
}
async function fetchOptimismMaxPriorityFeePerGas() {
  return new Promise((resolve, reject) => {
    const url = process.env.NODE_URL_OPTIMISM;
    const data = {
      jsonrpc: "2.0",
      method: "eth_maxPriorityFeePerGas",
      params: [],
      id: 1,
    };
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        const gasPriceInWei = parseInt(data.result);
        resolve(gasPriceInWei);
      })
      .catch((error) => {
        console.error("Error:", error);
        reject(error);
      });
  });
}

loadAndDisplay();
