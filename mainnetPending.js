require("dotenv").config();
const Web3 = require("web3");
const { ChainId } = require("@uniswap/sdk");
const ethers = require("ethers");
const abiDecoder = require("abi-decoder");
const exchangeABI = require("./abi").exchangeABI;
const fs = require("fs");

abiDecoder.addABI(exchangeABI);

let provider;
let web3;
let chainId;
const { RPC_URL_MAINNET_WSS } = process.env;

async function initialize() {
  //Initialize web3
  chainId = ChainId.MAINNET;
  provider = new ethers.providers.getDefaultProvider("mainnet", {
    etherscan: "K8G82VJYDPCHJ1FBGRJ3YEMJ6RK6JUC998",
    infura: {
      projectId: "9d35d5d95a15460d862e59825de02bdd",
      projectSecret: "5d0d0b874ec54d6daf51ebff4f433e98",
    },
  });
  web3 = new Web3(RPC_URL_MAINNET_WSS);
}
let startTime = Date.now();
async function startListening() {
 const newBlockHeaders = web3.eth.subscribe("newBlockHeaders");
  newBlockHeaders.on("data", async (blockHeader) => {
    //console.log(blockHeader);
    console.log("Block time: "+(Date.now()-startTime));
    startTime = Date.now();
  });
/*
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
        if(parseInt(transaction.gasPrice)>=90000000000){
          fs.appendFileSync("transactionDetails.txt", Date.now()+"\n"+JSON.stringify(transaction)+"\n---------------------\n");
        }
      }
      getTransactionData();
    });
    */
  console.log("Listening...");
}

async function run() {
  await initialize();
  startListening();
}

run();
