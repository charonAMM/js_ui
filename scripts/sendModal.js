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
} = require("../src/providers");

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
  document.getElementById('btnradio1').value = 'sepolia';
  document.getElementById('labelradio1').textContent = 'sepolia';
  document.getElementById('btnradio2').value = 'mumbai';
  document.getElementById('labelradio2').textContent = 'mumbai';
  document.getElementById('btnradio3').value = 'chiado';
  document.getElementById('labelradio3').textContent = 'chiado';
} else {
  document.getElementById('btnradio1').value = 'gnosis';
  document.getElementById('labelradio1').textContent = 'gnosis';
  document.getElementById('btnradio2').value = 'polygon';
  document.getElementById('labelradio2').textContent = 'polygon';
  document.getElementById('btnradio3').value = 'optimism';
  document.getElementById('labelradio3').textContent = 'optimism';
}

function poseidon2(a, b) {
  return poseidon([a, b]);
}

$("#signAndSend").on("click", () => {
  send();
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
      return 5;
    case "mumbai":
      return 10200;
    case "chiado":
      return 80001;
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
  let _amount = $("#toAmount").val();
  let _withdrawal2 = $("#withdrawalCheckbox").val();
  if (_withdrawal2 == "on") {
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

const networkButtons = document.querySelectorAll('input[type="radio"]');
const toAmountInput = document.querySelector("#toAmount");

networkButtons.forEach((networkButton) => {
  networkButton.addEventListener("change", () => {
    toAmountInput.value = "";
  });
});

$("#maxButton").on("click", () => {
  let amountInput = document.querySelector("#toAmount");
  const _network = $('input[name="netType"]:checked').val();
  const _visType = $("#txType-switch").prop("checked") ? "private" : "public";
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
async function send() {
  myKeypair = new Keypair({
    privkey: process.env.PRIVATE_KEY,
    myHashFunc: poseidon,
  }); // contains private and public keys
  await myKeypair.pubkey;
  let _to = $("#toAddy").val();
  let _amount = parseInt($("#toAmount").val());
  let _network = $('input[name="netType"]:checked').val();
  let _visType = $("#txType-switch").prop("checked") ? "private" : "public";
  let _withdrawal = $("#withdrawalCheckbox").val();
  let _adjTo = _to;

  if (_to.length != 42) {
    window.alert("Please enter a valid address");
    return;
  }
  if (isNaN(_amount)) {
    window.alert("Please enter a valid amount");
    return;
  }
  try {
    if (_visType == "public") {
      if (getPublicBalance(getChainID(_network)) < _amount) {
        window.alert("Not enough public balance on the " + _network + " network.");
        return;
      }
      if (_network == "sepolia") {
        sepoliaCHD.transfer(_to, ethers.utils.parseEther(_amount.toString())).then((result) => {
          console.log(result);
          window.alert(
            "Transaction sent on Sepolia network with tx hash: " +
            result.hash
          );
        });
      } else if (_network == "mumbai") {
        mumbaiCHD.transfer(_to, ethers.utils.parseEther(_amount.toString())).then((result) => {
          console.log(result);
          window.alert(
            "Transaction sent on Mumbai network with tx hash: " +
            result.hash
          );
        });
      } else if (_network == "chiado") {
        chiadoCHD.transfer(_to, ethers.utils.parseEther(_amount.toString())).then((result) => {
          console.log(result)
          window.alert(
            "Transaction sent on Chiado network with tx hash: " +
            result.hash
          );
        });
      } else if (_network == "gnosis") {
        gnosisCHD.transfer(_to, ethers.utils.parseEther(_amount.toString())).then((result) => {
          console.log(result);
          window.alert(
            "Transaction sent on Gnosis network with tx hash: " +
            result.hash
          );
        });
      } else if (_network == "polygon") {
        polygonCHD.transfer(_to, ethers.utils.parseEther(_amount.toString())).then((result) => {
          console.log(result);
          window.alert(
            "Transaction sent on Polygon network with tx hash: " +
            result.hash
          );
        });
      } else if (_network == "optimism") {
        optimismCHD.transfer(_to, ethers.utils.parseEther(_amount.toString())).then((result) => {
          console.log(result);
          window.alert(
            "Transaction sent on Optimism network with tx hash: " +
            result.hash
          );
        });
      }
    } else {
      const registry = getRegistry(_network);
      if (_withdrawal != "on") {
        _adjTo = 0;
      } else {
        const publicKey = await registry.getPublicKey(_to);
        if (publicKey == '0x') {
          window.alert("Address not yet registered.  Please register it first.");
          return;
        } else {
          _adjTo = publicKey;
        }
      }
      if (_network == "sepolia") {
        //ADD checkbox if withdraw, add MAX button to autofill balance
        //get amount and address (can we just use an address?  Test that that person can then do something with it, if not, you need a registry?)
        await prepareSend(m.sepoliaUTXOs, getChainID(_network));
        if (newUTXOs.length > 0 || changeUtxos > 0) {
          prepareTransaction({
            charon: sepoliaCharon,
            inputs: newUTXOs,
            outputs: changeUtxos,
            recipient: _adjTo,
            privateChainID: getChainID(_network),
            myHasherFunc: poseidon,
            myHasherFunc2: poseidon2,
          }).then(function (inputData) {
            sepoliaCharon
              .transact(inputData.args, inputData.extData)
              .then((result) =>
                window.alert(
                  `Transaction sent on Sepolia network with tx hash: ${result.hash}`
                )
              );
          });
        }
      } else if (_network == "mumbai") {
        //ADD checkbox if withdraw, add MAX button to autofill balance
        //get amount and address (can we just use an address?  Test that that person can then do something with it, if not, you need a registry?)
        await prepareSend(m.mumbaiUTXOs, getChainID(_network));
        if (newUTXOs.length > 0 || changeUtxos > 0) {
          prepareTransaction({
            charon: mumbaiCharon,
            inputs: newUTXOs,
            outputs: changeUtxos,
            recipient: _adjTo,
            privateChainID: getChainID(_network),
            myHasherFunc: poseidon,
            myHasherFunc2: poseidon2,
          }).then(function (inputData) {
            mumbaiCharon
              .transact(inputData.args, inputData.extData)
              .then((result) =>
                window.alert(
                  `Transaction sent on Mumbai network with tx hash: ${result.hash}`
                )
              );
          });
        }
      } else if (_network == "chiado") {
        //ADD checkbox if withdraw, add MAX button to autofill balance
        //get amount and address (can we just use an address?  Test that that person can then do something with it, if not, you need a registry?)
        await prepareSend(m.chiadoUTXOs, getChainID(_network));
        if (newUTXOs.length > 0 || changeUtxos > 0) {
          prepareTransaction({
            charon: chiadoCharon,
            inputs: newUTXOs,
            outputs: changeUtxos,
            recipient: _adjTo,
            privateChainID: getChainID(_network),
            myHasherFunc: poseidon,
            myHasherFunc2: poseidon2,
          }).then(function (inputData) {
            chiadoCharon
              .transact(inputData.args, inputData.extData)
              .then((result) =>
                window.alert(
                  `Transaction sent on Chiado network with tx hash: ${result.hash}`
                )
              );
          });
        }
      }
      else if (_network == "gnosis") {
        //ADD checkbox if withdraw, add MAX button to autofill balance
        //get amount and address (can we just use an address?  Test that that person can then do something with it, if not, you need a registry?)
        await prepareSend(m.gnoUTXOs, getChainID(_network));
        if (newUTXOs.length > 0 || changeUtxos > 0) {
          prepareTransaction({
            charon: gnosisCharon,
            inputs: newUTXOs,
            outputs: changeUtxos,
            recipient: _adjTo,
            privateChainID: getChainID(_network),
            myHasherFunc: poseidon,
            myHasherFunc2: poseidon2,
          }).then(function (inputData) {
            gnosisCharon
              .transact(inputData.args, inputData.extData)
              .then((result) =>
                window.alert(
                  `Transaction sent on Gnosis Chain! tx hash: ${result.hash}`
                )
              );
          });
        }
      } else if (_network == "polygon") {
        //ADD checkbox if withdraw, add MAX button to autofill balance
        //get amount and address (can we just use an address?  Test that that person can then do something with it, if not, you need a registry?)
        await prepareSend(m.polUTXOs, getChainID(_network));
        if (newUTXOs.length > 0 || changeUtxos > 0) {
          prepareTransaction({
            charon: polygonCharon,
            inputs: newUTXOs,
            outputs: changeUtxos,
            recipient: _adjTo,
            privateChainID: getChainID(_network),
            myHasherFunc: poseidon,
            myHasherFunc2: poseidon2,
          }).then(function (inputData) {
            polygonCharon
              .transact(inputData.args, inputData.extData)
              .then((result) =>
                window.alert(
                  `Transaction sent on Polygon! tx hash: ${result.hash}`
                )
              );
          });
        }
        //to add, if fee > 0, send to relayer network!! (not built yet)
      }
      else if (_network == "optimism") {
        //ADD checkbox if withdraw, add MAX button to autofill balance
        //get amount and address (can we just use an address?  Test that that person can then do something with it, if not, you need a registry?)
        await prepareSend(m.optUTXOs, getChainID(_network));
        if (newUTXOs.length > 0 || changeUtxos > 0) {
          prepareTransaction({
            charon: optimismCharon,
            inputs: newUTXOs,
            outputs: changeUtxos,
            recipient: _adjTo,
            privateChainID: getChainID(_network),
            myHasherFunc: poseidon,
            myHasherFunc2: poseidon2,
          }).then(function (inputData) {
            optimismCharon
              .transact(inputData.args, inputData.extData)
              .then((result) =>
                window.alert(
                  `Transaction sent on Optimism! tx hash: ${result.hash}`
                )
              );
          });
        }
        //to add, if fee > 0, send to relayer network!! (not built yet)
      }
    }
  } catch (err) {
    console.log(err);
    window.alert("Transaction failed.  Please try again.");
  }
}

function getRegistry(_network) {
  if (_network === 'chiado') {
    return new ethers.Contract(process.env.CHIADO_REGISTRY, regABI, chiadoWallet);
  }
  else if (_network === 'mumbai') {
    return new ethers.Contract(process.env.MUMBAI_REGISTRY, regABI, mumbaiWallet);
  }
  else if (_network === 'sepolia') {
    return new ethers.Contract(process.env.SEPOLIA_REGISTRY, regABI, sepoliaWallet);
  }
  else if (_network === 'gnosis chain') {
    return new ethers.Contract(process.env.GNOSIS_REGISTRY, regABI, gnosisWallet);
  }
  else if (_network === 'polygon') {
    return new ethers.Contract(process.env.POLYGON_REGISTRY, regABI, polygonWallet);
  }
  else if (_network === 'optimism') {
    return new ethers.Contract(process.env.OPTIMISM_REGISTRY, regABI, optimismWallet);
  }
}

function getChain(_id) {
  switch (_id) {
    case 5:
      return "sepolia";
    case 10200:
      return "mumbai";
    case 80001:
      return "chiado"
    case 100:
      return "gnosis chain"
    case 137:
      return "polygon"
    case 10:
      return "optimism"
  }
}

function getPrivateBalance(_id) {
  switch (_id) {
    case 5:
      return psVal;
    case 10200:
      return pmVal;
    case 80001:
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
    case 5:
      return sVal;
    case 10200:
      return mVal;
    case 80001:
      return cVal;
    case 100:
      return gVal;
    case 137:
      return pVal;
    case 10:
      return oVal;
  }
}

