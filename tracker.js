require("dotenv").config();
const Web3 = require("web3");
const { ChainId, Fetcher, WETH } = require("@uniswap/sdk");
const ethers = require("ethers");
const abiDecoder = require("abi-decoder");
const exchangeABI = require("./abi").exchangeABI;
const fs = require("fs");

abiDecoder.addABI(exchangeABI);

let provider;
let web3;
let chainId;
let token;

const RPC_URL_MAINNET="https://mainnet.infura.io/v3/9812b16a1c4b4334b8783d03772befd9";
const RPC_URL_MAINNET_WSS="wss://mainnet.infura.io/ws/v3/9812b16a1c4b4334b8783d03772befd9";
const TOKEN_ADDRESS="0xd478161c952357f05f0292b56012cd8457f1cfbf"

async function initialize() {
  //Initialize web3
  chainId = ChainId.MAINNET;
  provider = new ethers.providers.getDefaultProvider("mainnet",RPC_URL_MAINNET);
  web3 = new Web3(RPC_URL_MAINNET_WSS);
  token = await Fetcher.fetchTokenData(chainId, TOKEN_ADDRESS, provider);
}

async function startListening() {
  console.log("STARTED LISTENING!")
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
  const  transactionInput = transaction.input;
  fs.appendFileSync("mainnetPending.txt", "Pending transaction "+Date.now()+"\n"+JSON.stringify(transaction)+"\n");
  const trxMethod = transactionInput.toLowerCase().substring(0,10);
  if (trxMethod === "0xf305d719"){ // addLiquidityETH
    const token = transactionInput.toLowerCase().substring(34,74);
    if (token === TOKEN_ADDRESS.toLowerCase().substring(2,TOKEN_ADDRESS.length)){
      console.log(Date.now()+" COIN IS NOW FOR SALE!");
    }
  }
}

async function run() {
  await initialize();
  startListening();
}

run();
