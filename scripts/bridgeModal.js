const $ = require("jquery");
const ethers = require("ethers");
const { BigNumber } = ethers;
const {
  abi: chdABI,
} = require("../artifacts/charonAMM/contracts/CHD.sol/CHD.json");
const {
  abi: charonABI,
} = require("../artifacts/charonAMM/contracts/Charon.sol/Charon.json");
const Utxo = require("../src/utxo");
const zero =
  "21663839004416932945382355908790599225266501822907911457504978515578255421292";
const { buildPoseidon } = require("circomlibjs");
const MerkleTree = require("fixed-merkle-tree");
const fs = require("fs");
const { Keypair } = require("../src/keypair");
const {
  toFixedHex,
  getExtDataHash,
  FIELD_SIZE,
  shuffle,
} = require("../src/utils.js");
const { prove } = require("../src/prover.js");
const MERKLE_TREE_HEIGHT = 23;
require("dotenv").config();
const gasLimit = 3000000;
const {
  sepoliaCHD,
  sepoliaCharon,
  sepoliaBaseToken,
  chiadoCHD,
  chiadoCharon,
  chiadoBaseToken,
  mumbaiCHD,
  mumbaiCharon,
  mumbaiBaseToken,
  gnosisCHD,
  gnosisCharon,
  gnosisBaseToken,
  polygonCHD,
  polygonCharon,
  polygonBaseToken,
  optimismCHD,
  optimismCharon,
  optimismBaseToken,
} = require("../src/tokens");
const {
  sepoliaWallet,
  mumbaiWallet,
  chiadoWallet,
  gnosisWallet,
  polygonWallet,
  optimismWallet,
  sepoliaProvider,
  mumbaiProvider,
  chiadoProvider,
  gnosisProvider,
  polygonProvider,
  optimismProvider,
} = require("../src/providers");
const isTestnet = process.env.IS_TESTNET === "true";
const fromNetworkSelect = document.getElementById("from");
const toNetworkSelect = document.getElementById("to");
const tokenSelect = document.getElementById("token");
const button = document.getElementById("bridgeButton");
const text = document.getElementById("bridgeText");
const loader = document.getElementById("bridgeLoader");

let builtPoseidon;

let sepoliaCHDBal,
  mumbaiCHDBal,
  chiadoCHDBal,
  gnosisCHDBal,
  polygonCHDBal,
  optimismCHDBal;
let sepoliaBal, mumbaiBal, chiadoBal, gnosisBal, polygonBal, optimismBal;

updateTokenOptions(isTestnet ? "sepolia" : "gnosis");

const walletsConfig = [
  {
    network: "testnet",
    wallets: ["sepolia", "mumbai", "chiado"],
  },
  {
    network: "mainnet",
    wallets: ["gnosis", "polygon", "optimism"],
  },
];

const values = isTestnet ? walletsConfig[0].wallets : walletsConfig[1].wallets;
const texts = isTestnet
  ? ["Sepolia", "Mumbai", "Chiado"]
  : ["Gnosis", "Polygon", "Optimism"];

const fromDropdown = document.getElementById("from");
const toDropdown = document.getElementById("to");

for (let i = 0; i < fromDropdown.length; i++) {
  fromDropdown.options[i].value = values[i];
  fromDropdown.options[i].text = texts[i];
  toDropdown.options[i].value = values[i];
  toDropdown.options[i].text = texts[i];
}

loadBalances();
async function loadBalances() {
  const config = walletsConfig.find(
    (cfg) => cfg.network === (isTestnet ? "testnet" : "mainnet")
  );

  for (let i = 0; i < config.wallets.length; i++) {
    const wallet = config.wallets[i];
    const chdBal = await eval(
      `${wallet}CHD.balanceOf(${wallet}Wallet.address)`
    );
    const baseTokenBal = await eval(
      `${wallet}BaseToken.balanceOf(${wallet}Wallet.address)`
    );

    eval(`${wallet}CHDBal = ${ethers.utils.formatEther(chdBal)}`);
    eval(`${wallet}Bal = ${ethers.utils.formatEther(baseTokenBal)}`);
  }
}

