const ethers = require("ethers");
require("dotenv").config();

const ethProvider = new ethers.providers.JsonRpcProvider(
  process.env.NODE_URL_ETHEREUM
);
const gnosisProvider = new ethers.providers.JsonRpcProvider(
  process.env.NODE_URL_GNOSIS
);
const polygonProvider = new ethers.providers.JsonRpcProvider(
  process.env.NODE_URL_POLYGON
);

const ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
const gnoWallet = new ethers.Wallet(process.env.PRIVATE_KEY, gnosisProvider);
const polWallet = new ethers.Wallet(process.env.PRIVATE_KEY, polygonProvider);

module.exports = {
  ethProvider,
  gnosisProvider,
  polygonProvider,
  ethWallet,
  gnoWallet,
  polWallet,
};
