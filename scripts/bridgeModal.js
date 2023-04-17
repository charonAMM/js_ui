let $ = require('jquery')
console.log("bridgeModal.js loaded");

const fromNetworkSelect = document.getElementById("from");
const toNetworkSelect = document.getElementById("to");

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

