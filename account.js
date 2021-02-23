const ethers = require("ethers");
const { Fetcher, Route, Trade, TokenAmount, TradeType, Percent } = require("@uniswap/sdk");
const fs = require("fs");
const Common = require("./staticVariables.js");
const { sleep } = require("./utils");

module.exports = class Account {
  constructor(accountHash, privateKey) {
    if(!accountHash) return;
    const { EXCHANGE_ADDRESS } = process.env;
    const { provider } = Common.get();
    const privateKeyHex = new Buffer.from(privateKey, "hex");
    const signer = new ethers.Wallet(privateKeyHex, provider);
    this.uniswap = new ethers.Contract(
      EXCHANGE_ADDRESS,
      [
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
        "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
        "function addLiquidityETH(address token,uint amountTokenDesired,uint amountTokenMin,uint amountETHMin,address to,uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
      ],
      signer
    );
    this.accountHash = accountHash;
  }

  async addLiquidityETH(ETH_AMOUNT) {
    const { token, web3 } = Common.get();
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const deadlineHex = ethers.BigNumber.from(
      deadline.toString()
    ).toHexString();
    const _ethAmount = ethers.utils.parseEther(ETH_AMOUNT);
    const _ethAmountMin = ethers.utils.parseEther(ETH_AMOUNT).toString();
    console.log("\x1b[42m%s\x1b[0m", "ADDING LIQUIDITY " + Date.now());
    fs.appendFileSync(
      "transactionDetails.txt",
      "ADDING LIQUIDITY " + Date.now() + " \n"
    );
    const tx = await this.uniswap.addLiquidityETH(
      token.address,
      1000,
      1000,
      _ethAmountMin,
      this.accountHash,
      deadlineHex,
      {
        value: _ethAmount,
        gasPrice: 20e9,
      }
    );

    console.log("\x1b[42m%s\x1b[0m", "TRANSACTION SENT");
    console.log("tx.hash", tx.hash);
    console.log(
      "\x1b[1m%s\x1b[0m",
      "Waiting for addLiquidity transaction to be mined..."
    );
    fs.appendFileSync(
      "transactionDetails.txt",
      "TRANSACTION SENT " + Date.now() + " \n" + JSON.stringify(tx) + "\n"
    );
    let trxReceipt = null;
    while (trxReceipt == null) {
      trxReceipt = await web3.eth.getTransactionReceipt(tx.hash);
      await sleep(1000);
    }
    console.log(
      tx.hash + " " + trxReceipt.status + " " + trxReceipt.blockNumber
    );
    fs.appendFileSync(
      "transactionDetails.txt",
      tx.hash + " " + trxReceipt.status + " " + trxReceipt.blockNumber + "\n"
    );
    console.log("\x1b[1m%s\x1b[0m", "Complete!");
  }

  async swapExactETHForTokens() {
    const pair = await Fetcher.fetchPairData(this.token, this.weth);
    const route = new Route([pair], this.weth);
    const trade = new Trade(
      route,
      new TokenAmount(this.weth, "10000000000000000"),
      TradeType.EXACT_INPUT
    );
    const slippageTolerance = new Percent("50000", "10000"); // 50 bips 1 bip = 0.001 %
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const path = [this.weth.address, this.token.address];
    const to = this.accountHash;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const value = trade.inputAmount.raw;
    const tx = await this.uniswap.swapExactETHForTokens(
      amountOutMin,
      path,
      to,
      deadline,
      {
        value,
        gasPrice: 20e9,
      }
    );
    console.log(`Transaction hash: ${tx.hash}`);
    fs.appendFileSync(
      "transactionDetails.txt",
      `swapExactETHForTokens transaction hash: ${tx.hash}\n`
    );
    const receipt = await tx.wait();
    console.log(`Transaction was mined in block
     ${receipt.blockNumber}`);
    fs.appendFileSync(
      "transactionDetails.txt",
      `swapExactETHForTokens transaction was mined in block ${receipt.blockNumber}\n`
    );
  }

  async swapExactTokensForETH() {}
};