$("#bridgeButton").on("click", () => {
  if (
    document.getElementById("amount").value == 0 ||
    isNaN(document.getElementById("amount").value) ||
    document.getElementById("amount").value < 0
  ) {
    window.alert("Please enter a valid amount");
    return;
  }
  showLoadingAnimation();
  bridge();
});

function showLoadingAnimation() {
  button.disabled = true;
  button.style.pointerEvents = "none";
  text.style.display = "none";
  loader.style.display = "block";
}

const maxBtn = document.getElementById("max-btn");
const amountInput = document.getElementById("amount");

maxBtn.addEventListener("click", () => {
  let balance = 0;
  if (fromNetworkSelect.value === "sepolia") {
    if (tokenSelect.value === "CHD") {
      balance = sepoliaCHDBal;
    } else {
      balance = sepoliaBal;
    }
  } else if (fromNetworkSelect.value === "mumbai") {
    if (tokenSelect.value === "CHD") {
      balance = mumbaiCHDBal;
    } else {
      balance = mumbaiBal;
    }
  } else if (fromNetworkSelect.value === "chiado") {
    if (tokenSelect.value === "CHD") {
      balance = chiadoCHDBal;
    } else {
      balance = chiadoBal;
    }
  } else if (fromNetworkSelect.value === "gnosis") {
    if (tokenSelect.value === "CHD") {
      balance = gnosisCHDBal;
    } else {
      balance = gnosisBal;
    }
  } else if (fromNetworkSelect.value === "polygon") {
    if (tokenSelect.value === "CHD") {
      balance = polygonCHDBal;
    } else {
      balance = polygonBal;
    }
  } else if (fromNetworkSelect.value === "optimism") {
    if (tokenSelect.value === "CHD") {
      balance = optimismCHDBal;
    } else {
      balance = optimismBal;
    }
  }
  amountInput.value = balance;
});

function poseidon(inputs) {
  let val = builtPoseidon(inputs);
  return builtPoseidon.F.toString(val);
}

buildPoseidon().then(function (res) {
  builtPoseidon = res;
});

function poseidon2(a, b) {
  return poseidon([a, b]);
}

async function checkBalance(_fromNetwork, _depositAmount, _isChd) {
  let _amount;
  if (_isChd) {
    switch (_fromNetwork) {
      case "sepolia":
        _amount = sepoliaCHDBal;
        break;
      case "mumbai":
        _amount = mumbaiCHDBal;
        break;
      case "chiado":
        _amount = chiadoCHDBal;
        break;
      case "gnosis":
        _amount = gnosisCHDBal;
        break;
      case "polygon":
        _amount = polygonCHDBal;
        break;
      case "optimism":
        _amount = optimismCHDBal;
        break;
    }
  } else {
    switch (_fromNetwork) {
      case "sepolia":
        _amount = sepoliaBal;
        break;
      case "mumbai":
        _amount = mumbaiBal;
        break;
      case "chiado":
        _amount = chiadoBal;
        break;
      case "gnosis":
        _amount = gnosisBal;
        break;
      case "polygon":
        _amount = polygonBal;
        break;
      case "optimism":
        _amount = optimismBal;
        break;
    }
  }
  if (
    parseFloat(_amount) < parseFloat(ethers.utils.formatEther(_depositAmount))
  ) {
    alert(`Not enough balance on ${_fromNetwork}!`);
    enableBridgeButton();
    return false;
  }
  return true;
}

