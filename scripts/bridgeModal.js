let $ = require("jquery");
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

ethProvider = new ethers.providers.JsonRpcProvider(
  process.env.NODE_URL_ETHEREUM
);
gnosisProvider = new ethers.providers.JsonRpcProvider(
  process.env.NODE_URL_GNOSIS
);
polygonProvider = new ethers.providers.JsonRpcProvider(
  process.env.NODE_URL_POLYGON
);

ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
gnoWallet = new ethers.Wallet(process.env.PRIVATE_KEY, gnosisProvider);
polWallet = new ethers.Wallet(process.env.PRIVATE_KEY, polygonProvider);

ethCharon = new ethers.Contract(
  process.env.ETHEREUM_CHARON,
  charonABI,
  ethWallet
);
gnoCharon = new ethers.Contract(
  process.env.GNOSIS_CHARON,
  charonABI,
  gnoWallet
);
polCharon = new ethers.Contract(
  process.env.POLYGON_CHARON,
  charonABI,
  polWallet
);
ethCHD = new ethers.Contract(process.env.ETHEREUM_CHD, chdABI, ethWallet);
gnoCHD = new ethers.Contract(process.env.GNOSIS_CHD, chdABI, gnoWallet);
polCHD = new ethers.Contract(process.env.POLYGON_CHD, chdABI, polWallet);

ETHBaseToken = process.env.ETHEREUM_BASETOKEN;
GNOBaseToken = process.env.GNOSIS_BASETOKEN;
POLBaseToken = process.env.POLYGON_BASETOKEN;
approveABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
];

polBaseToken = new ethers.Contract(POLBaseToken, approveABI, polWallet);
gnoBaseToken = new ethers.Contract(GNOBaseToken, approveABI, gnoWallet);
ethBaseToken = new ethers.Contract(ETHBaseToken, approveABI, ethWallet);

const fromNetworkSelect = document.getElementById("from");
const toNetworkSelect = document.getElementById("to");
const tokenSelect = document.getElementById("token");
const button = document.getElementById("bridgeButton");
const text = document.getElementById("bridgeText");
const loader = document.getElementById("bridgeLoader");

let builtPoseidon;
const contents = fs.readFileSync("utxos.txt", "utf-8");
const utxos = JSON.parse(contents);
const ppVal = utxos.ppVal;
const peVal = utxos.peVal;
const pgVal = utxos.pgVal;

let ethBal, gnoBal, polBal;
let chdEthBal, chdGnoBal, chdPolBal;

loadBalances();
async function loadBalances() {
  // //baseTokens
  ethBal = await ethBaseToken.balanceOf(ethWallet.address);
  gnoBal = await gnosisBaseToken.balanceOf(gnoWallet.address);
  polBal = await polygonBaseToken.balanceOf(polWallet.address);

  //chdTokens
  chdEthBal = await ethCHD.balanceOf(ethWallet.address);
  chdGnoBal = await gnoCHD.balanceOf(gnoWallet.address);
  chdPolBal = await polCHD.balanceOf(polWallet.address);
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
  text.style.display = "none";
  loader.style.display = "block";
}

const maxBtn = document.getElementById("max-btn");
const amountInput = document.getElementById("amount");

maxBtn.addEventListener("click", () => {
  let balance = 0;
  if (fromNetworkSelect.value === "ethereum") {
    if (tokenSelect.value === "CHD") {
      balance = chdEthBal;
    } else {
      amountInput.value = ethBal;
    }
  } else if (fromNetworkSelect.value === "gnosis") {
    if (tokenSelect.value === "CHD") {
      balance = chdGnoBal;
    } else {
      balance = gnoBal;
    }
  } else if (fromNetworkSelect.value === "polygon") {
    if (tokenSelect.value === "CHD") {
      balance = chdPolBal;
    } else {
      balance = polBal;
    }
  }
  amountInput.value = ethers.utils.formatEther(balance.toString());
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

async function checkBalance(_fromNetwork, _depositAmount) {
  let _privAmount;
  switch (_fromNetwork) {
    case "ethereum":
      _privAmount = parseInt(ethers.utils.parseEther(peVal.toString()));
      break;
    case "gnosis":
      _privAmount = parseInt(ethers.utils.parseEther(pgVal.toString()));
      break;
    case "polygon":
      _privAmount = parseInt(ethers.utils.parseEther(ppVal.toString()));
      break;
  }
  if (_privAmount < parseInt(_depositAmount)) {
    alert(`Not enough private balance on ${_fromNetwork}!`);
    return;
  }
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
  const _targetChainID = getChainID(_toNetwork);
  const _isChd = _token === "CHD";

  try {
    if (!_isChd) {
      _amount = await _charon.calcInGivenOut(
        await _charon.recordBalance(),
        await _charon.recordBalanceSynth(),
        _depositAmount,
        0
      );
    }

    await checkBalance(_fromNetwork, _depositAmount);

    const _utxo = new Utxo({
      amount: _depositAmount,
      myHashFunc: poseidon,
      chainID: _targetChainID,
      keypair: _myKeypair,
    });

    const _approveToken = _isChd
      ? getCHDToken(_fromNetwork)
      : getBaseToken(_fromNetwork);

    await _approveToken.approve(
      _charon.address,
      _isChd ? _depositAmount : _amount
    );

    prepareTransaction({
      charon: _charon,
      inputs: [],
      outputs: [_utxo],
      privateChainID: _targetChainID,
      myHasherFunc: poseidon,
      myHasherFunc2: poseidon2,
    }).then(async function (inputData) {
      _charon
        .depositToOtherChain(
          inputData.args,
          inputData.extData,
          _isChd,
          ethers.utils.parseEther("999999"),
          { gasLimit }
        )
        .then((result) => {
          console.log(result);
          window.alert(
            `Transaction on ${_fromNetwork} sent with hash: ${result.hash}`
          );
          enableBridgeButton();
        });
    });
  } catch (err) {
    window.alert("Transaction failed, check console for more info.");
    enableBridgeButton();
    console.log(err);
  }
}

function getBaseToken(_chain) {
  switch (_chain) {
    case "ethereum":
      return ethBaseToken;
    case "gnosis":
      return gnoBaseToken;
    case "polygon":
      return polBaseToken;
    default:
      return null;
  }
}

function getCHDToken(_chain) {
  switch (_chain) {
    case "ethereum":
      return ethCHD;
    case "gnosis":
      return gnoCHD;
    case "polygon":
      return polCHD;
    default:
      return null;
  }
}

function getCharon(chain) {
  switch (chain) {
    case "ethereum":
      return ethCharon;
    case "gnosis":
      return gnoCharon;
    case "polygon":
      return polCharon;
    default:
      return null;
  }
}

function getChainID(chain) {
  switch (chain) {
    case "ethereum":
      return 5;
    case "gnosis":
      return 10200;
    case "polygon":
      return 80001;
    default:
      return null;
  }
}

function enableBridgeButton() {
  loader.style.display = "none";
  text.style.display = "inline";
  button.disabled = false;
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

  if (fromNetworkSelect.value === "ethereum") {
    tokenSelect.innerHTML = `
      <option value="ETH">ETH</option>
      <option value="CHD">CHD</option>
    `;
  }
  if (fromNetworkSelect.value === "gnosis") {
    tokenSelect.innerHTML = `
    <option value="GNO">GNO</option>
    <option value="CHD">CHD</option>
  `;
  }
  if (fromNetworkSelect.value === "polygon") {
    tokenSelect.innerHTML = `
    <option value="MATIC">MATIC</option>
    <option value="CHD">CHD</option>
  `;
  }
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
