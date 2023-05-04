let $ = require("jquery");
const {
  abi: citABI,
} = require("../artifacts/incentiveToken/contracts/Auction.sol/Auction.json");
const ethers = require("ethers");
require("dotenv").config();

ethProvider = new ethers.providers.JsonRpcProvider(
  process.env.NODE_URL_ETHEREUM
);
ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
ethCIT = new ethers.Contract(process.env.ETHEREUM_CIT, citABI, ethWallet);

const button = document.getElementById("signAndBid");
const text = document.getElementById("bidText");
const loader = document.getElementById("bidLoader");

$("#signAndBid").on("click", async () => {
  const bidAmount = $("#bidAmount").val();
  const currentTopBid = ethers.utils.formatEther(await ethCIT.currentTopBid());
  if (bidAmount > currentTopBid) {
    showLoadingAnimation();
    ethCIT
      .bid(ethers.utils.parseEther(bidAmount), { gasLimit: 300000 })
      .then((result) => {
        console.log(result);
        window.alert("Bid successful. Your bid: " + bidAmount + " ETH");
        loader.style.display = "none";
        text.style.display = "inline";
        button.disabled = false;
      });
  } else {
    window.alert(
      "Bid too low. Please enter a bid higher than the current top bid: " +
        currentTopBid +
        " ETH"
    );
  }
});

function showLoadingAnimation() {
  button.disabled = true;
  text.style.display = "none";
  loader.style.display = "block";
}