async function bridge() {
  const _privkey = process.env.PRIVATE_KEY;
  const _depositAmount = ethers.utils.parseEther(
    document.getElementById("amount").value
  );

  const _fromNetwork = fromNetworkSelect.value;
  const _toNetwork = toNetworkSelect.value;

  const _token = tokenSelect.value;
  let _amount;
  const _myKeypair = new Keypair({
    _privkey,
    myHashFunc: poseidon,
  });
  const _charon = getCharon(_fromNetwork);
  const _targetCharon = getCharon(_toNetwork);
  const _targetChainID = getChainID(_toNetwork);
  const _isChd = _token === "CHD";
  if (!(await checkBalance(_fromNetwork, _depositAmount, _isChd))) return;

  try {
    if (!_isChd) {
      _amount = await _charon.calcOutGivenIn(
        await _charon.recordBalance(),
        await _charon.recordBalanceSynth(),
        _depositAmount,
        0
      );
    }

    const _utxo = new Utxo({
      amount: _isChd ? _depositAmount : _amount,
      myHashFunc: poseidon,
      chainID: _targetChainID,
      keypair: _myKeypair,
    });

    const _approveToken = _isChd
      ? getCHDToken(_fromNetwork)
      : getBaseToken(_fromNetwork);

    const approveAmount = _isChd
      ? _depositAmount
      : await _charon.calcInGivenOut(
          await _charon.recordBalance(),
          await _charon.recordBalanceSynth(),
          _amount,
          0
        );
    const provider = getProvider(_fromNetwork);
    const currentGasPrice = await provider.getGasPrice();
    await _approveToken.approve(_charon.address, approveAmount, {
      gasLimit,
      gasPrice: currentGasPrice,
    });

    prepareTransaction({
      charon: _targetCharon,
      inputs: [],
      outputs: [_utxo],
      privateChainID: _targetChainID,
      myHasherFunc: poseidon,
      myHasherFunc2: poseidon2,
    }).then(async function (inputData) {
      const tx = await _charon.depositToOtherChain(
        inputData.args,
        inputData.extData,
        _isChd,
        ethers.utils.parseEther("999999"),
        { gasLimit, gasPrice: currentGasPrice }
      );
      const receipt = await tx.wait();
      console.log(receipt);
      if (receipt.status === 1) {
        console.log("Transaction was successful");
        window.alert(
          `Transaction was successful! \nNetwork: ${_fromNetwork} \nTransaction Hash: ${tx.hash}`
        );
      } else {
        console.log("Transaction failed");
        window.alert(`Transaction failed! \nPlease check your transaction.`);
      }
      enableBridgeButton();
    });
  } catch (err) {
    window.alert("Transaction failed, check console for more info.");
    enableBridgeButton();
    console.log(err);
  }
}

function getBaseToken(_chain) {
  switch (_chain) {
    case "sepolia":
      return sepoliaBaseToken;
    case "mumbai":
      return mumbaiBaseToken;
    case "chiado":
      return chiadoBaseToken;
    case "gnosis":
      return gnosisBaseToken;
    case "polygon":
      return polygonBaseToken;
    case "optimism":
      return optimismBaseToken;
    default:
      return null;
  }
}

function getCHDToken(_chain) {
  switch (_chain) {
    case "sepolia":
      return sepoliaCHD;
    case "mumbai":
      return mumbaiCHD;
    case "chiado":
      return chiadoCHD;
    case "gnosis":
      return gnosisCHD;
    case "polygon":
      return polygonCHD;
    case "optimism":
      return optimismCHD;
    default:
      return null;
  }
}

function getCharon(chain) {
  switch (chain) {
    case "sepolia":
      return sepoliaCharon;
    case "mumbai":
      return mumbaiCharon;
    case "chiado":
      return chiadoCharon;
    case "gnosis":
      return gnosisCharon;
    case "polygon":
      return polygonCharon;
    case "optimism":
      return optimismCharon;
    default:
      return null;
  }
}

function getChainID(chain) {
  switch (chain) {
    case "sepolia":
      return 11155111;
    case "chiado":
      return 10200;
    case "mumbai":
      return 80001;
    case "gnosis":
      return 100;
    case "polygon":
      return 137;
    case "optimism":
      return 10;
    default:
      return null;
  }
}

