const $ = require("jquery");
const ethers = require("ethers");
const {
  abi: citABI,
} = require("../artifacts/incentiveToken/contracts/Auction.sol/Auction.json");
const {
  abi: cfcABI,
} = require("../artifacts/feeContract/contracts/CFC.sol/CFC.json");
const { SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG } = require("constants");
require("dotenv").config();
const {
  sepoliaWallet,
  mumbaiWallet,
  chiadoWallet,
  gnosisWallet,
  polygonWallet,
  optimismWallet,
} = require("../src/providers");
const isTestnet = process.env.IS_TESTNET === "true";
let citBal, sepBals, mumBals, chiBals, gnoBals, polBals, optBals;
let networks, bases;
let CIT
let sepCFC, mumCFC, chiCFC, gnoCFC, polCFC, optCFC;
$("#myAddress").text(isTestnet ? sepoliaWallet.address : gnosisWallet.address);
isTestnet ? (CIT = new ethers.Contract(process.env.SEPOLIA_CIT, citABI, sepoliaWallet)) :
  (CIT = new ethers.Contract(process.env.GNOSIS_CIT, citABI, gnosisWallet));

if (isTestnet) {
  networks = ['sepolia', 'mumbai', 'chiado'];
  bases = ['eth', 'matic', 'xdai'];
} else {
  networks = ['gnosis chain', 'polygon', 'optimism'];
  bases = ['xdai', 'matic', 'weth'];
}

for (let i = 0; i < 3; i++) {
  const networkElement = document.getElementById(`network${i + 1}`);
  networkElement.textContent = networks[i];

  const baseElement = document.getElementById(`base${i + 1}`);
  baseElement.textContent = bases[i];
}

if (isTestnet) {
  sepCFC = new ethers.Contract(process.env.SEPOLIA_CFC, cfcABI, sepoliaWallet);
  mumCFC = new ethers.Contract(process.env.MUMBAI_CFC, cfcABI, mumbaiWallet);
  chiCFC = new ethers.Contract(process.env.CHIADO_CFC, cfcABI, chiadoWallet);
  sepCFC.getFeePeriods().then((result) => $('#timeLeft1').text(timeLeft(result * 1000)));
  mumCFC.getFeePeriods().then((result) => $('#timeLeft2').text(timeLeft(result * 1000)));
  chiCFC.getFeePeriods().then((result) => $('#timeLeft3').text(timeLeft(result * 1000)));
} else {
  gnoCFC = new ethers.Contract(process.env.GNOSIS_CFC, cfcABI, gnosisWallet);
  polCFC = new ethers.Contract(process.env.POLYGON_CFC, cfcABI, polygonWallet);
  optCFC = new ethers.Contract(process.env.OPTIMISM_CFC, cfcABI, optimismWallet);
  gnoCFC.getFeePeriods().then((result) => $('#timeLeft1').text(timeLeft(result * 1000)));
  polCFC.getFeePeriods().then((result) => $('#timeLeft2').text(timeLeft(result * 1000)));
  optCFC.getFeePeriods().then((result) => $('#timeLeft3').text(timeLeft(result * 1000)));
}

function timeLeft(timestamp) {
  const now = Date.now();
  const timeLeft = timestamp - now;
  const seconds = Math.floor(timeLeft / 1000);
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  let timeString = "";
  if (days > 0) {
    timeString += days + "d "
  }
  if (hours > 0) {
    timeString += hours + "h " 
  }
  // timeString += " left"
  timeString += minutes + "m left"
  return timeString;
}
function numberWithCommas(x) {
  return x.toLocaleString();
}

function setPublicBalances() {
  CIT
    .balanceOf(isTestnet ? sepoliaWallet.address : gnosisWallet.address)
    .then(
      (result) =>
      (citBal = (parseInt(ethers.utils.formatEther(result)) == 0) ? 0 :
        Math.round(ethers.utils.formatEther(result) * 100) / 100)
    );

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, 2000);
  });
}

function setFeesPaid(_feePeriods, _type) {
  if (_feePeriods.length > 0) {
    if (_type == 1) {
      if (isTestnet) {
        sepCFC
          .getFeePeriodByTimestamp(_feePeriods[_feePeriods.length - 1])
          .then((res) => (sepBals = res));
      } else {
        gnoCFC
          .getFeePeriodByTimestamp(_feePeriods[_feePeriods.length - 1])
          .then((res) => (gnoBals = res));
      }
    } else if (_type == 2) {
      if (isTestnet) {
        mumCFC
          .getFeePeriodByTimestamp(_feePeriods[_feePeriods.length - 1])
          .then((res) => (mumBals = res));
      } else {
        polCFC
          .getFeePeriodByTimestamp(_feePeriods[_feePeriods.length - 1])
          .then((res) => (polBals = res));
      }
    } else if (_type == 3) {
      if (isTestnet) {
        chiCFC
          .getFeePeriodByTimestamp(_feePeriods[_feePeriods.length - 1])
          .then((res) => (chiBals = res));
      } else {
        optCFC
          .getFeePeriodByTimestamp(_feePeriods[_feePeriods.length - 1])
          .then((res) => (optBals = res));
      }
    }
  } else {
    let rewardsPerToken = { chdRewardsPerToken: 0, baseTokenRewardsPerToken: 0 };
    if (_type === 1) {
      if (isTestnet) {
        sepBals = { ...rewardsPerToken };
      } else {
        gnoBals = { ...rewardsPerToken };
      }
    } else if (_type === 2) {
      if (isTestnet) {
        mumBals = { ...rewardsPerToken };
      } else {
        polBals = { ...rewardsPerToken };
      }
    } else if (_type === 3) {
      if (isTestnet) {
        chiBals = { ...rewardsPerToken };
      } else {
        optBals = { ...rewardsPerToken };
      }
    }
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, 2000);
  });
}

function setHTML() {
  const data = [
    { element1: '#chd1', element2: '#bal1', testnetBal: sepBals, mainnetBal: gnoBals },
    { element1: '#chd2', element2: '#bal2', testnetBal: mumBals, mainnetBal: polBals },
    { element1: '#chd3', element2: '#bal3', testnetBal: chiBals, mainnetBal: optBals },
  ];

  data.forEach(item => {
    const bal = isTestnet ? item.testnetBal : item.mainnetBal;
    $(item.element1).text(formatAndRound(bal.chdRewardsPerToken));
    $(item.element2).text(formatAndRound(bal.baseTokenRewardsPerToken));
  });

  function formatAndRound(value) {
    return Math.round(ethers.utils.formatEther(value * citBal) * 100) / 100;
  }
}


function setRewards() {
  $("#citBal").text("cit balance: " + Math.round(ethers.utils.formatEther(citBal) * 100) / 100);
  const feeChecks = isTestnet ? [sepCFC, mumCFC, chiCFC] : [gnoCFC, polCFC, optCFC];
  feeChecks.forEach((feeCheck, index) => {
    feeCheck.getFeePeriods().then((result) => setFeesPaid(result, index + 1));
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, 2000);
  });
}

function loadAndDisplay() {
  setPublicBalances()
    .then(() => setRewards())
    .then(() => setHTML());
}

loadAndDisplay();
