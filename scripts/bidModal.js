let $ = require('jquery')
console.log("bidModal.js loaded");

$('#signAndBid').on('click', () => {
    console.log("sign and bid clicked")
    if ($('#bidAmount').val() > $('#topBid').text()) {
    //    ethCIT.bid().then((result) => console.log(result));
    }
    else {
       console.log("bid too low")
    }
 })

 $('bidAmount').on('input', () => {
    console.log("here")
 })
 