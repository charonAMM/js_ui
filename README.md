## charon local ui

This UI allows you to interact with charon contracts in a completely local fashion (no web browser).  In order to gain complete privacy, be sure to run your own nodes.

## setting up

requirements / dependencies
  - node
  - npm

```
git clone https://www.github.com/charonAMM/js_ui
cd js_ui
```

create .env file in folder with node URL's and private key.  Follow the .env.example

```sh
npm i
npm run start
```

## workflow

#### registering (home)

welcome to the charon UI!

hopefully you set up your env file correctly. Now you can look at your address and your balances on each network.  If you're using CHD for payments (e.g. recieving them), you'll want to register your public key (we use custom public keys (poseidonHash of your key)), so people know what your charon address is.  If you don't want to register no worries.  

#### chd

this is the main screen.  This is your balance of CHD (public and private) on each network.  You can either click "send" to transfer the chd (privately or publicly depending on what you have), or click 'bridge' to create more chd.  To create chd, you deposit the base token (e.g. wrapped xdai on gnosis) with a zk proof to another chain.  The tellor oracle passes the proof to the other chain (e.g. polygon) and then you wait 12 hours (i know it's long, but it ensures security and privacy) and there will be an oracleDeposit on the other chains (no one knows which chain you went to).  Now you should see the private balance go up and you can transfer it around!  Note that to send private chd to someone, you will need thier publicKey, which you can create in the home screen or find someoneles in the registry.  

#### trade

this screen lets you swap tokens for chd or chd for tokens (wrapped native tokens on Optimism, Polygon, or Gnosis).  Under the hood it works very similar to other AMM's (balancer, uniswap, etc.).  The only difference from a trading perspective is that when swapping CHD for a token, it does not follow the standard curve.  Since CHD is always backed by a deposit, the chd is burned (rather than being deposited to the other side) when tokens are withdrawn form the pools.

#### auction

this screen allows you to bid on the CIT token.  As per the [specs](https://github.com/charonAMM/writings/blob/main/Charon%20Tokenomics.pdf), there is a weekly auction where 10,000 CIT tokens are minted.  The auction is on GnosisChain and takes wXdai as the token.  All proceeds are placed into the system as rewards for running various functions.

#### cit

this allows you to claim rewards that have been distributed on each chain using your cit balance.  
Note, the implementation is still in the works.  Look in the monorepo or incentiveToken repo for manual (non-UI) ways to claim. 



## donations

evm chains - 0x92683a09B64148369b09f96350B6323D37Af6AE3
