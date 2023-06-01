const $ = require("jquery");
const { BrowserWindow } = require("@electron/remote");
const url = require("url");
const path = require("path");
const ethers = require("ethers");
const {
  abi: citABI,
} = require("../artifacts/incentiveToken/contracts/Auction.sol/Auction.json");
require("dotenv").config();
const { sepoliaWallet, gnosisWallet } = require("../src/providers");
const isTestnet = process.env.IS_TESTNET === "true";

$("#myAddress").text(isTestnet ? sepoliaWallet.address : gnosisWallet.address);
let CIT;
if (isTestnet) {
  CIT = new ethers.Contract(process.env.SEPOLIA_CIT, citABI, sepoliaWallet);
} else {
  CIT = new ethers.Contract(process.env.GNOSIS_CIT, citABI, gnosisWallet);
}

$("#bid").on("click", () => {
  makeBidModal();
});

function timeLeft(timestamp) {
  const now = Date.now();
  const timeLeft = timestamp - now;
  const seconds = Math.floor(timeLeft / 1000);
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  let timeString = "";
  if (days > 0) {
    timeString += days + " day" + (days > 1 ? "s" : "") + ", ";
  }
  if (hours > 0) {
    timeString += hours + " hour" + (hours > 1 ? "s" : "") + ", ";
  }
  timeString += minutes + " minute" + (minutes > 1 ? "s" : "");
  return timeString;
}

async function setPublicBalances() {
  try {
    await CIT.topBidder().then((result) => $("#topBidder").text(result));
    await CIT.currentTopBid().then((result) =>
      $("#topBid").text(
        Math.round(ethers.utils.formatEther(result) * 100) / 100
      )
    );

    const currentDate = new Date();
    const currentUnix = Math.floor(currentDate.getTime() / 1000);
    const endDateUnix = await CIT.endDate();

    if (endDateUnix <= currentUnix) {
      $("#timeLeft").text("0 day, 0 hours, 0 minutes,");
      $("#endFeeRoundButton").removeAttr("disabled");
      $("#endFeeRoundButton").on("click", async () => {
        try {
          $("#endFeeRoundButton").attr("disabled", true);
          await CIT.startNewAuction({
            gasLimit: 300000,
          }).then((result) => {
            console.log(result);
            window.alert(
              "Transaction sent successfully with hash: " + result.hash
            );
            loadAndDisplay();
          });
        } catch (error) {
          console.log(error);
          window.alert("transaction failed, check console for more details");
          $("#endFeeRoundButton").removeAttr("disabled");
        }
      });
    } else {
      await CIT.endDate().then((result) =>
        $("#timeLeft").text(timeLeft(result * 1000))
      );
      $("#bid").removeAttr("disabled");
    }
  } catch (error) {
    window.alert(error.message);
    $("#timeLeft").text("n/a");
    $("#topBid").text("n/a");
    $("#topBidder").text("n/a");
  }
}
function loadAndDisplay() {
  setPublicBalances();
}

function makeBidModal() {
  const bidModal = new BrowserWindow({
    width: 700,
    height: 350,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });

  bidModal.loadURL(
    url.format({
      pathname: path.join(__dirname, "../modals/bidModal.html"),
      protocol: "file:",
      slashes: true,
    })
  );
  // bidModal.webContents.openDevTools()
}

loadAndDisplay();
