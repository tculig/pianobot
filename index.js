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
  let transactionInput = transaction.input;//{"blockHash":null,"blockNumber":null,"from":"0x4B5794075fBA5051f33473122f730e4fe48839Cd","gas":3017203,"gasPrice":"20000000000","hash":"0x77864ae64d28b308f65bfcd1a9a4ca05c15b59cc6584ca49ccebbd200f0e5dcc","input":"0xf305d71900000000000000000000000083600179a98638d9f92585823261377547275e6200000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000f4240000000000000000000000000000000000000000000000000016345785d8a00000000000000000000000000004b5794075fba5051f33473122f730e4fe48839cd0000000000000000000000000000000000000000000000000000000060492258","nonce":213,"r":"0x36a1a4fabe64668f2a855495a91c45774b7e6c61720eaffe95273892be0d615c","s":"0x930bd802d8e2ddd6c791b6903bd6e0a889c8e528351b63241526726282cdb1f","to":"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D","transactionIndex":null,"v":"0x2d","value":"1100000000000000000"}
  console.log(transaction.input+" /// "+transaction.data);
  if (transactionInput===undefined){
    transactionInput = transaction.data;//{"nonce":212,"gasPrice":{"type":"BigNumber","hex":"0x04a817c800"},"gasLimit":{"type":"BigNumber","hex":"0x2e09f3"},"to":"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D","value":{"type":"BigNumber","hex":"0x0f43fc2c04ee0000"},"data":"0xf305d71900000000000000000000000083600179a98638d9f92585823261377547275e6200000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000f4240000000000000000000000000000000000000000000000000016345785d8a00000000000000000000000000004b5794075fba5051f33473122f730e4fe48839cd00000000000000000000000000000000000000000000000000000000604921b1","chainId":5,"v":46,"r":"0x7c0f0692c2efcb7f36f6a2d1d78453fdcc1fc6663c8ebc9f9ef1bc2c5406e36d","s":"0x3c168a210cacd55577986bdec7f5924427c2e5153cf08ce2bc033d992018fab5","from":"0x4B5794075fBA5051f33473122f730e4fe48839Cd","hash":"0xc942e0d7ffa671a06021f995690378a6031a2ee2e9356b939440cc2194f2eeba"}
  } 
  fs.appendFileSync("transactionDetails.txt", "Pending transaction "+Date.now()+"\n"+JSON.stringify(transaction)+"\n");
  const trxMethod = transactionInput.toLowerCase().substring(0,10);
  if (trxMethod === "0xf305d719"){ // addLiquidityETH
    const token = transactionInput.toLowerCase().substring(34,74);
    console.log(token)
    console.log(TOKEN_ADDRESS.toLowerCase().substring(2,TOKEN_ADDRESS.length))
    if (token === TOKEN_ADDRESS.toLowerCase().substring(2,TOKEN_ADDRESS.length)){
      //buyerAccount.swapExactETHForTokens();
      fs.appendFileSync("transactionDetails.txt", "Detected addLiquidityETH "+Date.now()+" "+JSON.stringify(transaction)+"\n");
      const decodedData = abiDecoder.decodeMethod(transactionInput);
      buyerAccount.swapExactETHForTokensOnInitialAddLiquidity(decodedData, transaction);
      //buyerAccount.swapExactETHForTokens(decodedData, transaction);

    }
  }
  if (trxMethod === "0x7ff36ab5"){ // swapExactETHForTokens
    console.log("swapExactETHForTokens")
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
  setTimeout(() => tokenOwnerAccount.addLiquidityETH("0.1"), 3000);
  //setTimeout(() => tokenOwnerAccount.addLiquidityETH("0.001"), 3000);
  //setTimeout(() => buyerAccount.swapExactETHForTokens(), 3000);
}

run();
