[![Tests](https://github.com/charonAMM/feeContract/actions/workflows/tests.yml/badge.svg)](https://github.com/charonAMM/feeContract/actions/workflows/tests.ymli)

## charon fee contract

<b>Charon</b> is a privacy enabled cross-chain automated market maker (PECCAMM). This is the fee contract designed to distribute fees garnered from the charon system (amm trading as well as CIT auctions).  It takes both CHD and baseToken (different on each chain) fees and distributes them to four parties based on preset percentages.  These parties are the charon LP's, CIT holders, future chd minters (user rewards), and the oracle (for payment).

For more information, check out the [tokenomics whitepaper](https://github.com/charonAMM/writings/blob/main/Charon%20Tokenomics.pdf)

## setting up and testing

requirements

```
node
npm
```

install electron 
```
npm install -g electron-prebuilt
```

```sh
npm i
npm run start
```

## donations

evm chains - 0x92683a09B64148369b09f96350B6323D37Af6AE3