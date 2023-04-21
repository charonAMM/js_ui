let $ = require('jquery')
const ethers = require('ethers');
const { abi: chdABI } = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json")
const { abi: charonABI } = require("../artifacts/charonAMM/contracts/Charon.sol/Charon.json")
require('dotenv').config()

ethProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_ETHEREUM);
gnosisProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_GNOSIS);
polygonProvider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_POLYGON);

ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
gnoWallet = new ethers.Wallet(process.env.PRIVATE_KEY, gnosisProvider);
polWallet = new ethers.Wallet(process.env.PRIVATE_KEY, polygonProvider);

ethCharon = new ethers.Contract(process.env.ETHEREUM_CHARON, charonABI, ethWallet);
gnoCharon = new ethers.Contract(process.env.GNOSIS_CHARON, charonABI, gnoWallet);
polCharon = new ethers.Contract(process.env.POLYGON_CHARON, charonABI, polWallet);

const fromNetworkSelect = document.getElementById("from");
const toNetworkSelect = document.getElementById("to");

$('#bridgeButton').on('click', () => {
  bridge()
});

function bridge() {
  const fromNetwork = fromNetworkSelect.value;
  const toNetwork = toNetworkSelect.value;
  const amount = document.getElementById("amount").value;

  if (fromNetwork === "ethereum") {
    if (toNetwork === "gnosis") {
      //magic
      window.alert("Bridged to Gnosis!")
    } else if (toNetwork === "polygon") {
      //magic
      window.alert("Bridged to Polygon!")
    }
  }
  if (fromNetwork === "gnosis") {
    if (toNetwork === "ethereum") {
      //magic
      window.alert("Bridged to Ethereum!")
    } else if (toNetwork === "polygon") {
      //magic
      window.alert("Bridged to Polygon!")
    }
  }
  if (fromNetwork === "polygon") {
    if (toNetwork === "ethereum") {
      //magic
      window.alert("Bridged to Ethereum!")
    } else if (toNetwork === "gnosis") {
      //magic
      window.alert("Bridged to Gnosis!")
    }
  }
}

function updateToNetworkOptions() {
  fromNetworkSelect[2].disabled = false;
  toNetworkSelect[0].disabled = false;
  for (let i = 0; i < toNetworkSelect.options.length; i++) {
    const option = toNetworkSelect.options[i];
    if (option.value === fromNetworkSelect.value) {
      option.disabled = true;
      if (toNetworkSelect.value === option.value) {
        fromNetworkSelect.selectedIndex = i + 1;
      }
    } else {
      option.disabled = false;
    }
  }

  for (let i = 0; i < fromNetworkSelect.options.length; i++) {
    const option = fromNetworkSelect.options[i];
    if (option.value === toNetworkSelect.value) {
      option.disabled = true;
      if (fromNetworkSelect.value === option.value) {
        toNetworkSelect.selectedIndex = i + 1;
      }
    } else {
      option.disabled = false;
    }
  }
}

fromNetworkSelect.addEventListener("change", updateToNetworkOptions);
toNetworkSelect.addEventListener("change", updateToNetworkOptions);


function swapNetworks() {
  const temp = fromNetworkSelect.value;
  fromNetworkSelect.value = toNetworkSelect.value;
  toNetworkSelect.value = temp;
  updateToNetworkOptions();
}

fromNetworkSelect.addEventListener("change", updateToNetworkOptions);
toNetworkSelect.addEventListener("change", updateToNetworkOptions);
document.getElementById("swap-networks-btn").addEventListener("click", swapNetworks);

