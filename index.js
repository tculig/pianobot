require("dotenv").config();
const Tx = require("ethereumjs-tx");
const Web3 = require("web3");
const {
  ChainId,
  Fetcher,
  WETH,
  Route,
  Trade,
  TokenAmount,
  TradeType,
  Percent,
} = require("@uniswap/sdk");
const ethers = require("ethers");
const abiDecoder = require("abi-decoder");
const exchangeABI = require("./abi").exchangeABI;
const Account = require('./account.js').Account;

abiDecoder.addABI(exchangeABI);

let provider;
let web3;
let chainId;
let tokenOwnerAccount;
let buyerAccount;

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

function initialize() {
  //Initialize web3
  if (USE_TEST_NETWORK) {
    chainId = ChainId[TEST_NETWORK_CHAIN_ID];
    let providerName = TEST_NETWORK_CHAIN_ID.toLowerCase();
    if (TEST_NETWORK_CHAIN_ID == "GÖRLI") providerName = "goerli";
    provider = new ethers.providers.getDefaultProvider(
      providerName,
      RPC_URL_TEST
    );
    web3 = new Web3(RPC_URL_TEST_WSS);
  } else {
    chainId = ChainId.MAINNET;
    provider = new ethers.providers.getDefaultProvider(
      "mainnet",
      RPC_URL_MAINNET
    );
    web3 = new Web3(RPC_URL_MAINNET_WSS);
  }

  //Initialize accounts
  tokenOwnerAccount = new Account(TOKEN_OWNER_ACCOUNT, TOKEN_OWNER_PRIVATE_KEY, provider);
  buyerAccount = new Account(BUYER_ACCOUNT, BUYER_PRIVATE_KEY, provider);
}

async function startListening() {
  subscription = web3.eth
    .subscribe("pendingTransactions", function (error, result) {})
    .on("data", function (transactionHash) {
      web3.eth
        .getTransaction(transactionHash)
        .then(function (transaction) {
          if (transaction) {
            parseTransactionData(transaction);
          }
        })
        .catch((error) => {
          console.log("API lagging...");
          console.error(error);
        });
    });
}

async function parseTransactionData(transaction) {
    console.log(transaction);
}

initialize();
startListening();
