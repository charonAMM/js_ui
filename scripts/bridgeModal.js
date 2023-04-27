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
let changeUTXOs = []

$('#bridgeButton').on('click', () => {
  bridge()
});

function poseidon2(a,b){
  return poseidon([a,b])
  }

function poseidon(inputs){
  let val = builtPoseidon(inputs)
  return builtPoseidon.F.toString(val)
}

async function prepareSend( _chain){
  let _amount = $('#toAmount').val()
  if(ethers.utils.parseEther(m.ppVal.toString()) < parseInt(_amount)){
     alert("not enough private balance on mumbai!!")
  }
  else{
        changeUtxos.push(new Utxo({
         amount: _amount,
         myHashFunc: poseidon,
         keypair: myKeypair,
         chainID: _chain
       }))
  }
}

function bridge() {
  const fromNetwork = fromNetworkSelect.value;
  const toNetwork = toNetworkSelect.value;
  const amount = document.getElementById("amount").value;

  if (fromNetwork === "ethereum") {
    if (toNetwork === "gnosis") {
      await prepareSend(10200);
      if(changeUTXOs > 0){
         prepareTransaction({
            charon: gnohCharon,
            inputs: 
            outputs: changeUtxos,
            recipient: _adjTo,
            privateChainID: 10200,
            myHasherFunc: poseidon,
            myHasherFunc2: poseidon2
         }).then(function(inputData){
            ethCharon.transact(inputData.args,inputData.extData).then((result) => console.log(result));
         })
      }
      window.alert("Bridged to Gnosis!")
    } else if (toNetwork === "polygon") {
      await prepareSend(80001);
      if(changeUTXOs > 0){
         prepareTransaction({
            charon: polCharon,
            inputs: 
            outputs: changeUtxos,
            privateChainID: 80001,
            myHasherFunc: poseidon,
            myHasherFunc2: poseidon2
         }).then(function(inputData){
            ethCharon.transact(inputData.args,inputData.extData).then((result) => console.log(result));
         })
      }
      window.alert("Bridged to Polygon!")
    }
  }
  if (fromNetwork === "gnosis") {
    if (toNetwork === "ethereum") {
      await prepareSend(5);
      if(changeUTXOs > 0){
         prepareTransaction({
            charon: ethCharon,
            outputs: changeUtxos,
            privateChainID: 5,
            myHasherFunc: poseidon,
            myHasherFunc2: poseidon2
         }).then(function(inputData){
          let _outAmount = await ethcharon.calcInGivenOut(await ethCharon.recordBalance(),
                                                    await ethCharon.recordBalanceSynth(),
                                                    _amount,
                                                    0)
            await baseToken.approve(ethCharon.address,_outAmount)
            ethCharon.depositToOtherChain(inputData.args,inputData.extData,false,_amount).then((result) => console.log(result));
         })
      }
      window.alert("Bridged to Ethereum!")
    } else if (toNetwork === "polygon") {
      window.alert("Cannot bridge to polygon from gnosis")
    }
  }
  if (fromNetwork === "polygon") {
    if (toNetwork === "ethereum") {
      await prepareSend(5);
      if(changeUTXOs > 0){
         prepareTransaction({
            charon: polCharon,
            outputs: changeUtxos,
            privateChainID: 5,
            myHasherFunc: poseidon,
            myHasherFunc2: poseidon2
         }).then(function(inputData){
          let _outAmount = await polcharon.calcInGivenOut(await polCharon.recordBalance(),
                                                    await polCharon.recordBalanceSynth(),
                                                    _amount,
                                                    0)
            await baseToken.approve(polCharon.address,_outAmount)
            polCharon.depositToOtherChain(inputData.args,inputData.extData,false,_amount).then((result) => console.log(result));
         })
      }
      window.alert("Bridged to Ethereum!")
    } else if (toNetwork === "gnosis") {
      //magic
      window.alert("cannot bridg eto gnosis from polygon!")
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

