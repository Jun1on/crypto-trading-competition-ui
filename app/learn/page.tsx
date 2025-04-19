/* eslint-disable react/no-unescaped-entities */
"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function LearnPage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <Link
        href="/"
        className="flex items-center text-blue-400 mb-6 hover:text-blue-300"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="space-y-8">
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">How the Competition Works</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium text-orange-400">
                Round Zero
              </h3>
              <p className="mt-2">
                Round Zero is a special round that gives everyone a chance to
                get comfortable with the trading flow. No pressure, it's only
                worth 5 USDM. It's your warm-up round to test out Uniswap,
                experiment with trades, and get used to the interface before the
                real competition begins.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-orange-400">Rounds</h3>
              <p className="mt-2">
                Each round introduces a brand-new token, each with its own
                unique fundamentals. Pay attention to the short presentation
                before each round to learn what makes the token unique. There
                are around 6 rounds that last 10-15 minutes each.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-orange-400">
                USDM Airdrop
              </h3>
              <p className="mt-2">
                At the start of each round, everyone receives the same amount of
                USDM. Your balance carries over, so smart trades stack over
                rounds. Don't worry if you lose it all, you'll be airdropped
                fresh USDM in the next round.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-orange-400">Trading</h3>
              <p className="mt-2">
                Use Uniswap to trade USDM for the round's token and back.
                Uniswap's algorithm works in a way that when someone buys the
                token, the price goes up. When someone sells the token, the
                price goes down. Use this to your advantage.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-orange-400">Scoring</h3>
              <p className="mt-2">
                You'll be ranked on the live leaderboard based on your PNL
                (Profit and Loss) across all rounds. The top trader at the end
                wins.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Tips for Beginners</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium text-orange-400">
                Start Small
              </h3>
              <p className="mt-2">
                Don't go all-in on your first trade. Start with smaller amounts
                of USDM to get familiar with how everything works.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-orange-400">
                Watch the Chart
              </h3>
              <p className="mt-2">
                Look at price trends before buying or selling. Make sure to
                change your chart time frame to 1 second to see every trade.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-orange-400">Act Fast</h3>
              <p className="mt-2">
                Narratives can shift fast. If you see a smart trade, don't wait
                too long - other players are thinking the same thing.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-orange-400">
                Sell all your tokens before the round ends
              </h3>
              <p className="mt-2">
                Remember, only realized profits count. If you don't sell your
                tokens before the round ends, they will automatically be sold
                along with anyone else who didn't sell. So make sure to cash out
                in time.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Tips for Advanced Players</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium text-orange-400">
                Anticipate the Narrative
              </h3>
              <p className="mt-2">
                Listen closely during the token presentations. Tokenomics,
                fundamentals, and even the name can hint at how others will
                trade. Position early before the herd catches on.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-orange-400">
                Use Liquidity to Your Advantage
              </h3>
              <p className="mt-2">
                Uniswap slippage is real. If you're trading size, be mindful of
                how much price impact you're causing. Price impact can be both
                good and bad depending on what you're trying to do.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-orange-400">
                Exploit the AI
              </h3>
              <p className="mt-2">
                The{" "}
                <Link
                  href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/address/${process.env.NEXT_PUBLIC_BOT_WALLET}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-400 hover:text-blue-300"
                >
                  market-making bot
                </Link>{" "}
                follows rules. Once you spot its behavior, you can frontrun it,
                fade it, or trap it. Treat it like a predictable whale. The
                bot's address ends in "EEEE", making it easy to track on
                DEXScreener.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-orange-400">
                What's the Dev Doing?
              </h3>
              <p className="mt-2">
                The developer holds a portion of the token supply and may choose
                to sell during the round to realize profits. Watch for large
                sells from the{" "}
                <Link
                  href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/address/${process.env.NEXT_PUBLIC_DEV_WALLET}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-400 hover:text-blue-300"
                >
                  dev wallet
                </Link>{" "}
                (it ends in "00000") as they can impact price. Track the dev's
                moves on DEXScreener and plan your trades accordingly.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-orange-400">
                Lock in Profits
              </h3>
              <p className="mt-2">
                Don't get greedy. You're scored on realized PnL, not paper
                gains. If you're in the lead, sometimes the best trade is no
                trade.
              </p>
            </div>
          </div>
        </section>

        <section id="market-maker" className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">What is the Market Maker?</h2>
          <div className="space-y-4">
            <p>
              In this competition, the "Market Maker" refers to all the
              mechanisms that profit from players. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Uniswap's built-in swap fee</li>
              <li>The token developer selling their own supply</li>
              <li>An AI trading bot that competes against you</li>
            </ul>
            <p className="mt-2">
              This is a zero-sum game. When you lose money, the market maker
              wins. Trade carefully, and watch the market maker closely (it
              might have more information than you do).
            </p>
          </div>
        </section>

        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">What's allowed?</h2>
          <div className="space-y-4">
            You can use any public DeFi tools. You can use tools to output
            read-only data, but you cannot use bots or automated scripts to
            trade.
          </div>
          <div className="text-xs text-gray-400 mt-6">
            <p className="font-bold mb-2">Anti-Cheating Notice:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Top wallets will be manually reviewed after the competition
              </li>
              <li>
                Transferring assets between wallets to manipulate scores is not
                allowed
              </li>
              <li>
                Using intermediate contracts to hide asset movement is not
                allowed
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
