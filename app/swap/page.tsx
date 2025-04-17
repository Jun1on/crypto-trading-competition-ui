"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ethers,
  BrowserProvider,
  parseUnits,
  formatUnits,
  ZeroAddress,
  type Signer,
  type Provider,
  type BigNumberish,
} from "ethers";
// Updated wagmi imports
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { getLatestRoundDetails } from "../../utils/contract"; // Assuming this path is correct
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowDownIcon,
  QuestionMarkCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// Import viem types used in adapters
import type {
  Account,
  Chain,
  Client,
  Transport,
  PublicClient,
  WalletClient,
} from "viem";
import { useSimpleMode } from "@/app/components/Header";
import {
  multicallWithRpcCycling,
  prepareBalanceCalls,
  ERC20_ABI,
  ROUTER_ABI,
  MULTICALL_ABI,
  V2_ROUTER_ADDRESS,
} from "./swapUtils";

const REFETCH_INTERVAL = 10000;
const RECALCULATE_INTERVAL = 500;

// --- Ethers Adapters for Wagmi v2 --- (Further Refinement)
function publicClientToProvider(publicClient: PublicClient): Provider {
  const { chain, transport } = publicClient;
  const network = chain
    ? {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
      }
    : { chainId: 0, name: "unknown" };

  // --- Transport Handling ---
  // 1. Fallback Transport
  if (transport.type === "fallback" && Array.isArray(transport.transports)) {
    // Let TS infer the array type based on what's pushed
    const providers = [];
    for (const t of transport.transports) {
      if (
        typeof t === "object" &&
        t !== null &&
        "value" in t &&
        typeof t.value === "object" &&
        t.value !== null
      ) {
        const innerClient = t.value as PublicClient;
        const innerChain = innerClient.chain;
        const innerTransport = innerClient.transport;
        if (!innerChain) continue;
        const innerNetwork = {
          chainId: innerChain.id,
          name: innerChain.name,
          ensAddress: innerChain.contracts?.ensRegistry?.address,
        };
        let url: string | undefined;
        if (
          typeof innerTransport === "object" &&
          innerTransport !== null &&
          "url" in innerTransport &&
          typeof innerTransport.url === "string"
        ) {
          url = innerTransport.url;
        }
        try {
          // JsonRpcProvider extends AbstractProvider, so pushing it should be fine
          providers.push(
            new ethers.JsonRpcProvider(url ?? undefined, innerNetwork)
          );
        } catch (e) {
          console.warn(
            "Failed to create provider for fallback transport item:",
            e
          );
        }
      }
    }
    if (providers.length === 0) {
      console.error(
        "Fallback transport: No valid underlying providers created."
      );
      return new ethers.JsonRpcProvider(undefined, network);
    }
    // Pass the inferred array of providers (should be compatible with AbstractProvider[])
    return new ethers.FallbackProvider(providers);
  }

  // 2. HTTP/WebSocket/Other (Try extracting URL)
  let potentialUrl: string | undefined;
  if (
    typeof transport === "object" &&
    transport !== null &&
    "url" in transport &&
    typeof transport.url === "string"
  ) {
    potentialUrl = transport.url;
  }
  return new ethers.JsonRpcProvider(potentialUrl ?? undefined, network);
}

function walletClientToSigner(walletClient: WalletClient): Signer {
  const { account, chain, transport } = walletClient;
  if (!chain || !account) {
    throw new Error("Wallet client is not connected or has no account.");
  }
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  // Keep the `any` cast as a necessary workaround for BrowserProvider type mismatch
  const provider = new BrowserProvider(transport as any, network);
  const signer = new ethers.JsonRpcSigner(provider, account.address);
  return signer;
}

