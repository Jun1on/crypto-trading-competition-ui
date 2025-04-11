import { ethers } from "ethers";
import competitionAbi from "../abis/Competition.json";
import erc20Abi from "../abis/ERC20.json";
import PeripheryABI from "../abis/Periphery.json";

// Initialize provider and contracts safely with type checking
let provider: ethers.JsonRpcProvider | null = null;
let competitionContract: ethers.Contract | null = null;
let peripheryContract: ethers.Contract | null = null;

// Only run in browser environment
if (typeof window !== "undefined") {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "";
  const competitionAddress = process.env.NEXT_PUBLIC_competitionAddress || "";
  const peripheryAddress = process.env.NEXT_PUBLIC_peripheryAddress || "";

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

export async function getParticipants(): Promise<string[]> {
  if (!competitionContract) return [];

  const length = await competitionContract.participantsLength();
  let promises = [];
  for (let i = 0; i < length; i++) {
    promises.push(competitionContract.participants(i));
  }
  return await Promise.all(promises);
}

export async function getPNL(player: string) {
  if (!competitionContract) return { realizedPNL: 0, unrealizedPNL: 0 };

  const [realizedPNL, unrealizedPNL] = await competitionContract.getPNL(player);

  return {
    realizedPNL: parseFloat(ethers.formatEther(realizedPNL)),
    unrealizedPNL: parseFloat(ethers.formatEther(unrealizedPNL)),
  };
}

export async function getCurrentRound(): Promise<number> {
  if (!competitionContract) return 0;

  return Number((await competitionContract.currentRound()).toString());
}

export async function getCurrentToken(): Promise<string> {
  if (!competitionContract) return "";

  return await competitionContract.currentToken();
}

export async function getPlayerPNLHistory(
  player: string,
  currentRound: number
) {
  if (!competitionContract) return [];

  const history = [];
  for (let i = 0; i < currentRound; i++) {
    const pnl = await competitionContract.playerPNLHistory(player, i);
    history.push(pnl);
  }
  return history;
}

export async function getNonce(player: string): Promise<number> {
  if (!provider) return 0;

  return await provider.getTransactionCount(player);
}

export async function getTokenInfo(
  tokenAddress: string
): Promise<[string, string]> {
  if (!provider) return ["", ""];

  const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
  const [name, symbol] = await Promise.all([
    tokenContract.name(),
    tokenContract.symbol(),
  ]);
  return [name, symbol];
}

export function getNickname(index: number): string {
  if (process.env.NEXT_PUBLIC_nicknames) {
    const nickname = process.env.NEXT_PUBLIC_nicknames.split(",")[index];
    if (nickname) return nickname;
  }
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

    const competitionAddress = process.env.NEXT_PUBLIC_competitionAddress || "";
    if (!competitionAddress) {
      return {
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
    if (!peripheryContract)
      return {
        latestRound: null,
        participants: [],
        participationScores: [],
        trades: [],
      };

    const competitionAddress = process.env.NEXT_PUBLIC_competitionAddress || "";
    if (!competitionAddress) {
      return { participants: [], participationScores: [], trades: [] };
    }

    const result = await peripheryContract.getParticipation(competitionAddress);

    // Check if result is structured as expected
    if (!result || !Array.isArray(result) || result.length < 3) {
      console.error(
        "Unexpected response format from getParticipation:",
        result
      );
      return { participants: [], participationScores: [], trades: [] };
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

export async function getLatestRoundDetails() {
  try {
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
      };
    }

    const competitionAddress = process.env.NEXT_PUBLIC_competitionAddress || "";
    const result = await peripheryContract.getLatestRoundDetails(
      competitionAddress
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

export async function fetchLatestRoundPNL() {
  try {
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

    const competitionAddress = process.env.NEXT_PUBLIC_competitionAddress || "";
    if (!competitionAddress) {
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
      latestRound,
      participants,
      realizedPNLs,
      unrealizedPNLs,
      mmRealized,
      mmUnrealized,
    ] = await peripheryContract.getLatestRoundPNL(competitionAddress);

    // Convert all BigInt values to regular numbers
    const formattedRealizedPNLs = realizedPNLs.map((pnl: bigint) =>
      Number(ethers.formatEther(pnl))
    );

    const formattedUnrealizedPNLs = unrealizedPNLs.map((pnl: bigint) =>
      Number(ethers.formatEther(pnl))
    );

    return {
      latestRound: Number(latestRound),
      participants: participants.map((p: any) => p.toString()),
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
