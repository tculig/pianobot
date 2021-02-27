const ethers = require("ethers");
const { Fetcher, Route, Trade, TokenAmount, TradeType, Percent } = require("@uniswap/sdk");
const fs = require("fs");
const Common = require("./staticVariables.js");
const { sleep } = require("./utils");

class Stat {
  static obj={};
  constructor(obj) {
    Stat.obj = obj;   
  }
  static get() {
    return Stat.obj;
  }
  static set(obj) {
    Stat.obj  = obj;
  }
  static add(newValues) {
    Stat.obj  = {
        ...Stat.obj,
        ...newValues
    }
  }
};

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
    const _ethAmount = ethers.utils.parseEther(ETH_AMOUNT);
    const _ethAmountMin = ethers.utils.parseEther(ETH_AMOUNT).toString();
    console.log("\x1b[42m%s\x1b[0m", "ADDING LIQUIDITY " + Date.now());
    Stat.add({addLiquidityInProgress : true});
    Stat.add({addLiquidityBlock : -1});
    Stat.add({addLiquidityPosition : -1});
    const tx = await this.uniswap.addLiquidityETH(
      token.address,
      //1000000,  1000000,//0.1 eth
      10000,  1,
      _ethAmountMin,
      this.accountHash,
      deadlineHex,
      {
        value: _ethAmount,
        gasPrice: 20e9,
        gasLimit: 3017203
      }
    );
    console.log("\x1b[42m%s\x1b[0m", "LIQUIDITY SENT "+tx.hash);
    const startTime = Date.now();
    const trxReceipt = await tx.wait();
    Stat.add({addLiquidityInProgress : false});
    Stat.add({addLiquidityBlock : trxReceipt.blockNumber});
    Stat.add({addLiquidityPosition : trxReceipt.transactionIndex});
    console.log("\x1b[42m%s\x1b[0m", "ADD LIQUIDITY MINED "+ !!trxReceipt.status + " BLOCK NUMBER:" + trxReceipt.blockNumber + " POSITION: "+trxReceipt.transactionIndex+" TIME TAKEN: "+(Date.now()-startTime)/1000+" seconds");
  }

  async swapExactETHForTokensOnInitialAddLiquidity(decodedData, transaction) {
    console.log("\x1b[44m%s\x1b[0m", "swapExactETHForTokens " + Date.now());
    const { token, weth, web3 } = Common.get();
    const path = [weth.address, token.address];
    const to = this.accountHash;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const deadlineHex = ethers.BigNumber.from(deadline.toString()).toHexString();
    const inputAmount = ethers.BigNumber.from("10000000000000");
    const inputAmountHex = inputAmount.toHexString();
   // const priceBigNumber =  ethers.BigNumber.from(decodedData.params[3].value).div(ethers.BigNumber.from(decodedData.params[1].value));
   // const amountOutBest = inputAmount.div(priceBigNumber);
   // const amountOutMin = ethers.BigNumber.from("5").mul(amountOutBest).div(ethers.BigNumber.from("100"));
    const amountOutMin = ethers.BigNumber.from("1");
    const amountOutMinHex = amountOutMin.toHexString();
    const tx = await this.uniswap.swapExactETHForTokens(
      amountOutMinHex,
      path,
      to,
      deadlineHex,
      {
        value:inputAmountHex,
        gasPrice: transaction.gasPrice,
        gasLimit: 140000
      }
    );
    console.log("\x1b[44m%s\x1b[0m", "SWAP SENT "+tx.hash);
    const trxReceipt = await tx.wait();
    console.log("\x1b[44m%s\x1b[0m", "swapExactETHForTokens MINED "+ !!trxReceipt.status + " BLOCK NUMBER:" + trxReceipt.blockNumber + " POSITION: "+trxReceipt.transactionIndex);
    let stat = Stat.get();
    if(stat.addLiquidityInProgress) await sleep(1000);
    stat = Stat.get();
    if(stat.addLiquidityInProgress){
      console.log("\x1b[31m%s\x1b[0m", "ADD LIQUIDITY STILL IN PROGRESS!");
    }
    if(trxReceipt.blockNumber == stat.addLiquidityBlock){
      console.log("\x1b[46m%s\x1b[0m", "SAME BLOCK");
      if(trxReceipt.transactionIndex > stat.addLiquidityPosition){
        console.log("\x1b[46m%s\x1b[0m", "CORRECT ORDER");
      }else{
        console.log("\x1b[31m%s\x1b[0m", "INCORRECT ORDER");
      }
    }else{
      console.log("\x1b[31m%s\x1b[0m", "NOT SAME BLOCK");
    }
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
    const slippageTolerance = new Percent("50000", "10000"); // 50 bips 1 bip = 0.001 %
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();
    const path = [weth.address, token.address];
    const to = this.accountHash;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const deadlineHex = ethers.BigNumber.from(deadline.toString()).toHexString();
    const inputAmount = trade.inputAmount.raw;
    const inputAmountHex = ethers.BigNumber.from(inputAmount.toString()).toHexString();

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
    const receipt = await tx.wait();
    console.log("swapExactETHForTokensMINED "+ receipt.status + " BLOCK NUMBER:" + receipt.blockNumber + " POSITION: "+receipt.transactionIndex);
   }

  async swapExactTokensForETH() {}
};