// --- Helper Functions ---
// Updated to accept bigint
const formatBalance = (value: bigint, decimals: number = 18): string => {
  try {
    const formatted = formatUnits(value);
    const num = parseFloat(formatted);
    if (isNaN(num)) return "0.0000";
    // Improved formatting to avoid tiny numbers in scientific notation
    if (num > 0 && num < 0.0001) {
      return num.toPrecision(4);
    } else if (num > 100000) {
      // Avoid adding .0000 to large whole numbers
      return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else {
      return num.toFixed(4);
    }
  } catch {
    return "0.0000";
  }
};

// --- Types --- Define Confirmation Details Interface
interface SwapConfirmationDetails {
  inputAmount: string;
  inputSymbol?: string;
  outputAmount: string;
  outputSymbol?: string;
  txHash: string;
}

// --- Component ---
const SwapPage = () => {
  const { isSimpleMode } = useSimpleMode();
  // Wallet State - Use wagmi v2 hooks
  const { address: accountAddress, isConnected } = useAccount();
  // Ensure clients are of the expected type or undefined
  const publicClient = usePublicClient() as PublicClient | undefined;
  const { data: walletClient } = useWalletClient() as {
    data?: WalletClient | undefined;
  };

  // Ethers Provider and Signer using Memoized Adapters
  const provider = useMemo((): Provider | undefined => {
    if (!publicClient) return undefined;
    try {
      return publicClientToProvider(publicClient);
    } catch (e) {
      console.error("Provider Creation Error:", e);
      toast.error("Network provider setup failed.", { id: "provider-err" });
      return undefined;
    }
  }, [publicClient]);

  const signer = useMemo((): Signer | undefined => {
    if (!walletClient) return undefined;
    try {
      return walletClientToSigner(walletClient);
    } catch (e) {
      console.error("Signer Creation Error:", e);
      return undefined;
    }
  }, [walletClient]);

  // Round State - Added airdropAmount to type
  const [roundDetails, setRoundDetails] = useState<{
    currentRound: number;
    tokenAddress: string | null;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimals: number;
    startTime: number;
    endTime: number;
    airdropAmount: number; // Added based on contract details type
    USDM: string | null;
    usdmDecimals: number;
    usdmSymbol: string;
  } | null>(null);
  const [isRoundLoading, setIsRoundLoading] = useState(true);
  const [isRoundEnded, setIsRoundEnded] = useState(false);

  // Swap UI State - Use bigint for balances
  const [inputAmount, setInputAmount] = useState<string>("");
  const [outputAmount, setOutputAmount] = useState<string>("");
  const [isCalculatingOutput, setIsCalculatingOutput] = useState(false);
  const [isInputUSDM, setIsInputUSDM] = useState(true); // true: USDM -> Token, false: Token -> USDM
  const [inputBalance, setInputBalance] = useState<bigint>(BigInt(0));
  const [outputBalance, setOutputBalance] = useState<bigint>(BigInt(0));

  // Transaction State
  const [isSwapping, setIsSwapping] = useState(false);

  // Price Info & Confirmation Modal State
  const [priceInfo, setPriceInfo] = useState<string | null>(null);
  const [priceImpact, setPriceImpact] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [confirmationDetails, setConfirmationDetails] =
    useState<SwapConfirmationDetails | null>(null);

  // State to prevent hydration errors
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Add state for pre-start warning
  const [isPreStart, setIsPreStart] = useState(false);

  // Skeleton Theme
  const skeletonBaseColor = "#2d3748";
  const skeletonHighlightColor = "#4a5568";

  // --- Effects ---

  // Fetch Round Details Periodically
  const fetchRoundInfo = useCallback(async () => {
    if (!provider) {
      return;
    }
    console.log(
      "[SwapPage] Triggering fetchRoundInfo at",
      new Date().toLocaleTimeString()
    ); // Log trigger
    try {
      // Fetch details using the available provider
      const details = await getLatestRoundDetails(); // This should contain the necessary symbols
      const now = Math.floor(Date.now() / 1000);
      const ended = details.endTimestamp > 0 && now >= details.endTimestamp;
      setIsRoundEnded(ended);

      // Check if round has not started yet
      const isBeforeStart =
        details.startTimestamp > 0 && now < details.startTimestamp;
      setIsPreStart(isBeforeStart);

      // --- Hardcode Decimals & Use Existing Symbols ---
      const tokenDecimals = 18;
      const usdmDecimals = 18;
      const tokenSymbol = details.symbol;
      const usdmSymbol = "USDM";

      setRoundDetails({
        currentRound: details.latestRound,
        tokenAddress: details.token,
        tokenName: details.name,
        tokenSymbol: tokenSymbol,
        tokenDecimals: tokenDecimals,
        startTime: details.startTimestamp,
        endTime: details.endTimestamp,
        airdropAmount: details.airdropPerParticipantUSDM,
        USDM: details.USDM,
        usdmDecimals: usdmDecimals,
        usdmSymbol: usdmSymbol,
      });
    } catch (error) {
      console.error("Error fetching round info:", error);
      toast.error("Could not fetch round details.");
      setIsRoundEnded(true); // Assume ended if fetch fails
      setRoundDetails(null);
    } finally {
      setIsRoundLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    if (provider) {
      fetchRoundInfo(); // Fetch immediately if provider exists
    }
    const interval = setInterval(() => {
      if (provider) {
        fetchRoundInfo(); // Continue fetching if provider exists
      }
    }, REFETCH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchRoundInfo, provider]); // Re-run if provider changes

  // Calculate Output Amount & Fetch Balances via Multicall (Handles Initial Load too)
  useEffect(() => {
    const calculateOutputAndFetchBalances = async () => {
      setIsCalculatingOutput(true);

      const isInputValid =
        inputAmount &&
        parseFloat(inputAmount) > 0 &&
        !isNaN(parseFloat(inputAmount));

      if (
        !provider ||
        !roundDetails ||
        !roundDetails.tokenAddress ||
        !roundDetails.USDM ||
        !accountAddress
      ) {
        if (!isInputValid) setOutputAmount(""); // Clear output only if input invalid
        setIsCalculatingOutput(false);
        return;
      }

      const {
        tokenAddress,
        USDM,
        tokenDecimals,
        usdmDecimals,
        usdmSymbol,
        tokenSymbol,
      } = roundDetails;
      const inputTokenAddr = isInputUSDM ? USDM : tokenAddress;
      const outputTokenAddr = isInputUSDM ? tokenAddress : USDM;
      const inputDec = isInputUSDM ? usdmDecimals : tokenDecimals;
      const outputDec = isInputUSDM ? tokenDecimals : usdmDecimals;

      // Reset output and price if input becomes invalid
      if (!isInputValid) {
        setOutputAmount("");
        setPriceInfo(null);
        setPriceImpact(null);
      }

      if (
        !inputTokenAddr ||
        inputTokenAddr === ZeroAddress ||
        !outputTokenAddr ||
        outputTokenAddr === ZeroAddress
      ) {
        console.error("Invalid token addresses for multicall.");
        setOutputAmount("0");
        setIsCalculatingOutput(false);
        return;
      }

      try {
        // Prepare Interfaces
        const erc20Interface = new ethers.Interface(ERC20_ABI);
        const routerInterface = new ethers.Interface(ROUTER_ABI);
        // --- Prepare Base Call Data (Balances) ---
        const calls = prepareBalanceCalls({
          inputTokenAddr,
          outputTokenAddr,
          accountAddress,
          erc20Interface,
        });
        // --- Conditionally Add Main getAmountsOut & Spot Price getAmountsOut Calls ---
        let mainAmountsOutCallData: string | undefined = undefined;
        let spotAmountsOutCallData: string | undefined = undefined;
        let smallAmountIn: bigint = BigInt(0);

        if (isInputValid) {
          try {
            const amountIn = parseUnits(inputAmount, inputDec);
            const path = [inputTokenAddr!, outputTokenAddr!]; // Assert non-null after check

            // Main call data
            mainAmountsOutCallData = routerInterface.encodeFunctionData(
              "getAmountsOut",
              [amountIn, path]
            );
            calls.push({
              target: V2_ROUTER_ADDRESS,
              allowFailure: true,
              callData: mainAmountsOutCallData,
            });

            smallAmountIn = parseUnits("0.0001", inputDec);
            // Ensure smallAmountIn is not zero, otherwise skip spot price check
            if (smallAmountIn > BigInt(0)) {
              spotAmountsOutCallData = routerInterface.encodeFunctionData(
                "getAmountsOut",
                [smallAmountIn, path]
              );
              calls.push({
                target: V2_ROUTER_ADDRESS,
                allowFailure: true, // Allow spot price check to fail (e.g., insufficient liquidity for even small amount)
                callData: spotAmountsOutCallData,
              });
            } else {
              console.warn(
                "Small amount for spot price check is zero, skipping."
              );
            }
          } catch (parseError) {
            console.error(
              "Error parsing input or preparing amountsOut calls:",
              parseError
            );
            setOutputAmount("0");
            setPriceInfo(null);
            setPriceImpact(null);
            setIsCalculatingOutput(false);
            return;
          }
        }
        // --- Multicall via cycling ---
        const results = await multicallWithRpcCycling({ calls });

        // --- Decode Results ---
        const [balanceInResult, balanceOutResult] = results;
        // Amounts out results are conditional based on isInputValid
        const mainAmountsOutResult = calls.length > 2 ? results[2] : undefined;
        const spotAmountsOutResult = calls.length > 3 ? results[3] : undefined;

        // Update Balances (Always attempt)
        if (balanceInResult?.success) {
          const decodedBalance = erc20Interface.decodeFunctionResult(
            "balanceOf",
            balanceInResult.returnData
          )[0];
          setInputBalance(decodedBalance as bigint);
        } else {
          console.warn("Multicall: Failed to fetch input balance");
        }

        if (balanceOutResult?.success) {
          const decodedBalance = erc20Interface.decodeFunctionResult(
            "balanceOf",
            balanceOutResult.returnData
          )[0];
          setOutputBalance(decodedBalance as bigint);
        } else {
          console.warn("Multicall: Failed to fetch output balance");
        }

        // --- Update Output Amount, Price Info, and Price Impact ---
        if (isInputValid && mainAmountsOutResult?.success) {
          const decodedMainAmounts = routerInterface.decodeFunctionResult(
            "getAmountsOut",
            mainAmountsOutResult.returnData
          )[0];
          const estimatedOutputBigInt = decodedMainAmounts[1] as bigint;
          const estimatedOutputStr = formatUnits(estimatedOutputBigInt);
          setOutputAmount(estimatedOutputStr);

          // Calculate Effective Rate
          const inputNum = parseFloat(inputAmount);
          const outputNum = parseFloat(estimatedOutputStr);
          const effectiveRate =
            inputNum > 0 && outputNum > 0 ? outputNum / inputNum : 0;

          // Calculate Price Info string (using effective rate)
          if (effectiveRate > 0) {
            const priceStr = isInputUSDM
              ? `1 ${tokenSymbol} = $${(1 / effectiveRate).toFixed(4)}`
              : `1 ${tokenSymbol} = $${effectiveRate.toFixed(4)}`;
            setPriceInfo(priceStr);
          } else {
            setPriceInfo(null);
          }

          // Calculate Spot Rate and Price Impact (if spot call succeeded)
          if (spotAmountsOutResult?.success && smallAmountIn > BigInt(0)) {
            try {
              const decodedSpotAmounts = routerInterface.decodeFunctionResult(
                "getAmountsOut",
                spotAmountsOutResult.returnData
              )[0];
              const spotOutputBigInt = decodedSpotAmounts[1] as bigint;

              // Convert smallAmountIn and spotOutputBigInt for calculation
              // Use ethers FixedNumber for potentially better precision
              const smallInFixed = ethers.FixedNumber.fromValue(
                smallAmountIn,
                inputDec
              );
              const spotOutFixed = ethers.FixedNumber.fromValue(
                spotOutputBigInt,
                outputDec
              );

              if (!smallInFixed.isZero() && !spotOutFixed.isZero()) {
                const spotRateFixed = spotOutFixed.div(smallInFixed);
                const effectiveRateFixed = ethers.FixedNumber.fromValue(
                  estimatedOutputBigInt,
                  outputDec
                ).div(
                  ethers.FixedNumber.fromValue(
                    parseUnits(inputAmount, inputDec),
                    inputDec
                  )
                );

                // Impact = ((spot - effective) / spot) * 100
                const impactFixed = spotRateFixed
                  .sub(effectiveRateFixed)
                  .div(spotRateFixed)
                  .mul(ethers.FixedNumber.fromValue(100));
                // Convert to number, handle potential NaN/Infinity
                const impactPercent = parseFloat(impactFixed.toString());
                if (impactPercent > 0) {
                  setPriceImpact(isNaN(impactPercent) ? null : impactPercent);
                } else {
                  setPriceImpact(0);
                }
              } else {
                console.warn("Spot rate calculation yielded zero values.");
                setPriceImpact(null);
              }
            } catch (spotError) {
              console.error(
                "Error decoding or calculating spot rate:",
                spotError
              );
              setPriceImpact(null);
            }
          } else {
            console.warn(
              "Spot price call failed or was skipped, cannot calculate impact."
            );
            setPriceImpact(null); // No spot price, no impact
          }
        } else if (isInputValid) {
          // Handle case where main getAmountsOut call failed
          console.warn("Multicall: Failed to fetch main getAmountsOut");
          setOutputAmount("0");
          setPriceInfo(null);
          setPriceImpact(null);
        }
        // If input was not valid, outputAmount/priceInfo were already reset earlier
      } catch (error) {
        console.error("Error during multicall execution:", error);
        setOutputAmount("0");
        setPriceInfo(null);
        setPriceImpact(null);
      } finally {
        setIsCalculatingOutput(false);
      }
    };

    // Debounce logic remains the same
    const handler = setTimeout(() => {
      if (provider) {
        calculateOutputAndFetchBalances();
      }
    }, RECALCULATE_INTERVAL);

    return () => {
      clearTimeout(handler);
      if (isCalculatingOutput) {
        setIsCalculatingOutput(false);
      }
    };
  }, [
    inputAmount,
    roundDetails,
    isInputUSDM,
    provider,
    isRoundEnded,
    accountAddress,
    isCalculatingOutput,
  ]);

  // Refactor triggerBalanceRefresh to use Multicall
  const triggerBalanceRefresh = useCallback(async () => {
    if (!isConnected || !accountAddress || !roundDetails) return;
    console.log(
      "[SwapPage] Triggering manual balance refresh via multicall..."
    );
    const { tokenAddress, USDM } = roundDetails;
    const inputTokenAddr = isInputUSDM ? USDM : tokenAddress;
    const outputTokenAddr = isInputUSDM ? tokenAddress : USDM;
    // Ensure addresses are valid
    if (
      !inputTokenAddr ||
      inputTokenAddr === ZeroAddress ||
      !outputTokenAddr ||
      outputTokenAddr === ZeroAddress
    ) {
      console.error("Invalid token addresses for balance refresh.");
      return;
    }
    try {
      const erc20Interface = new ethers.Interface(ERC20_ABI);
      const calls = prepareBalanceCalls({
        inputTokenAddr,
        outputTokenAddr,
        accountAddress,
        erc20Interface,
      });
      const results = await multicallWithRpcCycling({ calls });
      const [balanceInResult, balanceOutResult] = results;
      if (balanceInResult?.success) {
        const decodedBalance = erc20Interface.decodeFunctionResult(
          "balanceOf",
          balanceInResult.returnData
        )[0];
        setInputBalance(decodedBalance as bigint);
      } else {
        console.warn("Manual Refresh: Failed to fetch input balance");
      }
      if (balanceOutResult?.success) {
        const decodedBalance = erc20Interface.decodeFunctionResult(
          "balanceOf",
          balanceOutResult.returnData
        )[0];
        setOutputBalance(decodedBalance as bigint);
      } else {
        console.warn("Manual Refresh: Failed to fetch output balance");
      }
    } catch (error) {
      console.error("Manual balance refresh failed:", error);
    }
  }, [isConnected, accountAddress, roundDetails, isInputUSDM]);

  // --- Handlers ---

  const handleSwapDirectionAndMax = () => {
    handleSwapDirection();
    if (!roundDetails || !provider || !isConnected) return;
    setInputAmount(formatUnits(outputBalance));
  };

  const handleSwapDirection = () => {
    if (isCalculatingOutput || isSwapping) return; // Prevent swap during calculation/swap

    // Swap amounts
    const currentInput = inputAmount;
    const currentOutput = outputAmount;
    setInputAmount(currentOutput);
    setOutputAmount(currentInput);

    // Swap balances
    const currentInputBalance = inputBalance;
    const currentOutputBalance = outputBalance;
    setInputBalance(currentOutputBalance);
    setOutputBalance(currentInputBalance);

    // Toggle direction
    setIsInputUSDM((prev) => !prev);

    // Price info will recalculate via useEffect trigger based on inputAmount change
    setPriceInfo(null); // Clear price info immediately
    setPriceImpact(null); // Clear price impact immediately
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const decimals = inputToken ? inputToken.decimals : 18; // Get decimals of current input token, default 18

    // Basic validation: allow numbers and one decimal point
    if (/^$|^[0-9]+$|^[0-9]*\.[0-9]*$/.test(value)) {
      // Check decimal places
      if (value.includes(".")) {
        const decimalPart = value.split(".")[1];
        if (decimalPart && decimalPart.length > decimals) {
          // If too many decimals, do not update the state
          return;
        }
      }

      // Prevent multiple leading zeros like "00"
      if (
        value.length > 1 &&
        value.startsWith("0") &&
        !value.startsWith("0.")
      ) {
        setInputAmount(value.substring(1));
      } else {
        setInputAmount(value);
      }
    }
  };

  const handleMaxInput = () => {
    if (!roundDetails || !provider || !isConnected) return;
    setInputAmount(formatUnits(inputBalance));
  };

  const handleSwap = async (ignorePreStart = false) => {
    // --- Input Validation ---
    let errorMsg: string | null = null;
    if (!isConnected) errorMsg = "Connect Wallet";
    else if (!provider) errorMsg = "Network provider not ready";
    else if (!signer) errorMsg = "Wallet signer not available";
    else if (isRoundEnded) errorMsg = "Round has ended";
    else if (!roundDetails || !roundDetails.tokenAddress || !roundDetails.USDM)
      errorMsg = "Round details not loaded";
    else if (!inputAmount || parseFloat(inputAmount) <= 0)
      errorMsg = "Enter a valid amount";
    else if (!outputAmount || parseFloat(outputAmount) <= 0)
      errorMsg = "Output amount not calculated";
    else if (isSwapping) errorMsg = "Swap already in progress";
    else {
      // Balance Check (using bigint)
      try {
        const inputDec = isInputUSDM
          ? roundDetails.usdmDecimals
          : roundDetails.tokenDecimals;
        if (inputBalance < parseUnits(inputAmount, inputDec)) {
          errorMsg = `Insufficient ${
            isInputUSDM ? "USDM" : roundDetails.tokenSymbol
          } balance`;
        }
      } catch {
        errorMsg = "Invalid input amount for balance check";
      }
    }

    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    // --- Proceed with Swap ---
    setIsSwapping(true);
    const toastId = toast.loading("Preparing swap...");

    // Store details for potential confirmation screen
    const swapInputAmount = inputAmount;
    const swapOutputAmount = outputAmount;
    const swapInputTokenSymbol = inputToken?.symbol;
    const swapOutputTokenSymbol = outputToken?.symbol;

    try {
      // We already validated roundDetails, signer etc. above
      const { tokenAddress, USDM, tokenDecimals, usdmDecimals } = roundDetails!;
      const inputTokenAddr = isInputUSDM ? USDM! : tokenAddress!;
      const outputTokenAddr = isInputUSDM ? tokenAddress! : USDM!;
      const inputDec = isInputUSDM ? usdmDecimals : tokenDecimals;

      const router = new ethers.Contract(
        V2_ROUTER_ADDRESS,
        ROUTER_ABI,
        signer!
      );
      const amountIn = parseUnits(inputAmount, inputDec);

      const amountOutMin = BigInt(0);

      const path = [inputTokenAddr, outputTokenAddr];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes

      toast.loading("Waiting for confirmation...", { id: toastId });

      const tx = await router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        accountAddress!,
        deadline,
        { gasLimit: 200000 }
      );

      const txHashShort = `${tx.hash.substring(0, 6)}...${tx.hash.substring(
        tx.hash.length - 4
      )}`;
      toast.loading(`Swap submitted: ${txHashShort}`, { id: toastId });

      // Wait for 1 confirmation
      const receipt = await tx.wait(1);

      if (receipt && receipt.status === 1) {
        toast.success(`Swap successful! Tx: ${txHashShort}`, {
          id: toastId,
          duration: 5000,
        });

        // --- Fetch final output balance AFTER confirmation ---
        let finalOutputAmountStr = swapOutputAmount; // Default to estimate
        let finalInputBalance = inputBalance; // Default to pre-swap
        if (outputTokenAddr && provider) {
          try {
            const erc20Interface = new ethers.Interface(ERC20_ABI);
            const multicallInterface = new ethers.Interface(MULTICALL_ABI);
            const balanceInCallData = erc20Interface.encodeFunctionData(
              "balanceOf",
              [accountAddress]
            );
            const balanceOutCallData = erc20Interface.encodeFunctionData(
              "balanceOf",
              [accountAddress]
            );

            const calls = [
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

            const multicallContract = new ethers.Contract(
              MULTICALL3_ADDRESS,
              multicallInterface,
              provider
            );
            const results: Array<{ success: boolean; returnData: string }> =
              await multicallContract.aggregate3(calls);

            const [balanceInResult, balanceOutResult] = results;

            if (balanceInResult?.success) {
              const decodedBalance = erc20Interface.decodeFunctionResult(
                "balanceOf",
                balanceInResult.returnData
              )[0];
              finalInputBalance = decodedBalance as bigint; // Update final input balance
            }
            if (balanceOutResult?.success) {
              const finalOutputBalanceBigInt =
                erc20Interface.decodeFunctionResult(
                  "balanceOf",
                  balanceOutResult.returnData
                )[0] as bigint;
              // Use the actual post-swap balance for display
              finalOutputAmountStr = formatBalance(finalOutputBalanceBigInt);
            }
          } catch (balanceError) {
            console.error(
              "Failed to fetch final balance post-swap:",
              balanceError
            );
            // Fallback to using the estimated amount in confirmation
          }
        }
        // -----------------------------------------------------

        // Set details for confirmation modal (use updated final amounts)
        const details: SwapConfirmationDetails = {
          inputAmount: swapInputAmount,
          inputSymbol: swapInputTokenSymbol,
          outputAmount: finalOutputAmountStr, // Use fetched final amount
          outputSymbol: swapOutputTokenSymbol,
          txHash: receipt.hash,
        };
        setConfirmationDetails(details);
        setShowConfirmation(true);

        setInputAmount("");
        setOutputAmount("");
        setPriceInfo(null); // Clear price info
        // Update local balance state with fetched values
        setInputBalance(finalInputBalance);
        // Output balance was implicitly updated by setting finalOutputAmountStr
        // but let's set the state explicitly if balance fetch succeeded
        if (outputTokenAddr && provider) {
          // Re-check condition for safety
          try {
            const outputContract = new ethers.Contract(
              outputTokenAddr,
              ERC20_ABI,
              provider
            );
            setOutputBalance(await outputContract.balanceOf(accountAddress!));
          } catch {}
        }
      } else {
        throw new Error(
          `Transaction failed or reverted by node. Status: ${receipt?.status}`
        );
      }
    } catch (error: any) {
      console.error("Swap Transaction Error:", error);
      let message = "Swap failed. See console for details.";
      // Try to extract common error messages
      if (error?.reason) {
        message = error.reason;
      } else if (error?.data?.message) {
        message = error.data.message;
      } else if (typeof error?.message === "string") {
        message = error.message;
      }
      // Specific check for insufficient funds often needed for gas
      if (message.toLowerCase().includes("insufficient funds")) {
        message = "Insufficient funds for gas.";
      }
      toast.error(
        `Swap failed: ${message.substring(0, 60)}${
          message.length > 60 ? "..." : ""
        }`,
        { id: toastId, duration: 6000 }
      );
    } finally {
      setIsSwapping(false);
    }
  };

  // --- Render Logic ---

  const inputToken = useMemo(
    () =>
      roundDetails && provider
        ? {
            address: isInputUSDM
              ? roundDetails.USDM
              : roundDetails.tokenAddress,
            symbol: isInputUSDM ? "USDM" : roundDetails.tokenSymbol,
            decimals: isInputUSDM
              ? roundDetails.usdmDecimals
              : roundDetails.tokenDecimals,
            balance: inputBalance,
          }
        : null,
    [roundDetails, provider, isInputUSDM, inputBalance]
  );

  const outputToken = useMemo(
    () =>
      roundDetails && provider
        ? {
            address: isInputUSDM
              ? roundDetails.tokenAddress
              : roundDetails.USDM,
            symbol: isInputUSDM ? roundDetails.tokenSymbol : "USDM",
            decimals: isInputUSDM
              ? roundDetails.tokenDecimals
              : roundDetails.usdmDecimals,
            balance: outputBalance,
          }
        : null,
    [roundDetails, provider, isInputUSDM, outputBalance]
  );

  const isDisabled = useMemo(() => {
    if (!hasMounted) return true; // Disable interaction until mounted
    return isRoundEnded || isSwapping || (isRoundLoading && !roundDetails);
  }, [hasMounted, isRoundEnded, isSwapping, isRoundLoading, roundDetails]);

  const getButtonText = useMemo(() => {
    if (!hasMounted) return "Loading..."; // Initial button text before mount
    if (!isConnected) return "Connect Wallet";
    if (!provider) return "Loading Network...";
    if (isRoundLoading && !roundDetails) return "Loading Round...";
    if (isRoundEnded) return "Round Ended";
    if (!inputToken || !outputToken) return "Loading Tokens...";
    if (!inputAmount || parseFloat(inputAmount) <= 0) return "Enter Amount";

    // Balance Check
    if (inputToken) {
      try {
        if (
          inputBalance < parseUnits(inputAmount || "0", inputToken.decimals)
        ) {
          return `Insufficient ${inputToken.symbol} Balance`;
        }
      } catch {
        return "Invalid Amount";
      }
    }

    if (isSwapping) return "Swapping...";

    const now = Date.now() / 1000;
    if (roundDetails?.startTime > 0 && now < roundDetails.startTime - 2) {
      return "Round Not Started";
    }

    return "Swap";
  }, [
    hasMounted,
    isConnected,
    provider,
    isRoundLoading,
    roundDetails, // Keep roundDetails as dep
    isRoundEnded,
    inputToken, // Keep inputToken as dep
    outputToken,
    inputAmount,
    // outputAmount, // Remove outputAmount dependency for text flicker
    inputBalance,
    isSwapping,
  ]);

  const isButtonDisabled = useMemo(() => {
    if (!hasMounted) return true; // Disable button until mounted
    let insufficientBal = false;
    if (inputToken && inputAmount && parseFloat(inputAmount) > 0) {
      try {
        insufficientBal =
          inputBalance < parseUnits(inputAmount, inputToken.decimals);
      } catch {
        insufficientBal = true;
      } // Disable on parse error
    }

    return (
      !isConnected ||
      !provider ||
      !signer ||
      (isRoundLoading && !roundDetails) ||
      isRoundEnded ||
      !inputToken ||
      !outputToken ||
      !inputAmount ||
      parseFloat(inputAmount) <= 0 ||
      insufficientBal ||
      isSwapping ||
      !outputAmount ||
      parseFloat(outputAmount) <= 0
    );
  }, [
    hasMounted,
    isConnected,
    provider,
    signer,
    isRoundLoading,
    roundDetails,
    isRoundEnded,
    inputToken,
    outputToken,
    inputAmount,
    inputBalance,
    isSwapping,
    outputAmount,
  ]);

  return (
    <>
      <div className="flex flex-col items-center px-4">
        {isSimpleMode ? (
          <h1 className="text-5xl mb-8 font-semibold text-white">
            {isInputUSDM
              ? `Buy $${roundDetails?.tokenSymbol || "TOKEN"}`
              : `Sell $${roundDetails?.tokenSymbol || "TOKEN"}`}
          </h1>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="text-5xl mb-8 font-semibold text-white cursor-help">
                  Uniswap Lite
                </h1>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="max-w-[250px]">
                  - No complicated settings
                  <br />- Easier to use
                  <br />- Faster
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <div
          className={`bg-gray-800 p-4 rounded-2xl shadow-xl w-full max-w-md border border-gray-700 relative overflow-hidden ${
            priceInfo ? "pb-0" : ""
          }`}
        >
          {(isSwapping || (isRoundLoading && !roundDetails)) && (
            <div className="absolute inset-0 bg-gray-800 bg-opacity-50 flex flex-col items-center justify-center z-20 p-4">
              <svg
                className="animate-spin h-8 w-8 text-white mb-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                {" "}
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>{" "}
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>{" "}
              </svg>
              {roundDetails?.startTime > 0 &&
                Date.now() / 1000 < roundDetails.startTime && (
                  <div className="text-center">
                    <p className="text-red-500 font-bold text-lg mb-1">
                      WARNING
                    </p>
                    <p className="text-white">
                      Round has not started yet.
                      <br />
                      Your swap will fail unless you wait until the round
                      starts.
                    </p>
                  </div>
                )}
              {isSwapping && (
                <div className="text-center">
                  <p className="text-white">
                    Use MetaMask to confirm the transaction.
                  </p>
                </div>
              )}
            </div>
          )}

          <div
            className={`bg-gray-700 p-4 rounded-t-lg relative ${
              isDisabled ? "opacity-60" : ""
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Sell</span>
              {isRoundLoading && !inputToken ? (
                <Skeleton
                  width={100}
                  height={14}
                  baseColor={skeletonBaseColor}
                  highlightColor={skeletonHighlightColor}
                />
              ) : inputToken && isConnected ? (
                <button
                  onClick={handleMaxInput}
                  disabled={isDisabled || inputBalance <= BigInt(0)}
                  className={`text-xs text-gray-400 hover:text-white disabled:opacity-50 ${
                    isDisabled || inputBalance <= BigInt(0)
                      ? "cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  Balance: {formatBalance(inputToken.balance)}
                  <span className="text-blue-400 ml-1">(Max)</span>
                </button>
              ) : null}
            </div>
            <div className="flex justify-between items-center">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                placeholder="0"
                value={inputAmount}
                onChange={handleInputChange}
                disabled={isDisabled}
                className="text-2xl font-mono bg-transparent text-white w-full focus:outline-none mr-4 disabled:opacity-50 number-input-reset"
              />
              {inputToken ? (
                <button
                  onClick={handleSwapDirection}
                  disabled={isDisabled || !inputToken || !outputToken}
                  className="bg-gray-800 text-white font-semibold py-2 px-4 rounded-xl flex items-center space-x-2 shrink-0 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Swap input and output tokens"
                >
                  <span className="text-lg">{inputToken.symbol}</span>
                </button>
              ) : (
                <Skeleton
                  width={100}
                  height={40}
                  baseColor={skeletonBaseColor}
                  highlightColor={skeletonHighlightColor}
                />
              )}
            </div>
          </div>

          <div className="flex justify-center my-[-12px] z-10 relative">
            <button
              onClick={handleSwapDirection}
              disabled={isDisabled || !inputToken || !outputToken}
              className="bg-gray-600 p-1.5 rounded-full text-gray-300 border-2 border-gray-800 hover:bg-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Swap input and output tokens"
            >
              <ArrowDownIcon className="w-5 h-5" />
            </button>
          </div>

          <div
            className={`bg-gray-700 p-4 rounded-b-lg mb-4 relative overflow-hidden ${
              isDisabled ? "opacity-60" : ""
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Buy</span>
              {isRoundLoading && !outputToken ? (
                <Skeleton
                  width={100}
                  height={14}
                  baseColor={skeletonBaseColor}
                  highlightColor={skeletonHighlightColor}
                />
              ) : outputToken && isConnected ? (
                <button
                  onClick={handleSwapDirectionAndMax}
                  disabled={isDisabled}
                  className={`text-xs text-gray-400 hover:text-white disabled:opacity-50 ${
                    isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  Balance: {formatBalance(outputToken.balance)}
                </button>
              ) : null}
            </div>
            <div className="flex justify-between items-center">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={outputAmount}
                readOnly
                disabled={isDisabled}
                className="text-2xl font-mono bg-transparent text-white w-full focus:outline-none mr-4 disabled:opacity-50 number-input-reset"
              />
              {outputToken ? (
                <button
                  onClick={handleSwapDirection}
                  disabled={isDisabled || !inputToken || !outputToken}
                  className="bg-gray-800 text-white font-semibold py-2 px-4 rounded-xl flex items-center space-x-2 shrink-0 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Swap input and output tokens"
                >
                  <span className="text-lg">{outputToken.symbol}</span>
                </button>
              ) : (
                <Skeleton
                  width={100}
                  height={40}
                  baseColor={skeletonBaseColor}
                  highlightColor={skeletonHighlightColor}
                />
              )}
            </div>
          </div>

          {!hasMounted ? (
            <Skeleton
              height={48}
              className="w-full rounded-xl"
              baseColor={skeletonBaseColor}
              highlightColor={skeletonHighlightColor}
            />
          ) : (
            <button
              onClick={() => handleSwap()}
              disabled={isButtonDisabled}
              className={`w-full py-3 px-4 rounded-xl text-lg font-semibold transition-colors duration-200 flex justify-center items-center ${
                isButtonDisabled
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : getButtonText === "Round Not Started"
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer"
                  : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              }`}
            >
              {isSwapping && (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {getButtonText}
            </button>
          )}

          {(priceInfo || priceImpact !== null) && (
            <div className="text-xs text-gray-400 text-center mt-2 mb-2 px-2 py-1 rounded-md flex justify-center items-center space-x-2">
              {priceInfo && <span>{priceInfo}</span>}
              {priceImpact !== null && !isSimpleMode && (
                <span
                  className={`font-medium ${
                    priceImpact > 15
                      ? "text-red-500"
                      : priceImpact > 5
                      ? "text-yellow-400"
                      : "text-gray-400"
                  }`}
                >
                  (Impact:{" "}
                  {priceImpact < 0
                    ? priceImpact.toFixed(2)
                    : `-${priceImpact.toFixed(2)}`}
                  %)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <QuestionMarkCircleIcon className="w-4 h-4 ml-1 inline-block text-gray-500 hover:text-gray-300 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      The difference between the current<br></br>market price
                      and the price for your<br></br>trade due to its size
                      <div className="mt-2 text-xs">
                        <Link
                          href="https://support.uniswap.org/hc/en-us/articles/8671539602317-What-is-price-impact"
                          className="text-blue-400 hover:text-blue-300 flex items-center"
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                        >
                          <span>Learn more</span>
                          <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
                        </Link>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </span>
              )}
            </div>
          )}

          {isRoundEnded && (
            <p className="text-center text-yellow-400 text-sm mt-4">
              The current round has ended. Swapping is disabled.
            </p>
          )}
        </div>
        <Toaster
          position="bottom-right"
          containerClassName="text-sm"
          toastOptions={{ className: "dark:bg-gray-700 dark:text-white" }}
        />

        {showConfirmation && confirmationDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-600">
              <h3 className="text-lg font-semibold text-white text-center mb-4">
                Swap Confirmed!
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">From:</span>
                  <span className="text-white font-medium">
                    {confirmationDetails.inputAmount}{" "}
                    {confirmationDetails.inputSymbol ?? ""}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">You now own:</span>
                  <span className="text-white font-medium">
                    {confirmationDetails.outputAmount}{" "}
                    {confirmationDetails.outputSymbol ?? ""}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                  <span className="text-gray-400">Transaction Receipt:</span>
                  <a
                    href={`https://optimistic.etherscan.io/tx/${confirmationDetails.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 truncate max-w-[150px]"
                    title={confirmationDetails.txHash}
                  >
                    {`${confirmationDetails.txHash.substring(
                      0,
                      6
                    )}...${confirmationDetails.txHash.substring(
                      confirmationDetails.txHash.length - 4
                    )}`}
                  </a>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmation(false)}
                className="mt-6 w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      <div>
        {hasMounted &&
          roundDetails &&
          roundDetails.USDM &&
          roundDetails.tokenAddress &&
          !isRoundEnded &&
          !isSimpleMode && (
            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">
                Want more buttons? Try{" "}
                <a
                  href={`https://app.uniswap.org/swap?inputCurrency=${roundDetails.USDM}&outputCurrency=${roundDetails.tokenAddress}&chain=optimism`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:rainbow-glow underline transition-all"
                >
                  Uniswap
                </a>
              </p>
            </div>
          )}
      </div>
    </>
  );
};

export default SwapPage;

if (typeof window !== "undefined") {
  let styles = `
    input[type=number].number-input-reset::-webkit-inner-spin-button,
    input[type=number].number-input-reset::-webkit-outer-spin-button {
      -webkit-appearance: none;
    }
    input[type=number].number-input-reset {
      -moz-appearance: textfield;
    }
    
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    .hover\\:rainbow-glow:hover {
      background: linear-gradient(
        to right,
        #ff00ff, #e100ff, #c300ff, #a600ff, #8900ff, #a600ff, #c300ff, #e100ff, #ff00ff
      );
      background-size: 200% auto;
      color: transparent;
      -webkit-background-clip: text;
      background-clip: text;
      animation: gradient 1.5s linear infinite;
      text-shadow: none;
      font-weight: 500;
    }
    `;
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  if (!document.getElementById("number-input-reset-styles")) {
    styleSheet.id = "number-input-reset-styles";
    document.head.appendChild(styleSheet);
  }
}
