const ethers = require("ethers");
require("dotenv").config();
const isTestnet = process.env.IS_TESTNET === "true";

const environments = {
  testnet: ["SEPOLIA", "CHIADO", "MUMBAI"],
  mainnet: ["GNOSIS", "POLYGON", "OPTIMISM"],
};

const createProviderAndWallet = (network) => {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env[`NODE_URL_${network}`]
  );
  try {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    return { provider, wallet };
  } catch (e) {
    window.alert(`Please set a valid private key in your .env file`);
  }
};

const providersAndWallets = environments[
  isTestnet ? "testnet" : "mainnet"
].reduce((acc, network) => {
  const { provider, wallet } = createProviderAndWallet(network);
  acc[`${network.toLowerCase()}Provider`] = provider;
  acc[`${network.toLowerCase()}Wallet`] = wallet;
  return acc;
}, {});

module.exports = providersAndWallets;
