import { ethers, ZeroAddress } from "ethers";

// --- Constants (could import from a shared constants file) ---
export const V2_ROUTER_ADDRESS = "0x4A7b5Da61326A6379179b40d00F57E5bbDC962c2";
export const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
export const ROUTER_ABI = [
  "function getAmountsOut(uint256 amountIn, address[] memory path) view returns (uint256[] memory amounts)",
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)",
];
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];
export const MULTICALL_ABI = [
  "function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) public view returns (tuple(bool success, bytes returnData)[])"
];

const RPC_LIST = [
  "https://mainnet.optimism.io",
  "https://optimism-mainnet.public.blastapi.io",
  "https://optimism.drpc.org",
  "https://optimism-rpc.publicnode.com"
];
let rpcIndex = 0;
export function getNextRpcUrl() {
  const url = RPC_LIST[rpcIndex];
  rpcIndex = (rpcIndex + 1) % RPC_LIST.length;
  return url;
}

// --- Multicall with RPC cycling ---
export async function multicallWithRpcCycling({
  calls,
  multicallAddress = MULTICALL3_ADDRESS,
  multicallAbi = MULTICALL_ABI,
  maxRetries = RPC_LIST.length,
}) {
  
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    const rpcUrl = getNextRpcUrl();
    try {
      console.log(
        new Date().toLocaleTimeString(),
        rpcUrl,
      );
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const multicallContract = new ethers.Contract(
        multicallAddress,
        multicallAbi,
        provider
      );
      const results = await multicallContract.aggregate3(calls);
      return results;
    } catch (err) {
      lastError = err;
      console.log("Error with rpc", rpcUrl, err);
    }
  }
  throw lastError;
}

// --- Helper: prepare multicall balance calls ---
export function prepareBalanceCalls({ inputTokenAddr, outputTokenAddr, accountAddress, erc20Interface }) {
  const balanceInCallData = erc20Interface.encodeFunctionData("balanceOf", [accountAddress]);
  const balanceOutCallData = erc20Interface.encodeFunctionData("balanceOf", [accountAddress]);
  return [
    {
      target: inputTokenAddr,
      allowFailure: true,
      callData: balanceInCallData,
    },
    {
      target: outputTokenAddr,
      allowFailure: true,
      callData: balanceOutCallData,
    },
  ];
}
