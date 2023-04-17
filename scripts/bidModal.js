let $ = require('jquery')
const { abi: citABI } = require("../artifacts/incentiveToken/contracts/Auction.sol/Auction.json")
const ethers = require('ethers');
require('dotenv').config()

console.log("bidModal.js loaded");
ethProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_ETHEREUM);
ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
ethCIT = new ethers.Contract(process.env.ETHEREUM_CIT, citABI, ethWallet);

$('#signAndBid').on('click', async () => {
   console.log("sign and bid clicked")
   const bidAmount = $('#bidAmount').val()
   const currentTopBid = ethers.utils.formatEther(await ethCIT.currentTopBid())
   console.log("bidAmount: ", bidAmount)
   console.log("currentTopBid: ", currentTopBid)
   if (bidAmount > currentTopBid) {
      ethCIT.bid(ethers.utils.parseEther(bidAmount), { gasLimit: 300000 }).then((result) => console.log(result));
      window.alert("Bid successful. Please wait for the transaction to be mined.")
   }
   else {
      window.alert("Bid too low. Please enter a bid higher than the current top bid: " + currentTopBid + " ETH")
   }
})

$('bidAmount').on('input', () => {
   console.log("here")
})
