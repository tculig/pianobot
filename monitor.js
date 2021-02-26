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
  //initialize token
  token = await Fetcher.fetchTokenData(chainId, TOKEN_ADDRESS, provider);
  weth = WETH[chainId];

  //Initialize accounts
  //initialize the static variables
  Common.set({ provider, weth, token, web3 });

  tokenOwnerAccount = new Account(TOKEN_OWNER_ACCOUNT, TOKEN_OWNER_PRIVATE_KEY);
  buyerAccount = new Account( BUYER_ACCOUNT, BUYER_PRIVATE_KEY);
}

async function startListening() {
  console.log("Listening...")
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
let count = 0;
async function parseTransactionData(transaction) {
  let transactionInput = transaction.input;
  fs.appendFileSync("transactionDetails.txt", "Pending transaction "+Date.now()+"\n"+JSON.stringify(transaction)+"\n");
  const trxMethod = transactionInput.toLowerCase().substring(0,10);
  if (trxMethod === "0xf305d719"){ // addLiquidityETH
    const token = transactionInput.toLowerCase().substring(34,74);
   // console.log(token)
    //console.log(TOKEN_ADDRESS.toLowerCase().substring(2,TOKEN_ADDRESS.length))
    if (token === TOKEN_ADDRESS.toLowerCase().substring(2,TOKEN_ADDRESS.length)){
      //buyerAccount.swapExactETHForTokens();
      count++;
      console.log("Found it "+count+" "+Date.now())
      fs.appendFileSync("transactionDetails.txt", "Detected addLiquidityETH "+Date.now()+" "+JSON.stringify(transaction)+"\n");
      const decodedData = abiDecoder.decodeMethod(transactionInput);
     // buyerAccount.swapExactETHForTokensOnInitialAddLiquidity(decodedData, transaction);
     // buyerAccount.swapExactETHForTokens(decodedData, transaction);

    }
  }
  if (trxMethod === "0x7ff36ab5"){ // swapExactETHForTokens
    console.log("Pending swapExactETHForTokens")
    const token = transactionInput.toLowerCase().substring(418,transactionInput.length);
    if (token === TOKEN_ADDRESS.toLowerCase().substring(2,TOKEN_ADDRESS.length)){
      //buyerAccount.swapExactETHForTokens();
      //const decodedData = abiDecoder.decodeMethod(transactionInput);
      //buyerAccount.swapExactETHForTokens(decodedData, transaction);
      fs.appendFileSync("transactionDetails.txt", "Detected swapExactETHForTokens "+Date.now()+" "+JSON.stringify(transaction)+"\n");
    }
  }
}

async function run() {
  await initialize();
  startListening();
}

run();