require("dotenv").config();
const BlocknativeSdk = require("bnc-sdk");
const WebSocket = require("ws");
const Web3 = require("web3");
let counter = 0;
async function run() {
  // create options object
  const options = {
    dappId: "90ed6b81-7717-4da6-970b-deb5f96ad2da",
    networkId: 5,
    transactionHandlers: [(event) => {}],
    ws: WebSocket, // only neccessary in server environments
    name: "Instance name here", // optional, use when running multiple instances
  };
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

  // initialize and connect to the api
  const blocknative = new BlocknativeSdk(options);
  // initialize web3
  const web3 = new Web3(RPC_URL_TEST_WSS);
  // call with the address of the account that you would like to receive status updates for
  const {
    emitter, // emitter object to listen for status updates
    details, // initial account details which are useful for internal tracking: address
  } = blocknative.account(TOKEN_OWNER_ACCOUNT);

  // register a callback for a txPool event
emitter.on("txPool", transaction => {
    counter++;
    console.log("Found it "+counter+" "+Date.now());
  })
  console.log("Listening...");
}

run();