function getProvider(chain) {
  switch (chain) {
    case "sepolia":
      return sepoliaProvider;
    case "mumbai":
      return mumbaiProvider;
    case "chiado":
      return chiadoProvider;
    case "gnosis":
      return gnosisProvider;
    case "polygon":
      return polygonProvider;
    case "optimism":
      return optimismProvider;
    default:
      return null;
  }
}

function enableBridgeButton() {
  loader.style.display = "none";
  text.style.display = "inline";
  button.disabled = false;
  button.style.pointerEvents = "";
}

function updateOptionStatus(select1, select2) {
  for (let i = 0; i < select1.options.length; i++) {
    const option = select1.options[i];
    option.disabled = option.value === select2.value;
    if (option.disabled && select1.value === option.value) {
      select2.selectedIndex = (i + 1) % select2.options.length;
    }
  }
}

function updateTokenOptions(network) {
  let tokens;
  switch (network) {
    case "sepolia":
      tokens = ["ETH", "CHD"];
      break;
    case "mumbai":
      tokens = ["wMATIC", "CHD"];
      break;
    case "chiado":
      tokens = ["wXDAI", "CHD"];
      break;
    case "gnosis":
      tokens = ["wXDAI", "CHD"];
      break;
    case "polygon":
      tokens = ["wMATIC", "CHD"];
      break;
    case "optimism":
      tokens = ["wETH", "CHD"];
      break;
    default:
      tokens = [];
  }

  tokenSelect.innerHTML = tokens
    .map((token) => `<option value="${token}">${token}</option>`)
    .join("");
}

function updateToNetworkOptions() {
  fromNetworkSelect[2].disabled = false;
  toNetworkSelect[0].disabled = false;

  updateOptionStatus(toNetworkSelect, fromNetworkSelect);
  updateOptionStatus(fromNetworkSelect, toNetworkSelect);

  updateTokenOptions(fromNetworkSelect.value);
}

async function prepareTransaction({
  charon,
  inputs = [],
  outputs = [],
  fee = 0,
  recipient = 0,
  rebate = 0,
  privateChainID = 2,
  myHasherFunc,
  myHasherFunc2,
  test = false,
}) {
  if (inputs.length > 16 || outputs.length > 2) {
    throw new Error("Incorrect inputs/outputs count");
  }
  while (inputs.length !== 2 && inputs.length < 16) {
    inputs.push(
      new Utxo({ myHashFunc: myHasherFunc, chainID: privateChainID })
    );
  }
  while (outputs.length < 2) {
    outputs.push(
      new Utxo({ myHashFunc: myHasherFunc, chainID: privateChainID })
    );
  }
  let extAmount = BigNumber.from(fee)
    .add(outputs.reduce((sum, x) => sum.add(x.amount), BigNumber.from(0)))
    .sub(inputs.reduce((sum, x) => sum.add(x.amount), BigNumber.from(0)));

  const { args, extData } = await getProof({
    inputs,
    outputs,
    tree: await buildMerkleTree(charon, myHasherFunc2),
    extAmount,
    fee,
    rebate,
    recipient,
    privateChainID,
    myHasherFunc,
    test,
  });

  return {
    args,
    extData,
  };
}

