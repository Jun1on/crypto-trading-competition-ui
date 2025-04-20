import { ethers } from "ethers";
import competitionAbi from "../abis/Competition.json";
import erc20Abi from "../abis/ERC20.json";
import PeripheryABI from "../abis/Periphery.json";

// Initialize provider and contracts safely with type checking
let provider: ethers.JsonRpcProvider | null = null;
let competitionContract: ethers.Contract | null = null;
let peripheryContract: ethers.Contract | null = null;

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
const competitionAddress = process.env.NEXT_PUBLIC_competitionAddress;
const peripheryAddress = process.env.NEXT_PUBLIC_peripheryAddress;

// Only run in browser environment
if (typeof window !== "undefined") {
  if (rpcUrl && competitionAddress && peripheryAddress) {
    try {
      provider = new ethers.JsonRpcProvider(rpcUrl);
      competitionContract = new ethers.Contract(
        competitionAddress,
        competitionAbi,
        provider
      );
      peripheryContract = new ethers.Contract(
        peripheryAddress,
        PeripheryABI,
        provider
      );
    } catch (error) {
      console.error("Error initializing contracts:", error);
    }
  }
}

export async function getNonce(player: string): Promise<number> {
  if (!provider) return 0;

  return await provider.getTransactionCount(player);
}

export async function getStats(
  competitionAddress: string,
  playerAddress: string
): Promise<{ pnls: number[]; trades: number[] }> {
  const [pnls, trades] = await peripheryContract.getStats(
    competitionAddress,
    playerAddress
  );
  const formattedPNLs = pnls.map((pnl: bigint) =>
    Number(ethers.formatEther(pnl))
  );
  const formattedTrades = trades.map((trade: bigint) => Number(trade));
  return { pnls: formattedPNLs, trades: formattedTrades };
}

export function getPerson(index: number) {
  if (process.env.NEXT_PUBLIC_nicknames) {
    const nameData = process.env.NEXT_PUBLIC_nicknames.split(",")[index];
    if (nameData) {
      let [nickname, name, school] = nameData.split("`");
      if (!nickname) nickname = name.split(" ")[0];
      if (!school) school = process.env.NEXT_PUBLIC_DEFAULT_SCHOOL;
      return [nickname, name, school];
    }
  }
  const template = "Player " + index;
  return [template, template, process.env.NEXT_PUBLIC_DEFAULT_SCHOOL];
}

export function getNickname(index: number): string {
  try {
    if (process.env.NEXT_PUBLIC_nicknames) {
      const nickname = process.env.NEXT_PUBLIC_nicknames.split(",")[index];
      if (nickname)
        return nickname.split("`")[0] || nickname.split("`")[1].split(" ")[0];
    }
  } catch (e) {}
  return "Player " + index;
}

export async function fetchPNLData() {
  try {
    if (!peripheryContract || !competitionContract)
      return {
        participants: [],
        realizedPNLs: [],
        unrealizedPNLs: [],
        mmRealized: 0,
        mmUnrealized: 0,
      };

    const [
      participants,
      realizedPNLs,
      unrealizedPNLs,
      mmRealized,
      mmUnrealized,
    ] = await peripheryContract.getPNLs(competitionAddress);

    // Convert all BigInt values to regular numbers
    const formattedRealizedPNLs = realizedPNLs.map((pnl: bigint) =>
      Number(ethers.formatEther(pnl))
    );

    const formattedUnrealizedPNLs = unrealizedPNLs.map((pnl: bigint) =>
      Number(ethers.formatEther(pnl))
    );

    return {
      // Convert addresses to strings to ensure they're serializable
      participants: participants.map((p: any) => p.toString()),
      realizedPNLs: formattedRealizedPNLs,
      unrealizedPNLs: formattedUnrealizedPNLs,
      mmRealized: Number(ethers.formatEther(mmRealized)),
      mmUnrealized: Number(ethers.formatEther(mmUnrealized)),
    };
  } catch (error) {
    console.error("Error fetching PNL data:", error);
    return {
      participants: [],
      realizedPNLs: [],
      unrealizedPNLs: [],
      mmRealized: 0,
      mmUnrealized: 0,
    };
  }
}

