const WebSocket = require("ws");
// Get latest unconfirmed transactions live
var ws = new WebSocket("wss://socket.blockcypher.com/v1/eth/goerli?token=523289f760c34fd18ffd418f603fa8e0");
var count = 0;
ws.onmessage = function (event) {
  var tx = JSON.parse(event.data);
  console.log(tx)
  var shortHash = tx.hash.substring(0, 6) + "...";
  var total = tx.total / 100000000;
  var addrs = tx.addresses.join(", ");
  count++;
  if (count > 10) ws.close();
}
ws.onopen = function(event) {
  ws.send(JSON.stringify({event: "unconfirmed-tx"}));
}