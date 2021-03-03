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
  RPC_URL_GOERLI_WSS,
  TOKEN_ADDRESS,
  TOKEN_OWNER_PRIVATE_KEY,
  NEW_TOKEN_ACCOUNT,
  NEW_TOKEN_PRIVATE_KEY,
  TOKEN_OWNER_ACCOUNT,
  STORAGE_PRIVATE_KEY,
  STORAGE_ACCOUNT
} = process.env;
const buyerAccounts = [];
const buyerAccountData = [
    {
        address:"0xC9b1E96F1F7472F50B998aee2fe540449cE01172",
        privatekey:"c5a7af7f2a9414d5ad4fc3cbdb1e117dacc831de08c51d2cda001d0f075d47e9"
    },
    {
        address:"0x5f4930B21eC909f4b909b56F81f6B1a2f439047e",
        privatekey:"a2b1b83d13fefcb2babf50a51bd3f9e5adbbbc75c6d0c71c25ece2fa62b3f156"
    },
    {
        address:"0xcd3eBb19A498A63BE828c51C0f045AF31e924f54",
        privatekey:"8cf07d4be02b55d9a724709a2c1e40558096c342ab4b381fe54a6b752fdc1fe9"
    },
    {
        address:"0x853c7F51Dd1c97971aFFeB0d341955AB9Fe72EE7",
        privatekey:"888e6a6c072baaeccad1e97ea8c6614f1bf30607eefb151c1ec40a4345c368ea"
    },
    {
        address:"0x248e19932b22Ab8bd1a2EAF9a5d05A7efBc938df",
        privatekey:"14f1ad5f2b7c34fe32e8500d482f0ebf804b1e0cd75e3df94fac302eedc35da6"
    },
    {
        address:"0xDef36dda784aFe4F811c9B6AdF20D03A3cAb0F29",
        privatekey:"eb9d43a0ce20c10a81df1e65c8f4a3d9f229e00093a9b561f77c480140144fa9"
    },
    {
        address:"0x21e891cD1a54574490f76118F88085880cBbd01C",
        privatekey:"dbccae83bd398a18a18babf05dd04fb5fcb07a70327b0cc1f97c857209faea9a"
    },
    {
        address:"0x0111ea26d2D946B63D27C05C1FA686CD17E13f0a",
        privatekey:"1f00cd5d1e065a6e0ffce462c3a3571431f79ddea9d25fbf4a0d53bace860b1d"
    },
    {
        address:"0x5d23b559DD72b02B48008A546a8340D0b92Fa77C",
        privatekey:"35793163c81c8dc7ee04f3272224ed7a64b01cb2da19ae334c8db81d34a8a426"
    },
    {
        address:"0xB42aA8DC878db249A52073f7055F413eE62cAA4C",
        privatekey:"5ed832797c834e8710802a4e3c45394c06677789c2a4dd07914b87b18c754b9c"
    }
]

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
  storageAccount = new Account(STORAGE_ACCOUNT, STORAGE_PRIVATE_KEY);
  buyerAccountData.forEach(bad=>{
      buyerAccounts.push(new Account(bad.address, bad.privatekey));
  })
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
        setTimeout(() => newTokenOwnerAccount.addLiquidityETH("0.0001"), 1000);
        addLiq=true;
      }
  });

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
    console.log("Listening...");
}
let triggered = false;
async function parseTransactionData(transaction) {
  fs.appendFileSync("transactionDetails.txt", Date.now()+"\n"+JSON.stringify(transaction)+"\n---------------------\n");
  let transactionInput = transaction.input;
  const trxMethod = transactionInput.toLowerCase().substring(0, 10);
  if (trxMethod === "0xf305d719") {    // addLiquidityETH
    const token = transactionInput.toLowerCase().substring(34, 74);
    console.log(transaction);
    if (token === TOKEN_ADDRESS.toLowerCase().substring(2, TOKEN_ADDRESS.length)) {
      const decodedData = abiDecoder.decodeMethod(transactionInput);
      if(!triggered){
        console.log("TIME SINCE BEGINNING OF BLOCK: "+(Date.now()-lastBlockTime));
        for(let i=0;i<buyerAccounts.length;i++){
          const delay = i*100;
          setTimeout(() => buyerAccounts[i].swapExactETHForTokensOnInitialAddLiquidity(decodedData,transaction,delay,i), delay);
        }
      }
      triggered = true;
    }
  }
}

async function run() {
  await initialize();
  startListening();
  //buyerAccounts.forEach(acc=>{storageAccount.transferToAccount(acc,"1.1");});
  //storageAccount.transferToAccount(buyerAccountData[9].address,"1.1");
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
