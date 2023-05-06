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

let myKeypair, builtPoseidon;
const contents = fs.readFileSync("utxos.txt", "utf-8");
const utxos = JSON.parse(contents);
const polUTXOs = utxos.polUTXOs;
const gnoUTXOs = utxos.gnoUTXOs;
const ethUTXOs = utxos.ethUTXOs;
const ppVal = utxos.ppVal;
const peVal = utxos.peVal;
const pgVal = utxos.pgVal;

let ethBal, gnoBal, polBal;
let chdEthBal, chdGnoBal, chdPolBal;

loadBalances();
async function loadBalances() {
  //baseTokens
  ethBal = await ethProvider.getBalance(ethWallet.address);
  gnoBal = await gnosisProvider.getBalance(gnoWallet.address);
  polBal = await polygonProvider.getBalance(polWallet.address);

  //chdTokens
  chdEthBal = await ethCHD.balanceOf(ethWallet.address);
  chdGnoBal = await gnoCHD.balanceOf(gnoWallet.address);
  chdPolBal = await polCHD.balanceOf(polWallet.address);
}

$("#bridgeButton").on("click", () => {
  if (
    document.getElementById("amount").value == 0 ||
    isNaN(document.getElementById("amount").value) || document.getElementById("amount").value < 0 
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

let newUTXOs = [];
let changeUTXOs = [];
let utxoAmount = BigNumber.from(0);

async function prepareSend(_cUTXOs, _chain) {
  let _amount = $("#amount").val();
  let _fromNetwork = fromNetworkSelect.value;
  let _privAmount;

  newUTXOs = [];
  changeUTXOs = [];

  if (_fromNetwork === "ethereum") {
    _privAmount = peVal;
  } else if (_fromNetwork === "gnosis") {
    _privAmount = pgVal;
  } else if (_fromNetwork === "polygon") {
    _privAmount = ppVal;
  }

  if (_privAmount < parseInt(_amount)) {
    alert(`Not enough private balance on ${_fromNetwork}!`);
    return;
  } else {
    for (let jj = 0; jj < _cUTXOs.length; jj++) {
      if (utxoAmount.gte(BigNumber.from(_amount))) {
        break;
      }
      let tUtxo = new Utxo({
        amount: _cUTXOs[jj].amount,
        myHashFunc: poseidon,
        keypair: myKeypair,
        blinding: _cUTXOs[jj].blinding,
        index: parseInt(_cUTXOs[jj].index.hex),
        chainID: _cUTXOs[jj].chainID,
        commitment: _cUTXOs[jj].commitment,
        nullifier: _cUTXOs[jj].nullifier,
      });
      newUTXOs.push(tUtxo);

      utxoAmount = utxoAmount.add(_cUTXOs[jj].amount);
    }

    if (utxoAmount.gt(BigNumber.from(_amount))) {
      changeUTXOs.push(
        new Utxo({
          amount: utxoAmount.sub(BigNumber.from(_amount)),
          myHashFunc: poseidon,
          keypair: myKeypair,
          chainID: _chain,
        })
      );
    }
  }
}

async function bridge() {
  myKeypair = new Keypair({
    privkey: process.env.PRIVATE_KEY,
    myHashFunc: poseidon,
  }); // contains private and public keys
  builtPoseidon = await buildPoseidon();
  const _fromNetwork = fromNetworkSelect.value;
  const _toNetwork = toNetworkSelect.value;
  const _amount = ethers.utils.parseEther(
    document.getElementById("amount").value
  );
  const _isChd = tokenSelect.value === "CHD" ? true : false;
  try {
    if (_fromNetwork === "ethereum") {
      if (_toNetwork === "gnosis") {
        // await prepareSend(ethUTXOs);
        prepareTransaction({
          charon: ethCharon,
          inputs: [],
          outputs: [
            new Utxo({
              amount: _amount,
              myHashFunc: poseidon,
              chainID: 10200,
              keypair: myKeypair,
            }),
          ],
          privateChainID: 10200,
          myHasherFunc: poseidon,
          myHasherFunc2: poseidon2,
        }).then(async function (inputData) {
          let _outAmount = await ethCharon.calcInGivenOut(
            await ethCharon.recordBalance(),
            await ethCharon.recordBalanceSynth(),
            _amount,
            0
          );
          _isChd
            ? await ethCHD.approve(ethCharon.address, _outAmount)
            : await ethBaseToken.approve(ethCharon.address, _outAmount);
          ethCharon
            .depositToOtherChain(
              inputData.args,
              inputData.extData,
              _isChd,
              ethers.utils.parseEther("999999"),
              { gasLimit }
            )
            .then((result) => {
              console.log(result);
              window.alert("Bridged to Gnosis Chain!");
              loader.style.display = "none";
              text.style.display = "inline";
              button.disabled = false;
            });
        });
      } else if (_toNetwork === "polygon") {
        // await prepareSend(ethUTXOs);
        await prepareTransaction({
          charon: polCharon,
          inputs: [],
          outputs: [
            new Utxo({
              amount: _amount,
              myHashFunc: poseidon,
              chainID: 80001,
              keypair: myKeypair,
            }),
          ],
          privateChainID: 80001,
          myHasherFunc: poseidon,
          myHasherFunc2: poseidon2,
        }).then(async function (inputData) {
          let _outAmount = await ethCharon.calcInGivenOut(
            await ethCharon.recordBalance(),
            await ethCharon.recordBalanceSynth(),
            _amount,
            0
          );
          _isChd
            ? await ethCHD.approve(ethCharon.address, _outAmount)
            : await ethBaseToken.approve(ethCharon.address, _outAmount);
          ethCharon
            .depositToOtherChain(
              inputData.args,
              inputData.extData,
              _isChd,
              ethers.utils.parseEther("999999"),
              { gasLimit }
            )
            .then((result) => {
              console.log(result);
              window.alert("Bridged to Polygon!");
              loader.style.display = "none";
              text.style.display = "inline";
              button.disabled = false;
            });
        });
      }
    }
    if (_fromNetwork === "gnosis") {
      if (_toNetwork === "ethereum") {
        // await prepareSend(gnoUTXOs);
        prepareTransaction({
          charon: gnoCharon,
          inputs: [],
          outputs: [
            new Utxo({
              amount: _amount,
              myHashFunc: poseidon,
              chainID: 5,
              keypair: myKeypair,
            }),
          ],
          privateChainID: 5,
          myHasherFunc: poseidon,
          myHasherFunc2: poseidon2,
        }).then(async function (inputData) {
          let _outAmount = await gnoCharon.calcInGivenOut(
            await gnoCharon.recordBalance(),
            await gnoCharon.recordBalanceSynth(),
            _amount,
            0
          );
          _isChd
            ? await gnoCHD.approve(gnoCharon.address, _outAmount)
            : await gnoBaseToken.approve(gnoCharon.address, _outAmount);
          gnoCharon
            .depositToOtherChain(
              inputData.args,
              inputData.extData,
              _isChd,
              ethers.utils.parseEther("999999"),
              { gasLimit }
            )
            .then((result) => {
              console.log(result);
              window.alert("Bridged to Ethereum!");
              loader.style.display = "none";
              text.style.display = "inline";
              button.disabled = false;
            });
        });
      } else if (_toNetwork === "polygon") {
        window.alert("Cannot bridge to polygon from gnosis");
        loader.style.display = "none";
        text.style.display = "inline";
        button.disabled = false;
      }
    }
    if (_fromNetwork === "polygon") {
      if (_toNetwork === "ethereum") {
        await prepareSend(polUTXOs, 5);
        prepareTransaction({
          charon: polCharon,
          inputs: newUTXOs,
          outputs: changeUTXOs,
          privateChainID: 5,
          myHasherFunc: poseidon,
          myHasherFunc2: poseidon2,
        }).then(async function (inputData) {
          let _outAmount = await polCharon.calcInGivenOut(
            await polCharon.recordBalance(),
            await polCharon.recordBalanceSynth(),
            _amount,
            0
          );
          _isChd
            ? await polCHD.approve(polCharon.address, _outAmount)
            : await polBaseToken.approve(polCharon.address, _outAmount);
          polCharon
            .depositToOtherChain(
              inputData.args,
              inputData.extData,
              _isChd,
              ethers.utils.parseEther("999999"),
              { gasLimit }
            )
            .then((result) => {
              console.log(result);
              window.alert("Bridged to Ethereum!");
              loader.style.display = "none";
              text.style.display = "inline";
              button.disabled = false;
            });
        });
        // }
      } else if (_toNetwork === "gnosis") {
        window.alert("cannot bridge to gnosis from polygon!");
        loader.style.display = "none";
        text.style.display = "inline";
        button.disabled = false;
      }
    }
  } catch (err) {
    window.alert("Transaction failed, check console for more info.");
    loader.style.display = "none";
    text.style.display = "inline";
    button.disabled = false;
    console.log(err);
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
