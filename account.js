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
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20*1000;
    const deadlineHex = ethers.BigNumber.from(deadline.toString()).toHexString();
    const _ethAmount = ethers.utils.parseEther("1.1");
    const _ethAmountMin = ethers.utils.parseEther(ETH_AMOUNT).toString();
    console.log("\x1b[42m%s\x1b[0m", "ADDING LIQUIDITY " + Date.now());
    fs.appendFileSync(
      "transactionDetails.txt",
      "ADDING LIQUIDITY SENDING " + Date.now() + " \n"
    );
    const tx = await this.uniswap.addLiquidityETH(
      token.address,
    //  10000000,  10000000,
       1000, 100,
      _ethAmountMin,
      this.accountHash,
      deadlineHex,
      {
        value: _ethAmount,
        gasPrice: 20e9,
        gasLimit: 3017203
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
      "ADD LIQUIDITY TRANSACTION SENT " + Date.now() + " \n" + JSON.stringify(tx) + "\n"
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
      "ADD LIQUIDITY MINED "+tx.hash + " " + trxReceipt.status + " BLOCK NUMBER:" + trxReceipt.blockNumber + "\n"
    );
    console.log("\x1b[1m%s\x1b[0m", "Complete!");
  }

  async swapExactETHForTokens(decodedData, transaction) {
    const { token, weth } = Common.get();
    const pair = await Fetcher.fetchPairData(token, weth);
    const route = new Route([pair], weth);
    const trade = new Trade(
      route,
      new TokenAmount(weth, "10000000000000000"),
      TradeType.EXACT_INPUT
    );
    console.log("\x1b[42m%s\x1b[0m", "swapExactETHForTokens " + Date.now());
    const slippageTolerance = new Percent("5000", "10000"); // 50 bips 1 bip = 0.001 %
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();
    const path = [weth.address, token.address];
    const to = this.accountHash;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const deadlineHex = ethers.BigNumber.from(deadline.toString()).toHexString();
    const inputAmount = trade.inputAmount.raw;
    const inputAmountHex = ethers.BigNumber.from(inputAmount.toString()).toHexString();
    fs.appendFileSync( "transactionDetails.txt",  `swapExactETHForTokens SENDING ${Date.now()}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${amountOutMin}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${path}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${to}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${deadline}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${inputAmount}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `-------------\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${amountOutMinHex}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${path}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${to}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${deadlineHex}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${inputAmountHex}\n` );

    const tx = await this.uniswap.swapExactETHForTokens(
      amountOutMinHex,
      path,
      to,
      deadlineHex,
      {
        value:inputAmountHex,
        gasPrice: transaction.gasPrice,
      }
    );
    console.log(`Transaction hash: ${tx.hash}`);
    fs.appendFileSync(
      "transactionDetails.txt",
      `swapExactETHForTokens SENT ${Date.now()}, transaction hash: ${tx.hash}\n`
    );
    const receipt = await tx.wait();
    console.log(`Transaction was mined in block
     ${receipt.blockNumber}`);
    fs.appendFileSync(
      "transactionDetails.txt",
      `swapExactETHForTokens transaction was mined in block ${receipt.blockNumber}\n`
    );
  }

  async swapExactETHForTokensOnInitialAddLiquidity(decodedData, transaction) {
    console.log(transaction)
    const { token, weth } = Common.get();
    const path = [weth.address, token.address];
    const to = this.accountHash;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const deadlineHex = ethers.BigNumber.from(deadline.toString()).toHexString();
    const inputAmount = ethers.BigNumber.from("10000000000000000");
    const inputAmountHex = inputAmount.toHexString();
    const priceBigNumber =  ethers.BigNumber.from(decodedData.params[3].value).div(ethers.BigNumber.from(decodedData.params[1].value));
    const amountOutBest = inputAmount.div(priceBigNumber);
    const amountOutMin = ethers.BigNumber.from("50").mul(amountOutBest).div(ethers.BigNumber.from("100"));
    const amountOutMinHex = amountOutMin.toHexString();
    fs.appendFileSync(
      "transactionDetails.txt",
      `swapExactETHForTokensOnInitialAddLiquidity SENDING ${Date.now()}\n`
    );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${amountOutMin.toString()}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${path}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${to}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${deadline}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${inputAmount.toString()}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `-------------\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${amountOutMinHex}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${path}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${to}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${deadlineHex}\n` );
    fs.appendFileSync( "swapExactETHForTokens.txt", `${inputAmountHex}\n` );
    const tx = await this.uniswap.swapExactETHForTokens(
      amountOutMinHex,
      path,
      to,
      deadlineHex,
      {
        value:inputAmountHex,
        gasPrice: transaction.gasPrice,
        gasLimit: 150000
      }
    );
    console.log(`Transaction hash: ${tx.hash}`);
    fs.appendFileSync(
      "transactionDetails.txt",
      `swapExactETHForTokens SENT ${Date.now()}, transaction hash: ${tx.hash}\n`
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