async function getProof({
  inputs,
  outputs,
  tree,
  extAmount,
  fee,
  rebate,
  recipient,
  privateChainID,
  myHasherFunc,
  test,
}) {
  inputs = shuffle(inputs);
  outputs = shuffle(outputs);

  let inputMerklePathIndices = [];
  let inputMerklePathElements = [];

  for (const input of inputs) {
    if (input.amount > 0) {
      input.index = tree.indexOf(toFixedHex(input.getCommitment(myHasherFunc)));
      if (test) {
        input.index = 1;
      }
      if (input.index < 0) {
        throw new Error(
          `Input commitment ${toFixedHex(
            input.getCommitment(myHasherFunc)
          )} was not found`
        );
      }
      inputMerklePathIndices.push(input.index);
      try {
        inputMerklePathElements.push(tree.path(input.index).pathElements);
      } catch {
        if (test) {
          inputMerklePathElements.push(new Array(tree.levels).fill(0));
        } else {
          throw new Error("index out of bounds");
        }
      }
    } else {
      inputMerklePathIndices.push(0);
      inputMerklePathElements.push(new Array(tree.levels).fill(0));
    }
  }

  const extData = {
    recipient: toFixedHex(recipient, 20),
    extAmount: toFixedHex(extAmount),
    fee: toFixedHex(fee),
    rebate: toFixedHex(rebate),
    encryptedOutput1: outputs[0].encrypt(),
    encryptedOutput2: outputs[1].encrypt(),
  };

  const extDataHash = getExtDataHash(extData);
  let input = {
    root: await tree.root,
    chainID: privateChainID,
    publicAmount: BigNumber.from(extAmount)
      .sub(fee)
      .add(FIELD_SIZE)
      .mod(FIELD_SIZE)
      .toString(),
    extDataHash: extDataHash,
    inputNullifier: await Promise.all(
      inputs.map((x) => x.getNullifier(myHasherFunc))
    ),
    outputCommitment: await Promise.all(
      outputs.map((x) => x.getCommitment(myHasherFunc))
    ),

    // data for 2 transaction inputs
    privateChainID: privateChainID,
    inAmount: inputs.map((x) => x.amount),
    inPrivateKey: inputs.map((x) => x.keypair.privkey),
    inBlinding: inputs.map((x) => x.blinding),
    inPathIndices: inputMerklePathIndices,
    inPathElements: inputMerklePathElements,

    // data for 2 transaction outputs
    outAmount: outputs.map((x) => x.amount),
    outBlinding: outputs.map((x) => x.blinding),
    outPubkey: await Promise.all(outputs.map((x) => x.keypair.pubkey)),
  };

  let proof;
  if (test) {
    proof =
      "0x05d9ab35de0c1cd660c35fc200b347ccb62137b3a5c76863efaf747ccaac93b50ca82593e48eb2999a15d0f324c427e23fb5765e35198322bf90bb024df504ca10b994e4697566004b88f8c116aa59a051d5bbf8c0c3badc46e51532c01c051a02dbaeaba0f9362a8994d9bb6de0de72c2fd5b2d947b4328825a2a42e81732a91f37e1e7a796cd3cb0aac043e6f24052a371ea7404c3d7808dbf52709d59c82e008ec50f2a54baa4f6bd404d8bbcdd0b45418a5fd629278c8c3c1b7a8da604e62a1593ba48be71f14c07146b838647cd1d3e029ea06c8375495ac295fda5150403510cc1c11e2c726ce767727e0c90c2f7270ed0f61791d70d5f7de61228210b";
  } else {
    proof = await prove(
      input,
      `./artifacts/circuits/transaction${inputs.length}_js/transaction${inputs.length}`,
      `./artifacts/circuits//transaction${inputs.length}`
    );
  }

  const args = {
    proof,
    root: toFixedHex(input.root),
    inputNullifiers: inputs.map((x) => toFixedHex(x.getNullifier())),
    outputCommitments: outputs.map((x) => toFixedHex(x.getCommitment())),
    publicAmount: toFixedHex(input.publicAmount),
    extDataHash: toFixedHex(extDataHash),
  };
  return {
    extData,
    args,
  };
}

async function buildMerkleTree(charon, hasherFunc) {
  let filter = charon.filters.NewCommitment();
  const events = await charon.queryFilter(filter, 0, "latest");
  const leaves = events
    .sort((a, b) => a.args._index - b.args._index)
    .map((e) => toFixedHex(e.args._commitment));
  let tree = await new MerkleTree.default(MERKLE_TREE_HEIGHT, [], {
    hashFunction: hasherFunc,
    zeroElement: zero,
  });
  await tree.bulkInsert(leaves);
  return tree;
  //return new MerkleTree(MERKLE_TREE_HEIGHT, leaves, { hashFunction: poseidonHash2 })
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
document
  .getElementById("swap-networks-btn")
  .addEventListener("click", swapNetworks);
