const $ = require("jquery");
const fs = require("fs");
const electron = require("electron");
const BrowserWindow = electron.BrowserWindow;
const url = require("url");
const path = require("path");
const ethers = require("ethers");
const {
  abi: citABI,
} = require("../artifacts/incentiveToken/contracts/Auction.sol/Auction.json");
const {
  abi: cfcABI,
} = require("../artifacts/feeContract/contracts/CFC.sol/CFC.json");
const { SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG } = require("constants");
require("dotenv").config();
const { ethWallet, gnoWallet, polWallet } = require("../src/providers");

let citBal, ethBals, gnoBals, polBals;

$("#myAddress").text(ethWallet.address);
const ethCIT = new ethers.Contract(process.env.ETHEREUM_CIT, citABI, ethWallet);
const ethCFC = new ethers.Contract(process.env.ETHEREUM_CFC, cfcABI, ethWallet);
const polCFC = new ethers.Contract(process.env.POLYGON_CFC, cfcABI, polWallet);
const gnoCFC = new ethers.Contract(process.env.GNOSIS_CFC, cfcABI, gnoWallet);

function timeUntil(timeStamp) {
  var now = new Date(),
    ms = (timeStamp - now.getTime()) / 1000;
  ms = Math.abs(Number(ms));
  var d, h, m, s;
  s = Math.floor(ms / 1000);
  m = Math.floor(s / 60);
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;
  return d + " days, " + h + " hours, " + m + " minutes, ";
}
function numberWithCommas(x) {
  return x.toLocaleString();
}

function setPublicBalances() {
  ethCIT
    .balanceOf(ethWallet.address)
    .then(
      (result) =>
        (citBal = Math.round(ethers.utils.formatEther(result) * 100) / 100)
    );

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, 2000);
  });
}

function setFeesPaid(_feePeriods, _type) {
  console.log("got to here", _type, _feePeriods);
  if (_feePeriods.length > 0) {
    if (_type == 1) {
      ethCFC
        .getFeePeriodByTimestamp(_feePeriods[_feePeriods.length - 1])
        .then((res) => (ethBals = res));
    } else if (_type == 2) {
      gnoCFC
        .getFeePeriodByTimestamp(_feePeriods[_feePeriods.length - 1])
        .then((res) => (gnoBals = res));
    } else if (_type == 3) {
      polCFC
        .getFeePeriodByTimestamp(_feePeriods[_feePeriods.length - 1])
        .then((res) => (polBals = res));
    }
  } else {
    if (_type == 1) {
      ethBals = { chdRewardsPerToken: 0, baseTokenRewardsPerToken: 0 };
    } else if (_type == 2) {
      gnoBals = { chdRewardsPerToken: 0, baseTokenRewardsPerToken: 0 };
    } else if (_type == 3) {
      polBals = { chdRewardsPerToken: 0, baseTokenRewardsPerToken: 0 };
    }
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, 2000);
  });
}

function setHTML() {
  console.log(gnoBals);
  $("#ethCHD").text(
    Math.round(
      ethers.utils.formatEther(ethBals.chdRewardsPerToken * citBal) * 100
    ) / 100
  );
  $("#ethBal").text(
    Math.round(
      ethers.utils.formatEther(ethBals.baseTokenRewardsPerToken * citBal) * 100
    ) / 100
  );
  $("#gnoCHD").text(
    Math.round(
      ethers.utils.formatEther(gnoBals.chdRewardsPerToken * citBal) * 100
    ) / 100
  );
  $("#xdaiBal").text(
    Math.round(
      ethers.utils.formatEther(gnoBals.baseTokenRewardsPerToken * citBal) * 100
    ) / 100
  );
  $("#polCHD").text(
    Math.round(
      ethers.utils.formatEther(polBals.chdRewardsPerToken * citBal) * 100
    ) / 100
  );
  $("#maticBal").text(
    Math.round(
      ethers.utils.formatEther(polBals.baseTokenRewardsPerToken * citBal) * 100
    ) / 100
  );
}

function setRewards() {
  $("#citBal").text(Math.round(ethers.utils.formatEther(citBal) * 100) / 100);
  ethCFC.getFeePeriods().then((result) => setFeesPaid(result, 1));
  gnoCFC.getFeePeriods().then((result) => setFeesPaid(result, 2));
  polCFC.getFeePeriods().then((result) => setFeesPaid(result, 3));
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
