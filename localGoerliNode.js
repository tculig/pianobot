require("dotenv").config();
const Web3 = require("web3");

let web3;
let web3Local;

async function initialize() {
    web3 = new Web3(process.env.RPC_URL_GOERLI_WSS);
    web3Local = new Web3("ws://localhost:8546"); 
}
const history = {};
 const historyLocal ={};

async function startListeningLocal() {
  subscription = web3Local.eth
    .subscribe("pendingTransactions", function (error, result) {})
    .on("data", function (transactionHash) {
      async function getTransactionData() {
        let transaction = null;
        let retryCount = -1;
        const startTime = Date.now();
        while (transaction === null) {
          transaction = await web3Local.eth.getTransaction(transactionHash);
          retryCount++;
        }
        historyLocal[transactionHash]=Date.now();

        //console.log(transactionHash+" "+Date.now())
      }
      getTransactionData();
    });
    console.log("Listening local...");
}
async function startListening() {
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
          history[transactionHash]=Date.now();
        }
        getTransactionData();
      });
      console.log("Listening...");
  }
function compare(){
    let sum = 0;
    let counter = 0;
    for (const [key, value] of Object.entries(history)) {
        if(historyLocal[key]!=null){
            const diff = value-historyLocal[key];
            sum += diff;
            counter++;
            console.log("delta: "+diff);
        }
      }
    console.log("Average gain: "+(sum/counter)) ;
}

async function run() {
  await initialize();
  startListeningLocal();
  startListening();
  setInterval(compare, 6000);
}

run();
var done = (function wait () { if (!done) setTimeout(wait, 1000) })();