export async function fetchParticipationData() {
  try {
    if (!peripheryContract) {
      return {
        latestRound: null,
        participants: [],
        participationScores: [],
        trades: [],
      };
    }

    // getParticipation doesn't need _round parameter in the updated API
    const result = await peripheryContract.getParticipation(competitionAddress);

    // Check if result is structured as expected
    if (!result || !Array.isArray(result) || result.length < 3) {
      console.error(
        "Unexpected response format from getParticipation:",
        result
      );
      return {
        latestRound: null,
        participants: [],
        participationScores: [],
        trades: [],
      };
    }

    const [latestRound, participants, participationScores, trades] = result;

    // Ensure participants is an array
    const participantsArray = Array.isArray(participants)
      ? participants
      : participants &&
        typeof participants === "object" &&
        "length" in participants
      ? Array.from(participants)
      : [];

    // Ensure scores is an array
    const scoresArray = Array.isArray(participationScores)
      ? participationScores
      : participationScores &&
        typeof participationScores === "object" &&
        "length" in participationScores
      ? Array.from(participationScores)
      : [];

    // Ensure trades is an array
    const tradesArray = Array.isArray(trades)
      ? trades
      : trades && typeof trades === "object" && "length" in trades
      ? Array.from(trades)
      : [];

    // Convert BigInt values to numbers
    const formattedScores = scoresArray.map((score: any) =>
      typeof score === "bigint" ? Number(score) : Number(score || 0)
    );

    const formattedTrades = tradesArray.map((tradeCount: any) =>
      typeof tradeCount === "bigint"
        ? Number(tradeCount)
        : Number(tradeCount || 0)
    );

    // Convert participants to strings safely
    const formattedParticipants = participantsArray.map((p: any) =>
      p ? p.toString() : ""
    );

    return {
      latestRound: Number(latestRound),
      participants: formattedParticipants,
      participationScores: formattedScores,
      trades: formattedTrades,
    };
  } catch (error) {
    console.error("Error fetching participation data:", error);
    return {
      latestRound: null,
      participants: [],
      participationScores: [],
      trades: [],
    };
  }
}

export async function getLatestRoundDetails(
  address?: string,
  roundNumber?: number
) {
  try {
    if (roundNumber === undefined) {
      roundNumber = ethers.MaxUint256;
    }

    if (!peripheryContract) {
      return {
        USDM: "",
        latestRound: 0,
        name: "",
        symbol: "",
        token: "",
        startTimestamp: 0,
        endTimestamp: 0,
        airdropPerParticipantUSDM: 0,
        usdmBalance: 0,
        tokenBalance: 0,
        trades: 0,
      };
    }

    const competitionAddress = process.env.NEXT_PUBLIC_competitionAddress || "";
    const participantAddress =
      address || "0x0000000000000000000000000000000000000000";

    const result = await peripheryContract.getRoundDetails(
      competitionAddress,
      roundNumber,
      participantAddress
    );

    return {
      USDM: result[0],
      latestRound: Number(result[1]),
      name: result[2],
      symbol: result[3],
      token: result[4],
      startTimestamp: Number(result[5]),
      endTimestamp: Number(result[6]),
      airdropPerParticipantUSDM: Number(ethers.formatEther(result[7])),
      usdmBalance: Number(ethers.formatEther(result[8])),
      tokenBalance: Number(ethers.formatEther(result[9])),
      trades: Number(result[10]),
    };
  } catch (error) {
    console.error("Error fetching round details:", error);
    return {
      USDM: "",
      latestRound: 0,
      name: "",
      symbol: "",
      token: "",
      startTimestamp: 0,
      endTimestamp: 0,
      airdropPerParticipantUSDM: 0,
    };
  }
}

export async function fetchLatestRoundPNL(roundNumber?: number) {
  try {
    if (roundNumber === undefined) {
      roundNumber = ethers.MaxUint256;
    }

    if (!peripheryContract) {
      return {
        latestRound: 0,
        participants: [],
        realizedPNLs: [],
        unrealizedPNLs: [],
        mmRealized: 0,
        mmUnrealized: 0,
      };
    }

    const [
      participants,
      realizedPNLs,
      unrealizedPNLs,
      mmRealized,
      mmUnrealized,
    ] = await peripheryContract.getRoundPNLs(competitionAddress, roundNumber);

    // Fetch current round number from competition contract
    const latestRoundBN = competitionContract
      ? await competitionContract.currentRound()
      : BigInt(0);

    // Convert BigInt arrays to number arrays
    const formattedRealizedPNLs = Array.isArray(realizedPNLs)
      ? (realizedPNLs as bigint[]).map((pnl) => Number(ethers.formatEther(pnl)))
      : [];
    const formattedUnrealizedPNLs = Array.isArray(unrealizedPNLs)
      ? (unrealizedPNLs as bigint[]).map((pnl) =>
          Number(ethers.formatEther(pnl))
        )
      : [];

    return {
      latestRound: Number(latestRoundBN.toString()),
      participants: Array.isArray(participants)
        ? participants.map((p: any) => p.toString())
        : [],
      realizedPNLs: formattedRealizedPNLs,
      unrealizedPNLs: formattedUnrealizedPNLs,
      mmRealized: Number(ethers.formatEther(mmRealized)),
      mmUnrealized: Number(ethers.formatEther(mmUnrealized)),
    };
  } catch (error) {
    console.error("Error fetching latest round PNL data:", error);
    return {
      latestRound: 0,
      participants: [],
      realizedPNLs: [],
      unrealizedPNLs: [],
      mmRealized: 0,
      mmUnrealized: 0,
    };
  }
}
