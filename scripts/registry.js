const fs = require("fs");
const contents = fs.readFileSync("utxos.txt", "utf-8");
const utxos = JSON.parse(contents);
const ethers = require("ethers");
const { Keypair } = require("../src/keypair");
const {
    abi: regABI,
} = require("../artifacts/contracts/Registry.sol/Registry.json");
const {
    sepoliaWallet,
    mumbaiWallet,
    chiadoWallet,
    gnosisWallet,
    polygonWallet,
    optimismWallet,
} = require("../src/providers");
const { buildPoseidon } = require("circomlibjs");
let builtPoseidon;
const isTestnet = process.env.IS_TESTNET === "true";

function poseidon(inputs) {
    let val = builtPoseidon(inputs);
    return builtPoseidon.F.toString(val);
}

buildPoseidon().then(function (res) {
    builtPoseidon = res;
});
document.getElementById("pubKey").value = utxos.publicKey.substring(0, 50) + "...";

const dropdownMenu = document.querySelector('.dropdown-menu');
const optionsMenu = document.querySelector('#optionsMenu');

function getRegistry() {
    const selectedNetwork = optionsMenu.textContent;

    if (selectedNetwork === 'chiado') {
        return new ethers.Contract(process.env.CHIADO_REGISTRY, regABI, chiadoWallet);
    }
    else if (selectedNetwork === 'mumbai') {
        return new ethers.Contract(process.env.MUMBAI_REGISTRY, regABI, mumbaiWallet);
    }
    else if (selectedNetwork === 'sepolia') {
        return new ethers.Contract(process.env.SEPOLIA_REGISTRY, regABI, sepoliaWallet);
    }
    else if (selectedNetwork === 'gnosis chain') {
        return new ethers.Contract(process.env.GNOSIS_REGISTRY, regABI, gnosisWallet);
    }
    else if (selectedNetwork === 'polygon') {
        return new ethers.Contract(process.env.POLYGON_REGISTRY, regABI, polygonWallet);
    }
    else if (selectedNetwork === 'optimism') {
        return new ethers.Contract(process.env.OPTIMISM_REGISTRY, regABI, optimismWallet);
    }
}

const registerButton = document.getElementById("register");
registerButton.onclick = function () {
    const registry = getRegistry();
    try {
        registerButton.disabled = true;
        registry.register(utxos.publicKey).then((tx) => {
            console.log(tx);
            window.alert("Transaction sent with hash: " + tx.hash);
            registerButton.disabled = false;
        });
    } catch (err) {
        registerButton.disabled = false;
        console.log(err)
        window.alert("Transaction failed with error: " + err);
    };
};

const convertButton = document.getElementById("convert");
convertButton.onclick = function () {
    privateKey = document.getElementById("privateKey").value;
    if (privateKey.length != 66) {
        window.alert("Please enter a valid private key in hex format of length 66");
        return;
    }
    const myKeyPair = new Keypair({
        privkey: privateKey,
        myHashFunc: poseidon,
    });
    myKeyPair.address().then((address) => {
        document.getElementById("publicKey").value = address;
    });
};
function checkIsRegistered() {
    dropdownMenu.classList.remove('show')
    const registry = getRegistry();
    if (registerButton.textContent == "submit")
        registerButton.disabled = true
    registry.getPublicKey(isTestnet ? sepoliaWallet.address : gnosisWallet.address).then((publicKey) => {
        let publicKeyIsRegistered = false;
        publicKey == utxos.publicKey ? (publicKeyIsRegistered = true) : (publicKeyIsRegistered = false);
        if (publicKeyIsRegistered) {
            document.getElementById("checker").classList.remove("d-none");
            document.getElementById("checkmark").classList.remove("d-none");
            registerButton.classList.remove("d-none");
            registerButton.textContent = "registered";
        } else {
            registerButton.textContent = "submit";
            registerButton.classList.remove("d-none");
            registerButton.disabled = false;
            document.getElementById("checker").classList.add("d-none");
            document.getElementById("checkmark").classList.add("d-none");
        }
    });
}

const testNetworkOptions = ['chiado', 'mumbai', 'sepolia']
const mainNetworkOptions = ['gnosis chain', 'polygon', 'optimism']
function setNetworkOptions() {
    dropdownMenu.innerHTML = '';

    const options = isTestnet ? testNetworkOptions : mainNetworkOptions;
    const defaultOption = isTestnet ? 'sepolia' : 'gnosis chain';

    options.forEach(option => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.classList.add('dropdown-item');
        a.style.display = 'block';
        a.style.width = '100%';
        a.href = '#';
        a.textContent = option;
        li.appendChild(a);
        dropdownMenu.appendChild(li);

        if (option === defaultOption) {
            a.classList.add('disabled');
            optionsMenu.textContent = option;
        }
    });
}

dropdownMenu.addEventListener('click', (event) => {
    if (event.target.tagName !== 'A') return;  // Add to prevent event handling for non-<a> elements

    if (event.target.classList.contains('disabled')) {
        event.preventDefault();
    } else {
        const selectedOption = event.target.textContent;
        optionsMenu.textContent = selectedOption;
        const allOptions = dropdownMenu.querySelectorAll('.dropdown-item');
        allOptions.forEach(option => {
            if (option.textContent === selectedOption) {
                option.classList.add('disabled');
            } else {
                option.classList.remove('disabled');
            }
        });
    }
    checkIsRegistered();
});

setNetworkOptions()
checkIsRegistered();




