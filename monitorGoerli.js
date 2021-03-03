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
let storageAccount;
let token;
let weth;
const {
  RPC_URL_MAINNET,
  RPC_URL_MAINNET_WSS,
  RPC_URL_GOERLI_WSS,
  TOKEN_ADDRESS,
  TOKEN_OWNER_PRIVATE_KEY,
  NEW_TOKEN_ACCOUNT,
  NEW_TOKEN_PRIVATE_KEY,
  TOKEN_OWNER_ACCOUNT,
  BUYER_PRIVATE_KEY,
  BUYER_ACCOUNT,
  BUYER2_PRIVATE_KEY,
  BUYER2_ACCOUNT,
  BUYER3_PRIVATE_KEY,
  BUYER3_ACCOUNT,
  STORAGE_PRIVATE_KEY,
  STORAGE_ACCOUNT,
} = process.env;

async function initialize() {
  //Initialize web3
  chainId = ChainId.GÖRLI;
  //chainId = ChainId.MAINNET;
  provider = new ethers.providers.getDefaultProvider("goerli", {
     etherscan: "K8G82VJYDPCHJ1FBGRJ3YEMJ6RK6JUC998",
     infura: {
       projectId: "9812b16a1c4b4334b8783d03772befd9",
       projectSecret: "2e6da67b4b4347988f4686f8455b60ad"
     },
  });
  web3 = new Web3(RPC_URL_GOERLI_WSS);
  //web3 = new Web3(RPC_URL_MAINNET_WSS);
  //initialize token
  token = await Fetcher.fetchTokenData(chainId, TOKEN_ADDRESS, provider);
  weth = WETH[chainId];

  Common.set({ provider, weth, token, web3 });

  tokenOwnerAccount = new Account(TOKEN_OWNER_ACCOUNT, TOKEN_OWNER_PRIVATE_KEY);
  newTokenOwnerAccount = new Account(NEW_TOKEN_ACCOUNT, NEW_TOKEN_PRIVATE_KEY);
  buyerAccount = new Account(BUYER_ACCOUNT, BUYER_PRIVATE_KEY);
  buyer2Account = new Account(BUYER2_ACCOUNT, BUYER2_PRIVATE_KEY);
  buyer3Account = new Account(BUYER3_ACCOUNT, BUYER3_PRIVATE_KEY);
  storageAccount = new Account(STORAGE_ACCOUNT, STORAGE_PRIVATE_KEY);
}
let lastBlockTime = Date.now();
let addLiq = false;
async function startListening() {
 
  const newBlockHeaders = web3.eth.subscribe("newBlockHeaders");
  newBlockHeaders.on("data", async (blockHeader) => {
      console.log("block: " + blockHeader["number"] + " - ts: " + blockHeader["timestamp"] + " - received at: " + Math.floor(new Date() / 1000));
      console.log("Block time: "+(Date.now()-lastBlockTime));
      lastBlockTime = Date.now();
      if(!addLiq){
        //setTimeout(() => newTokenOwnerAccount.addLiquidityETH("0.0001"), 1000);
        addLiq=true;
      }
  });
 
  subscription = web3.eth
    .subscribe("pendingTransactions", function (error, result) {})
    .on("data", function (transactionHash) {
      async function getTransactionData() {
        let transaction = null;
        let retryCount = -1;
        const startTime = Date.now();
        while (transaction === null) {
          transaction = await web3.eth.getTransaction(transactionHash);
          retryCount++;
        }
        console.log(transactionHash+" "+Date.now())
        //parseTransactionData(transaction);
      }
      getTransactionData();
    });
    console.log("Listening...");
}
let triggered = false;
async function parseTransactionData(transaction) {
  fs.appendFileSync("transactionDetails.txt", Date.now()+"\n"+JSON.stringify(transaction)+"\n---------------------\n");
  let transactionInput = transaction.input;
  const trxMethod = transactionInput.toLowerCase().substring(0, 10);
  console.log(transaction);
  if (trxMethod === "0xf305d719") {    // addLiquidityETH
    const token = transactionInput.toLowerCase().substring(34, 74);
    if (token === TOKEN_ADDRESS.toLowerCase().substring(2, TOKEN_ADDRESS.length)) {
      const decodedData = abiDecoder.decodeMethod(transactionInput);
      if(!triggered){
        console.log("TIME SINCE BEGINNING OF BLOCK: "+(Date.now()-lastBlockTime));
         buyerAccount.swapExactETHForTokensOnInitialAddLiquidity(decodedData,transaction,0);
         setTimeout(() => buyer2Account.swapExactETHForTokensOnInitialAddLiquidity(decodedData,transaction,1000), 1000);
         setTimeout(() => buyer3Account.swapExactETHForTokensOnInitialAddLiquidity(decodedData,transaction,5000), 5000);
      }
      triggered = true;
    }
  }
}

async function run() {
  await initialize();
  startListening();
  //setTimeout(() => tokenOwnerAccount.addLiquidityETH("0.0001"), 5000);
  //setTimeout(() => newTokenOwnerAccount.addLiquidityETH("0.0001"), 15000);
  // storageAccount.transferToAccount(BUYER_ACCOUNT,"1.1");
  // storageAccount.transferToAccount(BUYER2_ACCOUNT,"1.1");
  // storageAccount.transferToAccount(BUYER3_ACCOUNT,"1.1");
  //storageAccount.transferToAccount(BUYER_ACCOUNT,"0.000511");
  //const nonce = await buyerAccount.getNonce();
  // buyerAccount.swapExactETHForTokensOnInitialAddLiquidity(null, {gasPrice: 20e9}, nonce);
  // buyerAccount.swapExactETHForTokensOnInitialAddLiquidity(null, {gasPrice: 20e9});
  // buyer2Account.swapExactETHForTokensOnInitialAddLiquidity(null, {gasPrice: 20e9});
  // buyer3Account.swapExactETHForTokensOnInitialAddLiquidity(null, {gasPrice: 20e9});
  // setInterval(() => tokenOwnerAccount.addLiquidityETH("0.0001"), 3*60000);

}

run();
