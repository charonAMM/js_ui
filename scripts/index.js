let $ = require("jquery");
let fs = require("fs");
const { BrowserWindow } = require("@electron/remote");
const { Keypair } = require("../src/keypair");
const url = require("url");
const path = require("path");
const ethers = require("ethers");
const Utxo = require("../src/utxo");
const {
  abi: chdABI,
} = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json");
const {
  abi: charonABI,
} = require("../artifacts/charonAMM/contracts/Charon.sol/Charon.json");
const { buildPoseidon } = require("circomlibjs");
const { toFixedHex } = require("../src/utils.js");
require("dotenv").config();
let filename = "bootstrap";
let builtPoseidon;
let eVal, gVal, pVal, peVal, pgVal, ppVal;
let origEval, origGval, origPval;
let ethSet = [0, 0]; //block, balnce initSet
let gnoSet = [0, 0]; //block, balnce initSet
let polSet = [0, 0]; //block, balnce initSet
let polUTXOs = []; //beSure to add in save mode
let ethUTXOs = [];
let gnoUTXOs = [];
let myKeypair;

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

function poseidon(inputs) {
  let val = builtPoseidon(inputs);
  return builtPoseidon.F.toString(val);
}

function makeSendModal() {
  sendModal = new BrowserWindow({
    width: 700,
    height: 620,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });
  sendModal.loadURL(
    url.format({
      pathname: path.join(__dirname, "../modals/sendModal.html"),
      protocol: "file:",
      slashes: true,
    })
  );
}

function makeBridgeModal() {
  // Enable @electron/remote module for the bridgeWindow's webContents
  bridgeModal = new BrowserWindow({
    width: 720,
    height: 390,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });
  bridgeModal.loadURL(
    url.format({
      pathname: path.join(__dirname, "../modals/bridgeModal.html"),
      protocol: "file:",
      slashes: true,
    })
  );
  // bridgeModal.webContents.openDevTools()
}

function writeUTXOs() {
  try {
    fs.unlinkSync("utxos.txt");
  } catch {}
  const sendVars = {
    polUTXOs: polUTXOs,
    gnoUTXOs: gnoUTXOs,
    ethUTXOs: ethUTXOs,
    ppVal: ppVal,
    peVal: peVal,
    pgVal: pgVal,
    eVal: origEval,
    gVal: origGval,
    pVal: origPval,
  };
  fs.writeFileSync("utxos.txt", JSON.stringify(sendVars));
}

document.body.classList.add("loading");
window.addEventListener("load", function () {
  setTimeout(function () {
    document.body.classList.remove("loading");
    document.body.classList.add("loaded");
  }, 3900);
});

function showPubKey() {
  myKeypair
    .address()
    .then((result) => $("#pubKey").text(result.substring(0, 40) + "..."));
  const pubKeyElement = document.querySelector("#pubKey");
  pubKeyElement.addEventListener("click", () => {
    myKeypair.address().then((result) => navigator.clipboard.writeText(result));
    const tooltip = new bootstrap.Tooltip(pubKeyElement, {
      title: "copied!",
      placement: "top",
      trigger: "manual",
    });
    tooltip.show();
    setTimeout(() => {
      tooltip.hide();
    }, 600);
  });

  pubKeyElement.addEventListener("mouseenter", () => {
    pubKeyElement.classList.add("text-primary");
    pubKeyElement.classList.remove("text-muted");
    pubKeyElement.style.cursor = "pointer";
  });
  pubKeyElement.addEventListener("mouseleave", () => {
    pubKeyElement.classList.remove("text-primary");
    pubKeyElement.classList.add("text-muted");
    pubKeyElement.style.cursor = "auto";
  });
}

