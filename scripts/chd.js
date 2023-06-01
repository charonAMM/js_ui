const $ = require("jquery");
const fs = require("fs");
const { BrowserWindow } = require("@electron/remote");
const { Keypair } = require("../src/keypair");
const url = require("url");
const path = require("path");
const ethers = require("ethers");
const Utxo = require("../src/utxo");
const { buildPoseidon } = require("circomlibjs");
const { toFixedHex } = require("../src/utils.js");
require("dotenv").config();
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
  gnosisWallet,
  sepoliaProvider,
  mumbaiProvider,
  chiadoProvider,
  gnosisProvider,
  polygonProvider,
  optimismProvider,
} = require("../src/providers");
const filename = "bootstrap";
const isTestnet = process.env.IS_TESTNET === 'true';
let builtPoseidon;
let psVal, pmVal, pcVal, pgVal, ppVal, poVal;
let sVal, mVal, cVal, gVal, pVal, oVal;
let origSval, origMval, origCval, origGval, origPval, origOval;
let sepSet = [0, 0]; //block, balnce initSet
let mumSet = [0, 0]; //block, balnce initSet
let chiSet = [0, 0]; //block, balnce initSet
let gnoSet = [0, 0]; //block, balnce initSet
let polSet = [0, 0]; //block, balnce initSet
let optSet = [0, 0]; //block, balnce initSet
let polUTXOs = []; //beSure to add in save mode
let sepUTXOs = [];
let mumUTXOs = [];
let chiUTXOs = [];
let gnoUTXOs = [];
let optUTXOs = [];
let myKeypair;
let myPubkey = "0x000000";
let myAddress;

isTestnet ? myAddress = sepoliaWallet.address : myAddress = gnosisWallet.address;

$("#myAddress").text(myAddress);

function poseidon(inputs) {
  let val = builtPoseidon(inputs);
  return builtPoseidon.F.toString(val);
}

