require("dotenv").config();
const Web3 = require("web3");
const { ChainId, Fetcher, WETH } = require("@uniswap/sdk");
const ethers = require("ethers");
const abiDecoder = require("abi-decoder");
const exchangeABI = require("./abi").exchangeABI;
const Account = require("./account.js");
const Common = require("./staticVariables.js");
const fs = require("fs");

abiDecoder.addABI(exchangeABI);

let provider;
let web3;
let chainId;
let tokenOwnerAccount;
let buyerAccount;
let token;
let weth;

const {
  RPC_URL_MAINNET,
  RPC_URL_MAINNET_WSS,
  RPC_URL_TEST,
  RPC_URL_TEST_WSS,
  TOKEN_ADDRESS,
  TOKEN_OWNER_PRIVATE_KEY,
  TOKEN_OWNER_ACCOUNT,
  BUYER_PRIVATE_KEY,
  BUYER_ACCOUNT,
  USE_TEST_NETWORK,
  TEST_NETWORK_CHAIN_ID,
} = process.env;

async function initialize() {
  //Initialize web3
  if (USE_TEST_NETWORK) {
    chainId = ChainId[TEST_NETWORK_CHAIN_ID];
    let providerName = TEST_NETWORK_CHAIN_ID.toLowerCase();
    if (TEST_NETWORK_CHAIN_ID == "GÖRLI") providerName = "goerli";
    provider = new ethers.providers.getDefaultProvider(
      providerName,
     {
      infura: "9812b16a1c4b4334b8783d03772befd9",
     }
    );
    web3 = new Web3(RPC_URL_TEST_WSS);
  } else {
    chainId = ChainId.MAINNET;
    provider = new ethers.providers.getDefaultProvider(
      "mainnet",
      {
        infura: "9812b16a1c4b4334b8783d03772befd9",
      }
    );
    web3 = new Web3(RPC_URL_MAINNET_WSS);
  }
  //initialize token
  token = await Fetcher.fetchTokenData(chainId, TOKEN_ADDRESS, provider);
  weth = WETH[chainId];

  Common.set({ provider, weth, token, web3 });

  tokenOwnerAccount = new Account(TOKEN_OWNER_ACCOUNT, TOKEN_OWNER_PRIVATE_KEY);
}


async function run() {
  await initialize();
  setTimeout(() => tokenOwnerAccount.addLiquidityETH("0.01"), 5000);
}

run();