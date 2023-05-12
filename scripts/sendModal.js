const $ = require("jquery");
const ethers = require("ethers");
const {
  abi: chdABI,
} = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json");
const {
  abi: charonABI,
} = require("../artifacts/charonAMM/contracts/Charon.sol/Charon.json");
const { buildPoseidon } = require("circomlibjs");
const fs = require("fs");
require("dotenv").config();
const { Keypair } = require("../src/keypair");
const { prepareTransaction } = require("../src/index");
const Utxo = require("../src/utxo");
const { BigNumber } = ethers;
let m, myKeypair, builtPoseidon;
const {
  ethCHD,
  gnoCHD,
  polCHD,
  ethCharon,
  gnoCharon,
  polCharon,
} = require("../src/tokens");

const contents = fs.readFileSync("utxos.txt", "utf-8");
const utxos = JSON.parse(contents);
const ppVal = utxos.ppVal;
const peVal = utxos.peVal;
const pgVal = utxos.pgVal;
const eVal = utxos.eVal;
const gVal = utxos.gVal;
const pVal = utxos.pVal;

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
    if (_network == "ethereum") {
      amountInput.value = eVal;
    } else if (_network == "gnosis") {
      amountInput.value = gVal;
    } else if (_network == "polygon") {
      amountInput.value = pVal;
    }
  } else {
    if (_network == "ethereum") {
      amountInput.value = ethers.utils.formatEther(peVal.toString());
    } else if (_network == "gnosis") {
      amountInput.value = ethers.utils.formatEther(pgVal.toString());
    } else if (_network == "polygon") {
      amountInput.value = ethers.utils.formatEther(ppVal.toString());
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
  if (_amount.trim() === "") {
    window.alert("Please enter a valid amount");
    return;
  }
  if (_visType == "public") {
    if (_network == "ethereum") {
      ethCHD.transfer(_to, _amount).then((result) => console.log(result));
      window.alert(
        "Transaction sent on Ethereum network! public tx hash: " +
          result.hash +
          " (https://etherscan.io/tx/" +
          result.hash
      );
    } else if (_network == "gnosis") {
      gnoCHD.transfer(_to, _amount).then((result) => console.log(result));
      window.alert(
        "Transaction sent on Gnosis network! public tx hash: " +
          result.hash +
          " (https://gnosisscan.io/tx/" +
          result.hash
      );
    } else if (_network == "polygon") {
      polCHD.transfer(_to, _amount).then((result) => console.log(result));
      window.alert(
        "Transaction sent on Polygon network! public tx hash: " +
          result.hash +
          " (https://polygonscan.com/tx/" +
          result.hash
      );
    }
  } else {
    if (_withdrawal != "on") {
      _adjTo = 0;
    }
    if (_network == "ethereum") {
      //ADD checkbox if withdraw, add MAX button to autofill balance
      //get amount and address (can we just use an address?  Test that that person can then do something with it, if not, you need a registry?)
      await prepareSend(m.ethUTXOs, 5);
      if (newUTX0s.length > 0 || changeUTXOs > 0) {
        prepareTransaction({
          charon: ethCharon,
          inputs: newUTXOs,
          outputs: changeUtxos,
          recipient: _adjTo,
          privateChainID: 5,
          myHasherFunc: poseidon,
          myHasherFunc2: poseidon2,
        }).then(function (inputData) {
          ethCharon
            .transact(inputData.args, inputData.extData)
            .then((result) => console.log(result));
        });
      }
      window.alert(
        "Transaction sent on Ethereum network! private tx hash: xxx"
      );
    } else if (_network == "gnosis") {
      //ADD checkbox if withdraw, add MAX button to autofill balance
      //get amount and address (can we just use an address?  Test that that person can then do something with it, if not, you need a registry?)
      await prepareSend(m.gnoUTXOs, 10200);
      if (newUTX0s.length > 0 || changeUTXOs > 0) {
        prepareTransaction({
          charon: gnoCharon,
          inputs: newUTXOs,
          outputs: changeUtxos,
          recipient: _adjTo,
          privateChainID: 10200,
          myHasherFunc: poseidon,
          myHasherFunc2: poseidon2,
        }).then(function (inputData) {
          gnoCharon
            .transact(inputData.args, inputData.extData)
            .then((result) => console.log(result));
        });
      }
      window.alert("Transaction sent on Gnosis network! private tx hash: xxx");
    } else if (_network == "polygon") {
      //ADD checkbox if withdraw, add MAX button to autofill balance
      //get amount and address (can we just use an address?  Test that that person can then do something with it, if not, you need a registry?)
      await prepareSend(m.polUTXOs, 80001);
      if (newUTX0s.length > 0 || changeUTXOs > 0) {
        prepareTransaction({
          charon: polCharon,
          inputs: newUTXOs,
          outputs: changeUtxos,
          recipient: _adjTo,
          privateChainID: 80001,
          myHasherFunc: poseidon,
          myHasherFunc2: poseidon2,
        }).then(function (inputData) {
          polCharon
            .transact(inputData.args, inputData.extData)
            .then((result) => console.log(result));
        });
      }
      //to add, if fee > 0, send to relayer network!! (not built yet)
      window.alert("Transaction sent on Polygon network! private tx hash: xxx");
    }
  }
}
