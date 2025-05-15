"use client";
import { useState } from "react";
import { Copy } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAccount } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";

const address = process.env.NEXT_PUBLIC_USDM_ADDRESS;
const TOKEN_TEMPLATE = `pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }
}`;

export default function TutorialPage() {
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();
  // Handles copy and toast
  function copyToClipboard(text, which = "code") {
    navigator.clipboard.writeText(text);
    toast("Copied!");
  }

  return (
    <div className="container mx-auto max-w-3xl p-6 space-y-10">
      <Toaster />
      {!isConnected && (
        <div
          className="bg-orange-500/90 text-white text-center font-semibold rounded-lg px-4 py-3 mb-6 shadow-lg border border-orange-700 cursor-pointer hover:bg-orange-600 transition"
          onClick={() => open()}
        >
          Connect your MetaMask and switch to OP Mainnet
        </div>
      )}

      {/* STEP 1 */}
      <section className="bg-gray-800 p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold text-orange-400 mb-2">
          Deploy your token
        </h2>
        <ol className="list-decimal ml-6 space-y-2 text-white">
          <li>
            go to&nbsp;
            <a
              href="https://remix.ethereum.org/#lang=en&optimize=true&runs=200&evmVersion=cancun&version=soljson-v0.8.24+commit.e11b9ed9.js&language=Solidity"
              target="_blank"
              className="underline text-blue-400 hover:text-blue-300"
            >
              remix
            </a>
          </li>
          <li>
            <TooltipProvider>
              <Tooltip disableHoverableContent={true}>
                <TooltipTrigger asChild>
                  <span className="cursor-pointer border-b border-dotted border-blue-400 hover:cursor-help focus:cursor-help">
                    create a new file
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="p-0">
                  <img
                    src="/create.jpg"
                    alt="Create Screenshot"
                    className="w-[300px] rounded-lg shadow-lg border border-gray-700"
                  />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>{" "}
            called <span className="font-mono">Token.sol</span> and paste the
            template below:
          </li>
        </ol>
        <div
          className="relative group cursor-pointer"
          onClick={() => copyToClipboard(TOKEN_TEMPLATE, "code")}
          title="Copy contract code"
        >
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto border border-blue-600 group-hover:border-orange-400 transition">
            {TOKEN_TEMPLATE}
          </pre>
          <span className="absolute top-3 right-4 flex items-center text-blue-400 text-xs opacity-0 group-hover:opacity-100 transition">
            <Copy className="w-4 h-4 mr-1" /> Click to copy
          </span>
        </div>
        <div className="bg-blue-900/70 text-blue-200 rounded px-4 py-2 text-sm mt-2">
          <b>Customize:</b> Change{" "}
          <span className="text-orange-400 font-mono">MyToken</span> (name),{" "}
          <span className="text-orange-400 font-mono">MTK</span> (symbol), and{" "}
          <span className="text-orange-400 font-mono">1000</span> (mint amount)
          to your own
        </div>
        <ol start={3} className="list-decimal ml-6 mt-3 space-y-2 text-white">
          <li>
            press <kbd>ctrl</kbd> + <kbd>s</kbd> to compile
          </li>
          <li>
            <TooltipProvider>
              <Tooltip disableHoverableContent={true}>
                <TooltipTrigger asChild>
                  <span className="cursor-pointer border-b border-dotted border-blue-400 hover:cursor-help focus:cursor-help">
                    open the deploy tab
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="p-0">
                  <img
                    src="/deploy_tab.jpg"
                    alt="Deploy Tab Screenshot"
                    className="w-[300px] rounded-lg shadow-lg border border-gray-700"
                  />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </li>
          <li>
            <TooltipProvider>
              <Tooltip disableHoverableContent={true}>
                <TooltipTrigger asChild>
                  <span className="cursor-pointer border-b border-dotted border-blue-400 hover:cursor-help focus:cursor-help">
                    switch to injected provider
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="p-0">
                  <img
                    src="/injected_provider.jpg"
                    alt="Injected Provider Screenshot"
                    className="w-[300px] rounded-lg shadow-lg border border-gray-700"
                  />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </li>
          <li>confirm in MetaMask</li>
          <li>
            click{" "}
            <span
              className="px-2 py-1 ml-1 rounded"
              style={{ background: "#C97539", color: "white" }}
            >
              Deploy
            </span>{" "}
            and confirm in MetaMask
          </li>
          <li>
            <TooltipProvider>
              <Tooltip disableHoverableContent={true}>
                <TooltipTrigger asChild>
                  <span className="cursor-pointer border-b border-dotted border-blue-400 hover:cursor-help focus:cursor-help">
                    copy your token address
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="p-0">
                  <img
                    src="/copy_address.jpg"
                    alt="Copy Address Screenshot"
                    className="w-[300px] rounded-lg shadow-lg border border-gray-700"
                  />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </li>
        </ol>
      </section>

      {/* STEP 2 */}
      <section className="bg-gray-800 p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold text-orange-400 mb-2">
          Seed liquidity on Uniswap v2
        </h2>
        <ol className="list-decimal ml-6 space-y-2 text-white">
          <li>
            go to&nbsp;
            <a
              href="https://app.uniswap.org/positions/create/v2"
              target="_blank"
              className="underline text-blue-400 hover:text-blue-300"
            >
              app.uniswap.org/positions/create/v2
            </a>
          </li>
          <li>
            <span
              className="px-2 py-1 ml-1 rounded"
              style={{ background: "#FF37C7", color: "white" }}
            >
              Connect
            </span>{" "}
            → Other wallets → MetaMask
          </li>
          <li>
            for token <b>A</b>, paste your token address
          </li>
          <li className="flex items-center gap-2">
            <span>
              for token <b>B</b>, paste&nbsp;
            </span>
            <span
              className="bg-blue-900 text-blue-200 font-mono px-2 py-1 rounded cursor-pointer hover:bg-orange-400 hover:text-white transition"
              onClick={() => copyToClipboard(address, "usdm")}
              title="Copy USDM address"
            >
              USDM
            </span>
            <span className="text-xs text-blue-300">(click to copy)</span>
          </li>
          <li>
            set an initial price (e.g. <span className="text-blue-300">$2</span>
            ) and choose how much liquidity to add
          </li>
          <li>
            <span
              className="px-2 py-1 ml-1 rounded"
              style={{ background: "#FF37C7", color: "white" }}
            >
              Review
            </span>
            {" → "}
            <span
              className="px-2 py-1 ml-1 rounded"
              style={{ background: "#FF37C7", color: "white" }}
            >
              Create
            </span>
          </li>
        </ol>
      </section>

      <section className="bg-gray-800 p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold text-orange-400 mb-2">Swap</h2>
        <ol className="list-decimal ml-6 space-y-2 text-white mb-0">
          <li>
            go to&nbsp;
            <a
              href="https://app.uniswap.org/swap"
              target="_blank"
              className="underline text-blue-400 hover:text-blue-300"
            >
              app.uniswap.org/#/swap
            </a>
          </li>
          <li>once you've made your first swap, the chart will load:</li>
        </ol>
        <div className="bg-blue-900/70 text-blue-200 rounded px-4 py-2 text-sm mt-4">
          dexscreener.com/optimism/
          <span className="text-orange-400 font-mono">
            0xYOUR_TOKEN_ADDRESS
          </span>
        </div>
      </section>

      <section className="bg-gray-800 p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold text-orange-400 mb-2">
          Experiment
        </h2>
        <ol className="list-decimal ml-6 space-y-2 text-white mb-0">
          <li>
            Try swapping different amounts. How does the swap size affect the
            price impact? What happens if you try a very large swap?
          </li>
          <li>
            Add or remove liquidity to your pool. How does this change the price
            stability? Does it make large trades more or less volatile?
          </li>
          <li>
            Send your token address to someone else in the room and trade it
            together. How do you make money against them?
          </li>
          <li>
            If you provide liquidity, how do you make (or lose) money? What
            happens if the price moves a lot after you add liquidity?
          </li>
          <li>
            Try removing your liquidity after some trades. Did your USDM/token
            balance change? Why?
          </li>
        </ol>
        <div className="text-center text-xs text-gray-400 mt-6">
          we will reveal the answers at the end
        </div>
      </section>
    </div>
  );
}
