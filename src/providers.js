const ethers = require("ethers");
require("dotenv").config();
const isTestnet = process.env.IS_TESTNET === "true";

const environments = {
  testnet: ['SEPOLIA', 'CHIADO', 'MUMBAI'],
  mainnet: ['GNOSIS', 'POLYGON', 'OPTIMISM']
};

const createProviderAndWallet = (network) => {
  const provider = new ethers.providers.JsonRpcProvider(process.env[`NODE_URL_${network}`]);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  return { provider, wallet };
};

const providersAndWallets = environments[isTestnet ? 'testnet' : 'mainnet']
  .reduce((acc, network) => {
    const { provider, wallet } = createProviderAndWallet(network);
    acc[`${network.toLowerCase()}Provider`] = provider;
    acc[`${network.toLowerCase()}Wallet`] = wallet;
    return acc;
  }, {});

module.exports = providersAndWallets;
