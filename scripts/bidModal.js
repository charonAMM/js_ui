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
let ethBalanceVal;
const button = document.getElementById("signAndBid");
const text = document.getElementById("bidText");
const loader = document.getElementById("bidLoader");

EthBaseToken = process.env.ETHEREUM_BASETOKEN;
tokenABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address) view returns (uint)"
];
ethBaseToken = new ethers.Contract(EthBaseToken, tokenABI, ethWallet);

$("#ethBalance").text("...");
console.log(ethWallet.address);
ethBaseToken.balanceOf(ethWallet.address).then((result) => {
  ethBalanceVal = ethers.utils.formatEther(result)
  $("#ethBalance").text(parseFloat(ethBalanceVal).toFixed(3));
});
$("#signAndBid").on("click", async () => {
  const bidAmount = parseFloat($("#bidAmount").val());
  const ethBalance = parseFloat(ethBalanceVal);
  const currentTopBid = parseFloat(ethers.utils.formatEther(await ethCIT.currentTopBid()));

  try {
    if (
      bidAmount == "" ||
      bidAmount == null ||
      bidAmount == undefined ||
      bidAmount == 0 ||
      isNaN(bidAmount)
    ) {
      window.alert("Please enter a bid amount");
      return;
    }
    if (bidAmount > currentTopBid) {
      if (bidAmount > ethBalance) {
        window.alert(
          "Bid too high. Please enter a bid lower than your current ETH balance: " +
            ethBalance +
            " ETH"
        );
        return;
      }
      showLoadingAnimation();
      await ethBaseToken.approve(
        ethCIT.address,
        ethers.utils.parseEther(bidAmount.toString()),
        { gasLimit: 300000 }
      );
      ethCIT
        .bid(ethers.utils.parseEther(bidAmount.toString()), { gasLimit: 300000 })
        .then((result) => {
          console.log(result);
          window.alert("Transaction sent with hash: " + result.hash);
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
  } catch (error) {
    window.alert("Error: " + error.message);
    console.log(error);
  }
});

function showLoadingAnimation() {
  button.disabled = true;
  text.style.display = "none";
  loader.style.display = "block";
}
