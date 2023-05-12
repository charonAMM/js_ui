const ethers = require("ethers");
const { ethWallet, gnoWallet, polWallet } = require("./providers");
const {
  abi: chdABI,
} = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json");
const {
  abi: charonABI,
} = require("../artifacts/charonAMM/contracts/Charon.sol/Charon.json");
require("dotenv").config();

const ethCHD = new ethers.Contract(process.env.ETHEREUM_CHD, chdABI, ethWallet);
const gnoCHD = new ethers.Contract(process.env.GNOSIS_CHD, chdABI, gnoWallet);
const polCHD = new ethers.Contract(process.env.POLYGON_CHD, chdABI, polWallet);

const ethCharon = new ethers.Contract(
  process.env.ETHEREUM_CHARON,
  charonABI,
  ethWallet
);
const gnoCharon = new ethers.Contract(
  process.env.GNOSIS_CHARON,
  charonABI,
  gnoWallet
);
const polCharon = new ethers.Contract(
  process.env.POLYGON_CHARON,
  charonABI,
  polWallet
);

const EthBaseToken = process.env.ETHEREUM_BASETOKEN;
const GnoBaseToken = process.env.GNOSIS_BASETOKEN;
const PolBaseToken = process.env.POLYGON_BASETOKEN;
const tokenABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address) view returns (uint)",
];

const polygonBaseToken = new ethers.Contract(PolBaseToken, tokenABI, polWallet);
const gnosisBaseToken = new ethers.Contract(GnoBaseToken, tokenABI, gnoWallet);
const ethBaseToken = new ethers.Contract(EthBaseToken, tokenABI, ethWallet);

module.exports = {
  ethCHD,
  gnoCHD,
  polCHD,
  ethCharon,
  gnoCharon,
  polCharon,
  polygonBaseToken,
  gnosisBaseToken,
  ethBaseToken,
};
