module.exports = class Account {
  constructor(accountHash, privateKey, provider) {
    const {EXCHANGE_ADDRESS} = process.env;
    const privateKeyHex = new Buffer.from(privateKey, "hex");
    this.signer = new ethers.Wallet(privateKeyHex, provider);
    this.uniswap = new ethers.Contract(
      EXCHANGE_ADDRESS,
      [
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
        "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
        "function addLiquidityETH(address token,uint amountTokenDesired,uint amountTokenMin,uint amountETHMin,address to,uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
      ],
      signer
    );
    this.accountHash =  accountHash;
  }

  addLiquidityETH() {
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const deadlineHex = ethers.BigNumber.from(deadline.toString()).toHexString();
    const _ethAmount = ethers.utils.parseEther(ETH_AMOUNT);
    const _ethAmountMin = ethers.utils.parseEther(ETH_AMOUNT).toString();
    console.log("\x1b[42m%s\x1b[0m", "ADDING LIQUIDITY");
    /* const _ethAmount = ethers.BigNumber.from(
        ETH_AMOUNT.toString()
      ).toHexString();
      const _ethAmountMin = ethers.BigNumber.from(
        ETH_AMOUNT.toString()
      ).toHexString();*/
    // addLiquidityETH(address token,uint amountTokenDesired,uint amountTokenMin,uint amountETHMin,address to,uint deadline)
    console.log(Date.now());
    fs.appendFileSync(
      "transactionDetails.txt",
      "ADDING LIQUIDITY " + Date.now() + " \n"
    );
    //console.log("NONCE "+nonceT)
    const tx = await uniswap.addLiquidityETH(
      token.address,
      1000,
      1000,
      _ethAmountMin,
      ACCOUNT,
      deadlineHex,
      {
        value: _ethAmount,
        gasPrice: 40e9,
       // nonce: nonceT
      }
    );
   
  
    console.log("\x1b[42m%s\x1b[0m", "TRANSACTION SENT");
    //console.log("buy tx", tx);
    console.log("tx.hash", tx.hash);
    fs.appendFileSync(
      "transactionDetails.txt",
      "TRANSACTION SENT " + Date.now() + " \n" + JSON.stringify(tx) + "\n"
    );
    console.log(
      "\x1b[1m%s\x1b[0m",
      "Waiting for your transaction to be mined..."
    );
    let trxReceipt = null;
    /* const { emitter } = blocknative.transaction(tx.hash)
      emitter.on('all', transaction => {
        console.log(`Transaction event: ${transaction.eventCode}`)
        console.log(transaction.startTime);
        console.log("-------------------------");
      })
      emitter.on('txPool', transaction => {
        console.log(`Sending ${transaction.value} wei to ${transaction.to}`)
      })
    
      emitter.on('txConfirmed', transaction => {
        console.log('Transaction is confirmed!')
        console.log(transaction)
      })*/
    while (trxReceipt == null) {
      trxReceipt = await web3.eth.getTransactionReceipt(tx.hash);
      await sleep(1000);
    }
    console.log(tx.hash+" "+trxReceipt.status+" "+trxReceipt.blockNumber);
    console.log("\x1b[1m%s\x1b[0m", "Complete!");
  }

  swapExactETHForTokens() {

  }

  swapExactTokensForETH() {

  }



};
