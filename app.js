var App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  accounts: [],
  contestAddress: "0xA4eA8E6Cf12a23C6c923b3B9d2a679E0206C7ffc",
  tokenAddress: "0x44Bd2aEF4399babd23Cec8851D235475902b705C",
  web3,
  wager: 0,
  protocolFee: 0,
  startTime: 0,
  endTime: 0,
  tokenDecimals: 0,
  timeLeftToRegister: 0,
  timeLeftInContest: 0,

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== "undefined") {
      console.log("Using web3 detected from external source like Metamask");
      App.web3Provider = window.ethereum;
      web3 = new Web3(window.ethereum);
    } else {
      console.log("Using localhost");
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
    return App.initEth();
  },

  initEth: function () {
    ethereum
      .request({ method: "eth_requestAccounts" })
      .then(function (accounts) {
        console.log("Ethereum enabled");
        App.account = accounts[0];
        console.log("In initEth: " + App.account);
        web3.eth.getChainId().then(function (result) {
          console.log("Chain ID: " + result);
        });
        return App.initContestContract();
      });
  },

  initContestContract: function () {
    var pathToAbi = "./abis/TheContest.json";
    $.getJSON(pathToAbi, function (abi) {
      App.contracts.Contest = new web3.eth.Contract(abi);
      App.contracts.Contest.options.address = App.contestAddress;
      console.log("Contract initialized");
      console.log("Contract address: " + App.contracts.Contest.options.address);
      return App.initTokenContract();
    });
  },

  initTokenContract: function () {
    var pathToAbi = "./abis/ERC20.json";
    $.getJSON(pathToAbi, function (abi) {
      App.contracts.Token = new web3.eth.Contract(abi);
      App.contracts.Token.options.address = App.tokenAddress;
      console.log("Token contract initialized");
      console.log(
        "Token contract address: " + App.contracts.Token.options.address
      );
      return App.getStartTime();
    });
  },

  getStartTime: function () {
    App.contracts.Contest.methods
      .startDeadline()
      .call()
      .then(function (result) {
        // Define the Unix timestamp (in seconds)
        let timestampInMilliseconds = result * 1000;

        // Create a new Date object and use the .getTime() method to set the time
        const date = new Date();
        date.setTime(timestampInMilliseconds);

        // Use the .toString() method to convert the date to a human-readable string
        const dateString = date.toString();

        console.log(dateString); // Outputs: "Sun Jan 17 2021 12:00:00 GMT+0000 (Greenwich Mean Time)"
        document.getElementById("contestStartTime").innerHTML = dateString;
        timeLeftToRegister = result - Math.floor(Date.now() / 1000);
        // get time left to register in hours
        timeLeftToRegister = timeLeftToRegister / 3600;
        console.log("timeLeftToRegister: " + timeLeftToRegister + " hours")
        App.timeLeftToRegister = timeLeftToRegister;
        if (timeLeftToRegister < 0) {
          timeLeftToRegister = "Contest has started";
          document.getElementById("register").disabled = true;
          document.getElementById("approve").disabled = true;
          document.getElementById("claimLoserButton").disabled = false;
        }
        document.getElementById("timeLeftToRegister").innerHTML =
          timeLeftToRegister;
        return App.getEndTime();
      });
  },

  getEndTime: function () {
    App.contracts.Contest.methods
      .endDeadline()
      .call()
      .then(function (result) {
        // Define the Unix timestamp (in seconds)
        let timestampInMilliseconds = result * 1000;

        // Create a new Date object and use the .getTime() method to set the time
        const date = new Date();
        date.setTime(timestampInMilliseconds);

        // Use the .toString() method to convert the date to a human-readable string
        const dateString = date.toString();

        console.log(dateString); // Outputs: "Sun Jan 17 2021 12:00:00 GMT+0000 (Greenwich Mean Time)"
        document.getElementById("contestEndTime").innerHTML = dateString;
        timeLeftInContest = result - Math.floor(Date.now() / 1000);
        // get time left in contest in days
        timeLeftInContest = timeLeftInContest / 86400;
        App.timeLeftInContest = timeLeftInContest;
        if (timeLeftInContest < 0) {
          timeLeftInContest = "Contest has ended";
          document.getElementById("claimFundsButton").disabled = false;
        }
        if (App.timeLeftToRegister > 0) {
          timeLeftInContest = "Contest has not started";
        }
        document.getElementById("timeLeftInContest").innerHTML =
          timeLeftInContest;
        return App.getTokenDecimals();
      });
  },

  getTokenDecimals: function () {
    App.contracts.Token.methods
      .decimals()
      .call()
      .then(function (result) {
        App.tokenDecimals = result;
        return App.getWager();
      });
  },

  getWager: function () {
    App.contracts.Contest.methods
      .wager()
      .call()
      .then(function (result) {
        App.wager = result;
        console.log("Wager: " + App.wager);
        let wagerInEth = BigInt(App.wager) / BigInt(10 ** App.tokenDecimals);
        let wagerInEthString = wagerInEth.toString() + " USDC";
        document.getElementById("wager").innerHTML = wagerInEthString;
        App.wager = result;
        return App.getProtocolFee();
      });
  },

  getProtocolFee: function () {
    App.contracts.Contest.methods
      .protocolFee()
      .call()
      .then(function (result) {
        App.protocolFee = result;
        let ownerFeeInEth =
          BigInt(App.protocolFee) / BigInt(10 ** App.tokenDecimals);
        let ownerFeeInEthString = ownerFeeInEth.toString() + " USDC";
        document.getElementById("protocolFee").innerHTML = ownerFeeInEthString;
        return App.setPageParams();
      });
  },

  setPageParams: function () {
    document.getElementById("contestAddress").innerHTML = App.contestAddress;
    document.getElementById("connectedAddress").innerHTML = App.account;
    App.getTokenBalance();
  },

  approve: function () {
    console.log("approved!");
    approvalAmount = BigInt(App.wager) + BigInt(App.protocolFee);
    console.log("approvalAmount: " + approvalAmount);
    App.contracts.Token.methods
      .approve(App.contestAddress, approvalAmount)
      .send({ from: App.account })
      .then(function (result) {
        console.log(result);
      });
  },

  register: function () {
    twitterHandle = document.getElementById("twitterHandle").value;
    console.log("twitterHandle: " + twitterHandle);
    App.contracts.Contest.methods
      .register(twitterHandle)
      .send({ from: App.account })
      .then(function (result) {
        console.log(result);
        App.getTokenBalance();
      });
  },

  claimLoser: function () {
    losingOracleIndex = document.getElementById("oracleIndex").value;
    App.contracts.Contest.methods
      .claimLoser(Number(losingOracleIndex))
      .send({ from: App.account })
      .then(function (result) {
        console.log(result);
      });
  },

  claimFunds: function () {
    App.contracts.Contest.methods
      .claimFunds()
      .send({ from: App.account })
      .then(function (result) {
        console.log(result);
        document.getElementById("claimFundsButton").disabled = true;
        document.getElementById("claimFundsResult").innerHTML = "Claimed!";
  })
},

  getTokenBalance: function () {
    App.contracts.Token.methods
      .balanceOf(App.account)
      .call()
      .then(function (result) {
        let tokenBalance = BigInt(result) / BigInt(10 ** App.tokenDecimals);
        let tokenBalanceString = tokenBalance.toString() + " USDC";
        document.getElementById("tokenBalance").innerHTML = tokenBalanceString;
      });
  },
};

$(function () {
  $(window).load(function () {
    document.getElementById("connectButton").disabled = false;
    // App.init();
  });
});
