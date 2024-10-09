const { ethers } = require('ethers');
const fs = require('fs');

const RPC_URL = 'https://rpc.open-campus-codex.gelato.digital';
const CHAIN_ID = 656476;
const USDC_ADDRESS = '0x77721D19BDfc67fe8cc46ddaa3cc4C94e6826E3C';
const GRASP_ADDRESS = '0x3eB2Eb8E2a0E26BEf3Dc3E78289Be7343355FeBC';
const SAILFISH_ROUTER_ADDRESS = '0xB97582DCB6F2866098cA210095a04dF3e11B76A6';

const ROUTER_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes[]",
        "name": "data",
        "type": "bytes[]"
      }
    ],
    "name": "execute",
    "outputs": [
      {
        "internalType": "bytes[]",
        "name": "results",
        "type": "bytes[]"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amountOutMin",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "path",
        "type": "address[]"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "path",
        "type": "address[]"
      }
    ],
    "name": "getAmountsOut",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenA",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenB",
        "type": "address"
      }
    ],
    "name": "getReserves",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "reserveA",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "reserveB",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function balanceOf(address account) public view returns (uint256)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function decimals() public view returns (uint8)'
];

async function getProvider() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  await provider.getNetwork();
  console.log(`Connected to RPC: ${RPC_URL}`);
  return provider;
}

async function checkBalanceAndAllowance(usdcContract, signer, routerAddress) {
  const balance = await usdcContract.balanceOf(signer.address);
  const allowance = await usdcContract.allowance(signer.address, routerAddress);
  const decimals = await usdcContract.decimals();
  console.log(`USDC Balance: ${ethers.utils.formatUnits(balance, decimals)}`);
  console.log(`Router Allowance: ${ethers.utils.formatUnits(allowance, decimals)}`);
  return { balance, allowance };
}

async function swapUsingExecute(routerContract, amountIn, amountOutMin, path, to, deadline, gasLimit, gasPrice) {
  const swapData = routerContract.interface.encodeFunctionData('swapExactTokensForTokens', [
    amountIn,
    amountOutMin,
    path,
    to,
    deadline
  ]);

  const data = [swapData];

  console.log('Simulating transaction...');
  try {
    await routerContract.callStatic.execute(data, { gasLimit });
    console.log('Transaction simulation successful');
  } catch (error) {
    console.error('Transaction simulation failed:', error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
    throw error;
  }

  console.log('Sending transaction...');
  const tx = await routerContract.execute(data, {
    gasLimit: gasLimit,
    gasPrice: gasPrice
  });

  console.log(`Swap transaction sent. Hash: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`Swap successful. Gas used: ${receipt.gasUsed.toString()}`);
  return tx;
}

async function handleSwapError(error) {
  console.error('Error dalam transaksi:', error.message);
  if (error.error && error.error.message) {
    console.error('Error detail:', error.error.message);
  }
  if (error.transaction) {
    console.error('Transaction data:', error.transaction);
  }
  if (error.receipt) {
    console.error('Transaction receipt:', error.receipt);
  }
  console.error('Full error object:', JSON.stringify(error, null, 2));
}

async function main() {
  try {
    const privateKey = fs.readFileSync('pk.txt', 'utf8').trim();
    const provider = await getProvider();
    const signer = new ethers.Wallet(privateKey, provider);

    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
    const routerContract = new ethers.Contract(SAILFISH_ROUTER_ADDRESS, ROUTER_ABI, signer);

    const slippage = 10; // 10% slippage
    const delayInMinutes = 60;
    const GAS_LIMIT = 5000000;
    const GAS_PRICE = ethers.utils.parseUnits('0.8', 'gwei');

    while (true) {
      try {
        const { balance, allowance } = await checkBalanceAndAllowance(usdcContract, signer, SAILFISH_ROUTER_ADDRESS);
        const decimals = await usdcContract.decimals();

        let amountToSwap = balance.mul(10).div(100);
        console.log(`Jumlah USDC untuk swap (10% saldo): ${ethers.utils.formatUnits(amountToSwap, decimals)}`);

        if (amountToSwap.isZero()) {
          console.log('Saldo USDC tidak cukup untuk swap. Menunggu...');
          await new Promise(resolve => setTimeout(resolve, delayInMinutes * 60 * 1000));
          continue;
        }

        if (allowance.lt(amountToSwap)) {
          console.log('Memberikan approval...');
          const approveTx = await usdcContract.approve(SAILFISH_ROUTER_ADDRESS, ethers.constants.MaxUint256);
          await approveTx.wait();
          console.log('Approval berhasil');
        }

        const path = [USDC_ADDRESS, GRASP_ADDRESS];
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

        // Get expected output amount
        const amounts = await routerContract.getAmountsOut(amountToSwap, path);
        const expectedOutputAmount = amounts[1];
        console.log(`Expected output amount: ${ethers.utils.formatUnits(expectedOutputAmount, decimals)}`);

        const minAmountOut = expectedOutputAmount.mul(100 - slippage).div(100);

        // Check liquidity
        const [reserveIn, reserveOut] = await routerContract.getReserves(USDC_ADDRESS, GRASP_ADDRESS);
        if (reserveOut.lt(minAmountOut)) {
          console.log('Liquiditas tidak cukup untuk swap. Menunggu...');
          await new Promise(resolve => setTimeout(resolve, delayInMinutes * 60 * 1000));
          continue;
        }

        console.log(`Attempting swap with parameters: 
          Token In: ${USDC_ADDRESS}, 
          Token Out: ${GRASP_ADDRESS}, 
          Amount In: ${ethers.utils.formatUnits(amountToSwap, decimals)}, 
          Min Amount Out: ${ethers.utils.formatUnits(minAmountOut, decimals)},
          To: ${signer.address}`);

        const swapTx = await swapUsingExecute(
          routerContract,
          amountToSwap,
          minAmountOut,
          path,
          signer.address,
          deadline,
          GAS_LIMIT,
          GAS_PRICE
        );

        console.log(`Swap berhasil. Transaction hash: ${swapTx.hash}`);

      } catch (error) {
        await handleSwapError(error);
        console.log('Retrying in 1 minute...');
        await new Promise(resolve => setTimeout(resolve, 60 * 1000));
      }

      console.log(`Menunggu ${delayInMinutes} menit sebelum transaksi berikutnya...`);
      await new Promise(resolve => setTimeout(resolve, delayInMinutes * 60 * 1000));
    }
  } catch (error) {
    console.error('Error utama:', error.message);
  }
}

main();