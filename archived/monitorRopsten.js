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
  RPC_URL_ROPSTEN_WSS,
  TOKEN_ADDRESS,
  TOKEN_OWNER_PRIVATE_KEY,
  TOKEN_OWNER_ACCOUNT,
  BUYER_PRIVATE_KEY,
  BUYER_ACCOUNT,
} = process.env;

async function initialize() {
  //Initialize web3
  chainId = ChainId.ROPSTEN;
  provider = new ethers.providers.getDefaultProvider("ropsten", {
     etherscan: "K8G82VJYDPCHJ1FBGRJ3YEMJ6RK6JUC998",
     infura: {
       projectId: "9812b16a1c4b4334b8783d03772befd9",
       projectSecret: "2e6da67b4b4347988f4686f8455b60ad"
     },
  });
  web3 = new Web3(RPC_URL_ROPSTEN_WSS);
  //initialize token
  token = await Fetcher.fetchTokenData(chainId, TOKEN_ADDRESS, provider);
  weth = WETH[chainId];

  Common.set({ provider, weth, token, web3 });

  tokenOwnerAccount = new Account(TOKEN_OWNER_ACCOUNT, TOKEN_OWNER_PRIVATE_KEY);
  buyerAccount = new Account(BUYER_ACCOUNT, BUYER_PRIVATE_KEY);
}

async function startListening() {
  console.log("Listening...");
  subscription = web3.eth
    .subscribe("pendingTransactions", function (error, result) {})
    .on("data", function (transactionHash, x, y) {
      async function getTransactionData() {
        let transaction = null;
        let retryCount = -1;
        const startTime = Date.now();
        while (transaction === null) {
          transaction = await web3.eth.getTransaction(transactionHash);
          retryCount++;
        }
        parseTransactionData(transaction);
      }
      getTransactionData();
    });
}
async function parseTransactionData(transaction) {
  let transactionInput = transaction.input;
  const trxMethod = transactionInput.toLowerCase().substring(0, 10);
  if (trxMethod === "0xf305d719") {    // addLiquidityETH
    const token = transactionInput.toLowerCase().substring(34, 74);
    if (token === TOKEN_ADDRESS.toLowerCase().substring(2, TOKEN_ADDRESS.length)) {
      const decodedData = abiDecoder.decodeMethod(transactionInput);
      buyerAccount.swapExactETHForTokensOnInitialAddLiquidity(
        decodedData,
        transaction
      );
    }
  }
}

async function run() {
  await initialize();
  startListening();
  setTimeout(() => tokenOwnerAccount.addLiquidityETH("0.0001"), 5000);
  setInterval(() => tokenOwnerAccount.addLiquidityETH("0.0001"), 3*60000);
}

run();