function setData() {
  myKeypair = new Keypair({
    privkey: process.env.PRIVATE_KEY,
    myHashFunc: poseidon,
  });
  showPubKey();

  console.log("mk", myKeypair.address());

  let eventFilter = ethCharon.filters.NewCommitment();
  ethCharon.queryFilter(eventFilter, 0, "latest").then(function (evtData) {
    let eUtxo, myNullifier;
    let jjj = 0;
    let eUtxos = [];
    for (let i = 0; i < evtData.length; i++) {
      try {
        eUtxo = Utxo.decrypt(
          myKeypair,
          evtData[i].args._encryptedOutput,
          evtData[i].args._index
        );
        eUtxo.chainID = 5;
        if (
          eUtxo.amount > 0 &&
          toFixedHex(evtData[i].args._commitment) ==
            toFixedHex(eUtxo.getCommitment(poseidon))
        ) {
          eUtxos.push(eUtxo);
          myNullifier = toFixedHex(eUtxo.getNullifier(poseidon));
          ethCharon.isSpent(myNullifier).then(function (result) {
            if (!result) {
              ethSet[1] = ethSet[1] + parseInt(eUtxos[jjj].amount);
              ethUTXOs.push(eUtxos[jjj]);
              jjj++;
            } else {
              jjj++;
            }
          });
        }
      } catch {}
    }
  });
  gEventFilter = gnoCharon.filters.NewCommitment();
  gnoCharon.queryFilter(gEventFilter, 0, "latest").then(function (evtData2) {
    let gUtxo, mygNullifier;
    let jj = 0;
    let gUtxos = [];
    for (let iii = 0; iii < evtData2.length; iii++) {
      try {
        gUtxo = Utxo.decrypt(
          myKeypair,
          evtData2[iii].args._encryptedOutput,
          evtData2[iii].args._index
        );
        gUtxo.chainID = 10200;
        if (
          gUtxo.amount > 0 &&
          toFixedHex(evtData2[iii].args._commitment) ==
            toFixedHex(gUtxo.getCommitment(poseidon))
        ) {
          gUtxos.push(gUtxo);
          mygNullifier = toFixedHex(gUtxo.getNullifier(poseidon));
          gnoCharon.isSpent(mygNullifier).then(function (result) {
            if (!result) {
              gnoSet[1] = gnoSet[1] + parseInt(gUtxos[jj].amount);
              gnoUTXOs.push(gUtxos[jj]);
              jj++;
            } else {
              jj++;
            }
          });
        }
      } catch {}
    }
  });
  peventFilter = polCharon.filters.NewCommitment();
  polCharon.queryFilter(peventFilter, 0, "latest").then(function (evtData3) {
    let mypNullifier, pUtxo;
    let j = 0;
    let pUtxos = [];
    for (let ii = 0; ii < evtData3.length; ii++) {
      try {
        pUtxo = Utxo.decrypt(
          myKeypair,
          evtData3[ii].args._encryptedOutput,
          evtData3[ii].args._index
        );
        pUtxo.chainID = 80001;
        if (
          pUtxo.amount > 0 &&
          toFixedHex(evtData3[ii].args._commitment) ==
            toFixedHex(pUtxo.getCommitment(poseidon))
        ) {
          pUtxos.push(pUtxo);
          mypNullifier = toFixedHex(pUtxo.getNullifier(poseidon));
          polCharon.isSpent(mypNullifier).then(function (result) {
            if (!result) {
              polSet[1] = polSet[1] + parseInt(pUtxos[j].amount);
              polUTXOs.push(pUtxos[j]);
              j++;
            } else {
              j++;
            }
          });
        }
      } catch {}
    }
  });
  //for testing, turn back on
  // ethProvider.getBlockNumber().then((result) => ethSet[0] = result);
  // polygonProvider.getBlockNumber().then((result) => polSet[0] = result);
  // gnosisProvider.getBlockNumber().then((result) => gnoSet[0] = result);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, 2000);
  });
}

$("#send").on("click", () => {
  makeSendModal();
});

$("#bridge").on("click", () => {
  makeBridgeModal();
});

function loadPrivateBalances() {
  peVal =
    Math.round(ethers.utils.formatEther(ethSet[1].toString()) * 100) / 100;
  pgVal =
    Math.round(ethers.utils.formatEther(gnoSet[1].toString()) * 100) / 100;
  ppVal =
    Math.round(ethers.utils.formatEther(polSet[1].toString()) * 100) / 100;
  $("#ethPCHD").text(peVal);
  $("#gnoPCHD").text(pgVal);
  $("#polPCHD").text(ppVal);
  $("#totalBal").text(
    Math.round((eVal + gVal + pVal + peVal + pgVal + ppVal) * 100) / 100
  );
  writeUTXOs();
  //update baseblock and balance in local file
  fs.writeFile(filename, "", (err) => {
    if (err) console.log(err);
  });
  //let _data = ethSet[0] + ',' + ethSet[1] + ',' + polSet[0] + ',' + polSet[1] + ',' + gnoSet[0]+ ',' + gnoSet[1]
  //fs.appendFile(filename, JSON.stringify(_data), (err) => err && console.error(err));
  //fs.appendFile(filename,  )
  //fs.unlinkSync(filename);//for testing
}

function setPublicBalances() {
  ethCHD.balanceOf(ethWallet.address).then((result) => {
    origEval = ethers.utils.formatEther(result);
    eVal = Math.round(origEval * 100) / 100;
  });
  gnoCHD.balanceOf(gnoWallet.address).then((result) => {
    origGval = ethers.utils.formatEther(result);
    gVal = Math.round(ethers.utils.formatEther(result) * 100) / 100;
  });
  polCHD.balanceOf(polWallet.address).then((result) => {
    origPval = ethers.utils.formatEther(result);
    pVal = Math.round(ethers.utils.formatEther(result) * 100) / 100;
  });
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, 2000);
  });
}

function loadPublicBalances() {
  $("#ethCHD").text(eVal);
  $("#gnoCHD").text(gVal);
  $("#polCHD").text(pVal);
  $("#totalBal").text(
    Math.round((eVal + gVal + pVal + peVal + pgVal + ppVal) * 100) / 100
  );
}

function loadAndDisplayContacts() {
  setData().then((result) => loadPrivateBalances());
  setPublicBalances().then((result) => loadPublicBalances());
}

function pBuild() {
  buildPoseidon().then(function (res) {
    builtPoseidon = res;
  });
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, 2000);
  });
}

pBuild().then(() => loadAndDisplayContacts());
