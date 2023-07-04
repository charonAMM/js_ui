const $ = require("jquery");
const ethers = require("ethers");
const { buildPoseidon } = require("circomlibjs");
const fs = require("fs");
require("dotenv").config();
const { Keypair } = require("../src/keypair");
const { prepareTransaction } = require("../src/index");
const Utxo = require("../src/utxo");
const { BigNumber } = ethers;
let m, myKeypair, builtPoseidon;
const {
  abi: regABI,
} = require("../artifacts/contracts/Registry.sol/Registry.json");
const gasLimit = 3000000;
const {
  sepoliaCHD,
  sepoliaCharon,
  chiadoCHD,
  chiadoCharon,
  mumbaiCHD,
  mumbaiCharon,
  gnosisCHD,
  gnosisCharon,
  polygonCHD,
  polygonCharon,
  optimismCHD,
  optimismCharon,
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
const button = document.getElementById("signAndSend");
const text = document.getElementById("sendText");
const loader = document.getElementById("sendLoader");
const contents = fs.readFileSync("utxos.txt", "utf-8");
const isTestnet = process.env.IS_TESTNET === "true";
const utxos = JSON.parse(contents);
const sVal = utxos.sVal;
const mVal = utxos.mVal;
const cVal = utxos.cVal;
const gVal = utxos.gval;
const pVal = utxos.pval;
const oVal = utxos.oVal;

const psVal = utxos.psVal;
const pmVal = utxos.pmVal;
const pcVal = utxos.pcVal;
const pgVal = utxos.pgVal;
const ppVal = utxos.ppVal;
const poVal = utxos.poVal;

if (isTestnet) {
  document.getElementById("btnradio1").value = "sepolia";
  document.getElementById("labelradio1").textContent = "sepolia";
  document.getElementById("btnradio2").value = "mumbai";
  document.getElementById("labelradio2").textContent = "mumbai";
  document.getElementById("btnradio3").value = "chiado";
  document.getElementById("labelradio3").textContent = "chiado";
} else {
  document.getElementById("btnradio1").value = "gnosis";
  document.getElementById("labelradio1").textContent = "gnosis";
  document.getElementById("btnradio2").value = "polygon";
  document.getElementById("labelradio2").textContent = "polygon";
  document.getElementById("btnradio3").value = "optimism";
  document.getElementById("labelradio3").textContent = "optimism";
}

function poseidon2(a, b) {
  return poseidon([a, b]);
}

$("#signAndSend").on("click", () => {
  showLoadingAnimation();
  send();
});

$("input[type=radio][name=option]").on("change", function () {
  if (this.value == "private") {
    $("#withdrawalDiv").show();
  } else {
    $("#withdrawalDiv").hide();
    $("#toAddy").prop("disabled", false);
    $("#toAddy").css({ "background-color": "" });
    $("#withdrawalCheckbox").prop("checked", false);
  }
});

$("#withdrawalCheckbox").on("change", function () {
  if ($(this).is(":checked")) {
    $("#toAddy").prop("disabled", true);
    $("#toAddy").css({
      "background-color": "#abababfc",
    });
  } else {
    $("#toAddy").prop("disabled", false);
    $("#toAddy").css({ "background-color": "" });
  }
});

function poseidon(inputs) {
  let val = builtPoseidon(inputs);
  return builtPoseidon.F.toString(val);
}

readUTXOs();
buildPoseidon().then(function (res) {
  builtPoseidon = res;
});
function readUTXOs() {
  m = JSON.parse(fs.readFileSync("utxos.txt"));
}

function getChainID(chain) {
  switch (chain) {
    case "sepolia":
      return 11155111;
    case "mumbai":
      return 80001;
    case "chiado":
      return 10200;
    case "gnosis":
      return 100;
    case "polygon":
      return 137;
    case "optimism":
      return 10;
    default:
      return null;
  }
}

let newUTXOs = [];
let utxoAmount = BigNumber.from("0");
let changeUtxos = [];
async function prepare2(_chain) {
  let _to = $("#toAddy").val();
  let _amount = ethers.utils.parseEther($("#toAmount").val());
  let _withdrawal2 = $("#withdrawalCheckbox").prop("checked");
  if (_withdrawal2) {
    if (utxoAmount != _amount) {
      changeUtxos.push(
        new Utxo({
          amount: BigNumber.from(utxoAmount).sub(_amount),
          myHashFunc: poseidon,
          keypair: myKeypair,
          chainID: _chain,
        })
      );
    }
  } else {
    let toKey = Keypair.fromString(_to, poseidon);
    changeUtxos.push(
      new Utxo({
        amount: _amount,
        myHashFunc: poseidon,
        keypair: toKey,
        chainID: _chain,
      })
    );
    changeUtxos.push(
      new Utxo({
        amount: BigNumber.from(utxoAmount).sub(_amount),
        myHashFunc: poseidon,
        keypair: myKeypair,
        chainID: _chain,
      })
    );
    _to = "0x0000000000000000000000000000000000000000";
  }
}

async function prepareSend(_cUTXOs, _chain) {
  let _amount = parseInt($("#toAmount").val());
  if (getPrivateBalance(_chain) < _amount) {
    alert(`Not enough private balance on the ${getChain(_chain)} network.`);
    enableSendButton();
  } else {
    newUTXOs = [];
    let jj = 0;
    let tUtxo;
    while (utxoAmount < _amount && jj < _cUTXOs.length) {
      tUtxo = new Utxo({
        amount: _cUTXOs[jj].amount,
        myHashFunc: poseidon,
        keypair: myKeypair,
        blinding: _cUTXOs[jj].blinding,
        index: parseInt(_cUTXOs[jj].index.hex),
        chainID: _cUTXOs[jj].chainID,
      });
      tUtxo._commitment = _cUTXOs[jj]._commitment;
      tUtxo._nullifier = _cUTXOs[jj]._nullifier;
      newUTXOs.push(tUtxo);
      utxoAmount = utxoAmount.add(_cUTXOs[jj].amount);
      jj++;
    }
    await prepare2(_chain);
  }
}

$("#maxButton").on("click", () => {
  let amountInput = document.querySelector("#toAmount");
  const _network = $('input[name="netType"]:checked').val();
  const _visType = $('input[name="option"]:checked').val();
  if (_visType == "public") {
    if (_network == "sepolia") {
      amountInput.value = m.sVal;
    } else if (_network == "mumbai") {
      amountInput.value = m.mVal;
    } else if (_network == "chiado") {
      amountInput.value = m.cVal;
    } else if (_network == "gnosis") {
      amountInput.value = m.gVal;
    } else if (_network == "polygon") {
      amountInput.value = m.pVal;
    } else if (_network == "optimism") {
      amountInput.value = m.oVal;
    }
  } else {
    if (_network == "sepolia") {
      amountInput.value = ethers.utils.formatEther(m.psVal.toString());
    } else if (_network == "mumbai") {
      amountInput.value = ethers.utils.formatEther(m.pmVal.toString());
    } else if (_network == "chiado") {
      amountInput.value = ethers.utils.formatEther(m.pcVal.toString());
    } else if (_network == "gnosis") {
      amountInput.value = ethers.utils.formatEther(m.pgVal.toString());
    } else if (_network == "polygon") {
      amountInput.value = ethers.utils.formatEther(m.ppVal.toString());
    } else if (_network == "optimism") {
      amountInput.value = ethers.utils.formatEther(m.poVal.toString());
    }
  }
});

const networks = {
  sepolia: {
    CHD: sepoliaCHD,
    UTXOs: m.sepoliaUTXOs,
    Charon: sepoliaCharon,
    Wallet: sepoliaWallet,
    Provider: sepoliaProvider,
  },
  mumbai: {
    CHD: mumbaiCHD,
    UTXOs: m.mumbaiUTXOs,
    Charon: mumbaiCharon,
    Wallet: mumbaiWallet,
    Provider: mumbaiProvider,
  },
  chiado: {
    CHD: chiadoCHD,
    UTXOs: m.chiadoUTXOs,
    Charon: chiadoCharon,
    Wallet: chiadoWallet,
    Provider: chiadoProvider,
  },
  gnosis: {
    CHD: gnosisCHD,
    UTXOs: m.gnoUTXOs,
    Charon: gnosisCharon,
    Wallet: gnosisWallet,
    Provider: gnosisProvider,
  },
  polygon: {
    CHD: polygonCHD,
    UTXOs: m.polUTXOs,
    Charon: polygonCharon,
    Wallet: polygonWallet,
    Provider: polygonProvider,
  },
  optimism: {
    CHD: optimismCHD,
    UTXOs: m.optUTXOs,
    Charon: optimismCharon,
    Wallet: optimismWallet,
    Provider: optimismProvider,
  },
};

async function send() {
  myKeypair = new Keypair({
    privkey: process.env.PRIVATE_KEY,
    myHashFunc: poseidon,
  });
  await myKeypair.pubkey;
  const _to = $("#toAddy").val();
  const _amount = parseFloat($("#toAmount").val());
  const _network = $('input[name="netType"]:checked').val();
  const _visType = $('input[name="option"]:checked').val();
  const _withdrawal = $("#withdrawalCheckbox").prop("checked");
  let _adjTo = _to;
  let _walletAddress = 0;
  if (isNaN(_amount) || _amount <= 0) {
    displayAlertAndEnableButton("Please enter a valid amount");
    return;
  }
  const networkObject = networks[_network];
  if (_visType == "public") {
    await handlePublicTransactions(
      networkObject,
      _to,
      _amount,
      _network,
      _adjTo
    );
  } else {
    if (_withdrawal) {
      _walletAddress = networkObject.Wallet.address;
    } else {
      if (_adjTo.length != 130) {
        displayAlertAndEnableButton("Please enter a valid charon public key");
        return;
      }
    }
    await handlePrivateTransactions(
      networkObject,
      _amount,
      _network,
      _walletAddress
    );
  }
}

async function handlePublicTransactions(
  networkObject,
  _to,
  _amount,
  _network,
  _adjTo
) {
  try {
    if (getPublicBalance(getChainID(_network)) < _amount) {
      displayAlertAndEnableButton(
        "Not enough public balance on the " + _network + " network."
      );
      return;
    }
    if (_adjTo.length != 42) {
      displayAlertAndEnableButton("Please enter a valid address");
      return;
    }
    const provider = networkObject.Provider;
    const currentGasPrice = await provider.getGasPrice();
    const tx = await networkObject.CHD.transfer(
      _to,
      ethers.utils.parseEther(_amount.toString()),
      {
        gasLimit,
        gasPrice: currentGasPrice,
      }
    );
    const receipt = await tx.wait();
    console.log(receipt);
    if (receipt.status === 1) {
      console.log("Transaction was successful");
      window.alert(
        `Transaction was successful! \nNetwork: ${_network} \nTransaction Hash: ${tx.hash}`
      );
    } else {
      console.log("Transaction failed");
      window.alert(`Transaction failed! \nPlease check your transaction.`);
    }
    enableSendButton();
  } catch (err) {
    console.log(err);
    displayAlertAndEnableButton("Transaction failed, check console for details.");
  }
}

async function handlePrivateTransactions(
  networkObject,
  _amount,
  _network,
  _walletAddress
) {
  try {
    //ADD checkbox if withdraw, add MAX button to autofill balance
    //get amount and address (can we just use an address?  Test
    //that that person can then do something with it, if not, you need a registry?)
    await prepareSend(networkObject.UTXOs, getChainID(_network));
    if (newUTXOs.length > 0 || changeUtxos.length > 0) {
      const inputData = await prepareTransaction({
        charon: networkObject.Charon,
        inputs: newUTXOs,
        outputs: changeUtxos,
        recipient: _walletAddress,
        privateChainID: getChainID(_network),
        myHasherFunc: poseidon,
        myHasherFunc2: poseidon2,
      });
      const provider = networkObject.Provider;
      const currentGasPrice = await provider.getGasPrice();
      const tx = await networkObject.Charon.transact(
        inputData.args,
        inputData.extData,
        {
          gasLimit,
          gasPrice: currentGasPrice,
        }
      );
      const receipt = await tx.wait();
      console.log(receipt);
      if (receipt.status === 1) {
        console.log("Transaction was successful");
        window.alert(
          `Transaction was successful! \nNetwork: ${_network} \nTransaction Hash: ${tx.hash}`
        );
      } else {
        console.log("Transaction failed");
        window.alert(`Transaction failed! \nPlease check your transaction.`);
      }
      enableSendButton();
    }
  } catch (err) {
    console.log(err);
    displayAlertAndEnableButton("Transaction failed, check console for details.");
  }
}

function displayAlertAndEnableButton(message) {
  window.alert(message);
  enableSendButton();
}

function getRegistry(_network) {
  if (_network === "chiado") {
    return new ethers.Contract(
      process.env.CHIADO_REGISTRY,
      regABI,
      chiadoWallet
    );
  } else if (_network === "mumbai") {
    return new ethers.Contract(
      process.env.MUMBAI_REGISTRY,
      regABI,
      mumbaiWallet
    );
  } else if (_network === "sepolia") {
    return new ethers.Contract(
      process.env.SEPOLIA_REGISTRY,
      regABI,
      sepoliaWallet
    );
  } else if (_network === "gnosis chain") {
    return new ethers.Contract(
      process.env.GNOSIS_REGISTRY,
      regABI,
      gnosisWallet
    );
  } else if (_network === "polygon") {
    return new ethers.Contract(
      process.env.POLYGON_REGISTRY,
      regABI,
      polygonWallet
    );
  } else if (_network === "optimism") {
    return new ethers.Contract(
      process.env.OPTIMISM_REGISTRY,
      regABI,
      optimismWallet
    );
  }
}

function enableSendButton() {
  loader.style.display = "none";
  text.style.display = "inline";
  button.disabled = false;
  button.style.pointerEvents = "";
}

function showLoadingAnimation() {
  button.disabled = true;
  button.style.pointerEvents = "none";
  text.style.display = "none";
  loader.style.display = "block";
}
function getChain(_id) {
  switch (_id) {
    case 11155111:
      return "sepolia";
    case 80001:
      return "mumbai";
    case 10200:
      return "chiado";
    case 100:
      return "gnosis chain";
    case 137:
      return "polygon";
    case 10:
      return "optimism";
  }
}

function getPrivateBalance(_id) {
  switch (_id) {
    case 11155111:
      return psVal;
    case 80001:
      return pmVal;
    case 10200:
      return pcVal;
    case 100:
      return pgVal;
    case 137:
      return ppVal;
    case 10:
      return poVal;
  }
}

function getPublicBalance(_id) {
  switch (_id) {
    case 11155111:
      return sVal;
    case 80001:
      return mVal;
    case 10200:
      return cVal;
    case 100:
      return gVal;
    case 137:
      return pVal;
    case 10:
      return oVal;
  }
}
