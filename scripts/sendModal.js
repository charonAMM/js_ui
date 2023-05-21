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
  if (ethers.utils.parseEther(m.ppVal.toString()) < parseInt(_amount)) {
    alert("not enough private balance on mumbai!!");
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
  if (_to.trim() === "") {
    window.alert("Please enter a valid address");
    return;
  }
  if (String(_amount).trim() === "") {
    window.alert("Please enter a valid amount");
    return;
  }
  if (_visType == "public") {
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
    if (_withdrawal != "on") {
      _adjTo = 0;
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
}
