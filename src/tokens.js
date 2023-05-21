const ethers = require("ethers");
const { sepoliaWallet, mumbaiWallet, chiadoWallet, gnosisWallet, polygonWallet, optimismWallet } = require("./providers");
const {
  abi: chdABI,
} = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json");
const {
  abi: charonABI,
} = require("../artifacts/charonAMM/contracts/Charon.sol/Charon.json");
require("dotenv").config();
const isTestnet = process.env.IS_TESTNET === "true";

const tokenABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address) view returns (uint)",
];

let sepoliaCHD, mumbaiCHD, chiadoCHD, sepoliaCharon, mumbaiCharon, chiadoCharon, sepoliaBaseToken, mumbaiBaseToken, chiadoBaseToken,
  gnosisCHD, polygonCHD, optimismCHD, gnosisCharon, polygonCharon, optimismCharon, gnosisBaseToken, polygonBaseToken, optimismBaseToken;

if (isTestnet) {
  sepoliaCHD = new ethers.Contract(process.env.SEPOLIA_CHD, chdABI, sepoliaWallet);
  mumbaiCHD = new ethers.Contract(process.env.MUMBAI_CHD, chdABI, mumbaiWallet);
  chiadoCHD = new ethers.Contract(process.env.CHIADO_CHD, chdABI, chiadoWallet);

  sepoliaCharon = new ethers.Contract(
    process.env.SEPOLIA_CHARON,
    charonABI,
    sepoliaWallet
  );
  mumbaiCharon = new ethers.Contract(
    process.env.MUMBAI_CHARON,
    charonABI,
    mumbaiWallet
  );
  chiadoCharon = new ethers.Contract(
    process.env.CHIADO_CHARON,
    charonABI,
    chiadoWallet
  );
  sepoliaBaseToken = new ethers.Contract(
    process.env.SEPOLIA_BASETOKEN,
    tokenABI,
    sepoliaWallet
  );
  mumbaiBaseToken = new ethers.Contract(
    process.env.MUMBAI_BASETOKEN,
    tokenABI,
    mumbaiWallet
  );
  chiadoBaseToken = new ethers.Contract(
    process.env.CHIADO_BASETOKEN,
    tokenABI,
    chiadoWallet
  );
} else {
  gnosisCHD = new ethers.Contract(process.env.GNOSIS_CHD, chdABI, gnosisWallet);
  polygonCHD = new ethers.Contract(process.env.POLYGON_CHD, chdABI, polygonWallet);
  optimismCHD = new ethers.Contract(process.env.OPTIMISM_CHD, chdABI, optimismWallet);

  gnosisCharon = new ethers.Contract(
    process.env.GNOSIS_CHARON,
    charonABI,
    gnosisWallet
  );
  polygonCharon = new ethers.Contract(
    process.env.POLYGON_CHARON,
    charonABI,
    polygonWallet
  );
  optimismCharon = new ethers.Contract(
    process.env.OPTIMISM_CHARON,
    charonABI,
    optimismWallet
  );
  gnosisBaseToken = new ethers.Contract(
    process.env.GNOSIS_BASETOKEN,
    tokenABI,
    gnosisWallet
  );
  polygonBaseToken = new ethers.Contract(
    process.env.POLYGON_BASETOKEN,
    tokenABI,
    polygonWallet
  );
  optimismBaseToken = new ethers.Contract(
    process.env.OPTIMISM_BASETOKEN,
    tokenABI,
    optimismWallet
  );
}
module.exports = {
  sepoliaCHD,
  mumbaiCHD,
  chiadoCHD,
  sepoliaCharon,
  mumbaiCharon,
  chiadoCharon,
  sepoliaBaseToken,
  mumbaiBaseToken,
  chiadoBaseToken,
  gnosisCHD,
  polygonCHD,
  optimismCHD,
  gnosisCharon,
  polygonCharon,
  optimismCharon,
  gnosisBaseToken,
  polygonBaseToken,
  optimismBaseToken,
};
