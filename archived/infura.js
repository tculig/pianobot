const Web3 = require("web3");

let web3 = new Web3(
  // Replace YOUR-PROJECT-ID with a Project ID from your Infura Dashboard
  new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID")
);

const instance = new web3.eth.Contract(abi, address);

instance.getPastEvents(
    "SomeEvent",
    { fromBlock: "latest", toBlock: "latest" },
    (errors, events) => {
        if (!errors) {
            // process events
        }
    }
);