function makeSendModal() {
  sendModal = new BrowserWindow({
    width: 700,
    height: 640,
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

async function writeUTXOs() {
  try {
    fs.unlinkSync("utxos.txt");
  } catch { }
  const sendVars = {
    sepoliaUTXOs: sepUTXOs,
    chiadoUTXOs: chiUTXOs,
    mumbaiUTXOs: mumUTXOs,
    optimismUTXOs: optUTXOs,
    polUTXOs: polUTXOs,
    gnoUTXOs: gnoUTXOs,
    psVal: sepSet[1],
    pcVal: chiSet[1],
    pmVal: mumSet[1],
    ppVal: polSet[1],
    pgVal: gnoSet[1],
    lastBlockGno: gnoSet[0],
    lastBlockPol: polSet[0],
    lastBlockSep: sepSet[0],
    lastBlockChi: chiSet[0],
    lastBlockMum: mumSet[0],
    lastBlockOpt: optSet[0],
    sVal: origSval,
    mVal: origMval,
    cVal: origCval,
    gVal: origGval,
    pVal: origPval,
    oVal: origOval,
    publicKey: myPubkey,
  };
  fs.writeFileSync("utxos.txt", JSON.stringify(sendVars));
}

function showPubKey() {
  myKeypair.address().then((result) => {
    $("#pubKey").text(result.substring(0, 40) + "...");
    $("#pubKey").attr("title", result);
    myPubkey = result;
  });
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

async function setKeypair() {
  myKeypair = new Keypair({
    privkey: process.env.PRIVATE_KEY,
    myHashFunc: poseidon,
  });
  await showPubKey();
}

function readFileContents(file) {
  if (fs.existsSync(file)) {
    const fileContents = fs.readFileSync(file, "utf-8");
    return JSON.parse(fileContents);
  }
  return null;
}

function initializeStartBlocks(contents, isTestnet) {
  let startBlocks = {};
  if (contents && contents.publicKey == myPubkey) {
    if (isTestnet) {
      startBlocks = {
        sepolia: contents.lastBlockSep,
        mumbai: contents.lastBlockMum,
        chiado: contents.lastBlockChi,
      };
    } else {
      startBlocks = {
        gnosis: contents.lastBlockGno,
        polygon: contents.lastBlockPol,
        optimism: contents.lastBlockOpt,
      };
    }
  } else {
    startBlocks = isTestnet
      ? { sepolia: 0, mumbai: 0, chiado: 0 }
      : { gnosis: 0, polygon: 0, optimism: 0 };
  }
  return startBlocks;
}

async function handleChain(chainCharon, network, chainStartBlock, chainSet, chainUTXOs, keypair) {
  let eventFilter = chainCharon.filters.NewCommitment();
  chainCharon.queryFilter(eventFilter, chainStartBlock, "latest")
    .then(async function (eventData) {
      let myNullifier, xUtxo;
      let j = 0;
      let xUtxos = [];
      for (let i = 0; i < eventData.length; i++) {
        try {
          xUtxo = Utxo.decrypt(
            myKeypair,
            eventData[i].args._encryptedOutput,
            eventData[i].args._index
          );
          xUtxo.chainID = getChainID(network);
          if (
            xUtxo.amount > 0 &&
            toFixedHex(eventData[i].args._commitment) ==
            toFixedHex(xUtxo.getCommitment(poseidon))
          ) {
            xUtxos.push(xUtxo);
            myNullifier = toFixedHex(xUtxo.getNullifier(poseidon));
            chainCharon.isSpent(myNullifier).then(function (result) {
              if (!result) {
                chainSet[1] = chainSet[1] + parseInt(xUtxo[j].amount);
                chainUTXOs.push(xUtxo);
                j++;
              } else {
                j++;
              }
            });
          }
        } catch (err) {
        }
      }
    });
}

async function setData() {
  await setKeypair();
  const contents = readFileContents("utxos.txt");
  const startBlocks = initializeStartBlocks(contents, isTestnet);

  try {
  if (isTestnet) {
    await Promise.all([
      handleChain(sepoliaCharon, "sepolia", startBlocks.sepolia, sepSet, sepUTXOs, myKeypair),
      handleChain(mumbaiCharon, "mumbai", startBlocks.mumbai, mumSet, mumUTXOs, myKeypair),
      handleChain(chiadoCharon, "chiado", startBlocks.chiado, chiSet, chiUTXOs, myKeypair)
    ]);
  } else {
    await Promise.all([
      handleChain(gnosisCharon, "gnosis", startBlocks.gnosis, gnoSet, gnoUTXOs, myKeypair),
      handleChain(polygonCharon, "polygon", startBlocks.polygon, polSet, polUTXOs, myKeypair),
      handleChain(optimismCharon, "optimism", startBlocks.optimism, optSet, optUTXOs, myKeypair)
    ]);
  }
  if (isTestnet) {
    sepSet[0] = await sepoliaProvider.getBlockNumber();
    mumSet[0] = await mumbaiProvider.getBlockNumber();
    chiSet[0] = await chiadoProvider.getBlockNumber();
  } else {
    gnoSet[0] = await gnosisProvider.getBlockNumber();
    polSet[0] = await polygonProvider.getBlockNumber();
    optSet[0] = await optimismProvider.getBlockNumber();
  }
} catch (err) {
  window.alert(err);
}

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
      $("#send").removeAttr("disabled");
      $("#bridge").removeAttr("disabled");
    }, 2000);
  })

  // fs.writeFileSync("utxos.txt", JSON.stringify(saveData, null, 2));
}
function getChainID(chain) {
  switch (chain) {
    case "sepolia":
      return 5;
    case "chiado":
      return 10200;
    case "mumbai":
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

$("#send").on("click", () => {
  makeSendModal();
});

$("#bridge").on("click", () => {
  makeBridgeModal();
});

function loadPrivateBalances() {
  if (isTestnet) {
    psVal = Math.round(ethers.utils.formatEther(sepSet[1].toString()) * 100) / 100;
    pmVal = Math.round(ethers.utils.formatEther(mumSet[1].toString()) * 100) / 100;
    pcVal = Math.round(ethers.utils.formatEther(chiSet[1].toString()) * 100) / 100;
    $("#PCHD0").text(psVal);
    $("#PCHD1").text(pmVal);
    $("#PCHD2").text(pcVal);
    $("#totalBal").text(
      Math.round((sVal + mVal + cVal + psVal + pmVal + pcVal) * 100) / 100
    )
  } else {
    pgVal = Math.round(ethers.utils.formatEther(gnoSet[1].toString()) * 100) / 100;
    ppVal = Math.round(ethers.utils.formatEther(polSet[1].toString()) * 100) / 100;
    poVal = Math.round(ethers.utils.formatEther(optSet[1].toString()) * 100) / 100;
    $("#PCHD0").text(pgVal);
    $("#PCHD1").text(ppVal);
    $("#PCHD2").text(poVal);
    $("#totalBal").text(
      Math.round((gVal + pVal + oVal + pgVal + ppVal + poVal) * 100) / 100
    )
  }

  writeUTXOs();
  fs.writeFile(filename, "", (err) => {
    if (err) console.log(err);
  });
  //update baseblock and balance in local file
  //let _data = ethSet[0] + ',' + ethSet[1] + ',' + polSet[0] + ',' + polSet[1] + ',' + gnoSet[0]+ ',' + gnoSet[1]
  //fs.appendFile(filename, JSON.stringify(_data), (err) => err && console.error(err));
  //fs.appendFile(filename,  )
  //fs.unlinkSync(filename);//for testing
}

function setPublicBalances() {
  if (isTestnet) {
    sepoliaCHD.balanceOf(myAddress).then((result) => {
      origSval = ethers.utils.formatEther(result);
      sVal = Math.round(ethers.utils.formatEther(result) * 100) / 100;
    });
    mumbaiCHD.balanceOf(myAddress).then((result) => {
      origMval = ethers.utils.formatEther(result);
      mVal = Math.round(ethers.utils.formatEther(result) * 100) / 100;
    });
    chiadoCHD.balanceOf(myAddress).then((result) => {
      origCval = ethers.utils.formatEther(result);
      cVal = Math.round(ethers.utils.formatEther(result) * 100) / 100;
    });
  } else {
    gnosisCHD.balanceOf(myAddress).then((result) => {
      origGval = ethers.utils.formatEther(result);
      gVal = Math.round(ethers.utils.formatEther(result) * 100) / 100;
    });
    polygonCHD.balanceOf(myAddress).then((result) => {
      origPval = ethers.utils.formatEther(result);
      pVal = Math.round(ethers.utils.formatEther(result) * 100) / 100;
    });
    optimismCHD.balanceOf(myAddress).then((result) => {
      origOval = ethers.utils.formatEther(result);
      oVal = Math.round(ethers.utils.formatEther(result) * 100) / 100;
    });
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, 2000);
  });
}

function loadPublicBalances() {
  let totalBal = 0;
  if (isTestnet) {
    $("#network1").text("sepolia");
    $("#network2").text("mumbai");
    $("#network3").text("chiado");
    $("#CHD0").text(sVal);
    $("#CHD1").text(mVal);
    $("#CHD2").text(cVal);
    totalBal = sVal + mVal + cVal + psVal + pmVal + pcVal;
  } else {
    $("#network1").text("gnosis chain");
    $("#network2").text("polygon");
    $("#network3").text("optimism");
    $("#CHD0").text(gVal);
    $("#CHD1").text(pVal);
    $("#CHD2").text(oVal);
    totalBal = gVal + pVal + oVal + pgVal + ppVal + poVal;
  }
  $("#totalBal").text(Math.round(totalBal * 100) / 100);
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