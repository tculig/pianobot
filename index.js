require("dotenv").config();
const Web3 = require("web3");
const ethers = require("ethers");
const abiDecoder = require("abi-decoder");
const exchangeABI = require("./abi").exchangeABI;

abiDecoder.addABI(exchangeABI);
let web3;
const {
  SELL_TOKEN_ADDRESS,
  SWAP_TO_TOKEN_1_ADDRESS,
  SWAP_TO_TOKEN_2_ADDRESS,
  ALERT_PRICE_LEVEL_TOKEN_1,
  ALERT_PRICE_LEVEL_TOKEN_2,
  SWAP_TO_TOKEN_1_TICKER,
  SWAP_TO_TOKEN_2_TICKER
} = process.env;
function initialize() {
  web3 = new Web3("wss://bsc-ws-node.nariox.org:443");
}

async function startTracking() {
  const options = { fromBlock: "0x0" };
  const newLogs = web3.eth.subscribe("logs", options);
  newLogs.on("data", async (logs) => {
    let transaction = null;
    while (transaction === null) {
      transaction = await web3.eth
        .getTransaction(logs.transactionHash)
        .catch(() => {});
    }
    if (transaction != undefined)
      try {
        if (!alerting) seekPIANO(transaction);
      } catch (err) {}
  });
  console.log("Listening...")
}

let alerting = false;
async function seekPIANO(transaction) {
  let transactionInput = transaction.input;
  if(!transactionInput.includes("d46936677b2c1bb696f2b67c55239331e2b7cd42")) return;
  const trxMethod = transactionInput.toLowerCase().substring(0, 10);
  if (
    trxMethod === "0x18cbafe5" /*swapExactTokensForETH */ ||
    trxMethod === "0x38ed1739" /*swapExactTokensForTokens */
  ) {
    const decodedData = abiDecoder.decodeMethod(transactionInput);
    const path = decodedData.params.filter((el) => el.name == "path")[0].value;
    const tokenSell = path[0].toLowerCase();
    const tokenBuy = path[path.length - 1].toLowerCase();
    if (tokenSell === SELL_TOKEN_ADDRESS.toLowerCase()) {
      let priceLimit;
      let ticker;
      switch (tokenBuy) {
        case SWAP_TO_TOKEN_1_ADDRESS.toLowerCase():
          priceLimit = ALERT_PRICE_LEVEL_TOKEN_1;
          ticker = SWAP_TO_TOKEN_1_TICKER;
          break;
        case SWAP_TO_TOKEN_2_ADDRESS.toLowerCase():
          priceLimit = ALERT_PRICE_LEVEL_TOKEN_2;
          ticker = SWAP_TO_TOKEN_2_TICKER;
          break;
        default:
          priceLimit = null;
      }
      if (priceLimit != null) {
        let transactionReceipt = null;
        while (transactionReceipt === null) {
          transactionReceipt = await web3.eth
            .getTransactionReceipt(transaction.hash)
            .catch(() => {});
        }
        if(alerting) return;
        let transfers = [];
        for (let i = 0; i < transactionReceipt.logs.length; i++) {
          if (
            transactionReceipt.logs[i].topics[0] ==
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" //keccak for Transfer(address,address,uint256)
          ) {
            transfers.push(transactionReceipt.logs[i]);
          }
        }

        let quantityBuy = null,
          quantitySell = null;
        for(let i=0;i<transfers.length;i++){
          const el = transfers[i];
          if (el.address.toLowerCase() == tokenBuy) {
            quantityBuy = parseInt(el.data, 16);
            
          } else if (el.address.toLowerCase() == tokenSell) {
            quantitySell = parseInt(el.data, 16);
          }
        }

        if (quantityBuy != null && quantitySell != null) {
          const price = quantityBuy/(quantitySell);
          console.log(price+" "+ticker+"   txHash: "+transaction.hash);
          if(price<priceLimit){
            if(!alerting){
              console.log("\x1b[42m%s\x1b[0m", "PRICE ALERT!!!");
              setInterval(() => process.stdout.write("\x07"), 1500);
            }
            alerting = true;
          }
        }
      }
    }
  }
}

async function run() {
  initialize();
  startTracking();
}

function setupSound() {
  console.log(
    "In 3 seconds you will hear 3 chimes. Adjust speaker volume to desired level."
  );
  setTimeout(() => console.log("\x07"), 5000);
  setTimeout(() => console.log("\x07"), 6250);
  setTimeout(() => console.log("\x07"), 7500);
  
}

//setupSound();
run();
