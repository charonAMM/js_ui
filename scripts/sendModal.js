let $ = require('jquery')
console.log("sendModal.js loaded");


$('#signAndSend').on('click', () => {
    console.log("sending")
    send()
    console.log("sent")
  })

  function send() {
    console.log("here")
    let _to = $('#toAddy').val()
    let _amount = $('#toAmount').val()
    let _network = $('input[name="netType"]:checked').val();
    // let _visType = $('input[name="visType"]:checked').val();
    let _visType = $('#txType-switch').prop('checked') ? 'private' : 'public';
    console.log(_network, _visType)
    console.log("to: ", _to, "amount ", _amount)
    // if (_visType == "visible") {
    //    if (_network == "ethereum") {
    //       ethCHD.transfer(_to, _amount).then((result) => console.log(result));;
    //       console.log("sent")
    //    }
    //    else if (_network == "gnosis") {
    //       gnoCHD.transfer(_to, _amount).then((result) => console.log(result));
    //    }
    //    else if (_network == "polygon") {
    //       polCHD.transfer(_to, _amount).then((result) => console.log(result));
    //    }
    // }
    // else {
    //    if (_network == "ethereum") {
    //       console.log("private send eth")
    //    }
    //    else if (_network == "gnosis") {
    //       console.log("private send gno")
    //    }
    //    else if (_network == "polygon") {
    //       console.log("private send pol")
    //    }
    // }
 
 }

