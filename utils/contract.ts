import { ethers } from "ethers";
import competitionAbi from "../abis/Competition.json";
import PeripheryABI from "../abis/Periphery.json";

// --- Configuration ---
const competitionAddress = process.env.NEXT_PUBLIC_competitionAddress;
const peripheryAddress = process.env.NEXT_PUBLIC_peripheryAddress;
const rpcListString =
  process.env.NEXT_PUBLIC_RPC_LIST || process.env.NEXT_PUBLIC_RPC_URL;

let rpcUrls: string[] = [];
if (rpcListString) {
  rpcUrls = rpcListString
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

if (rpcUrls.length === 0 && (competitionAddress || peripheryAddress)) {
  // Check if any contract address is set
  console.error(
    "Error: No RPC URLs configured in NEXT_PUBLIC_RPC_LIST or NEXT_PUBLIC_RPC_URL, but contract addresses are set."
  );
}

// --- State for RPC Cycling ---
// Index for the *next* call to start its attempts from
let nextRpcIndexToStart = 0; // Renamed for clarity

// --- Cache for Providers and Contracts ---
interface RpcConnection {
  provider: ethers.JsonRpcProvider;
  competitionContract?: ethers.Contract;
  peripheryContract?: ethers.Contract;
}
const rpcConnections: { [rpcUrl: string]: RpcConnection | null } = {};

// --- Helper Function to Get Provider and Contracts for a specific RPC ---
// (No changes needed in this function)
function getProviderAndContracts(rpcUrl: string): RpcConnection | null {
  if (!rpcUrl) return null;
  if (rpcConnections[rpcUrl]) {
    return rpcConnections[rpcUrl];
  }
  try {
    if (typeof window === "undefined") {
      return null;
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    let competitionContract: ethers.Contract | undefined = undefined;
    let peripheryContract: ethers.Contract | undefined = undefined;

    if (competitionAddress) {
      competitionContract = new ethers.Contract(
        competitionAddress,
        competitionAbi,
        provider
      );
    }
    if (peripheryAddress) {
      peripheryContract = new ethers.Contract(
        peripheryAddress,
        PeripheryABI,
        provider
      );
    }
    const connection: RpcConnection = {
      provider,
      competitionContract,
      peripheryContract,
    };
    rpcConnections[rpcUrl] = connection;
    return connection;
  } catch (error) {
    console.error(
      `Error initializing provider/contracts for RPC ${rpcUrl}:`,
      error
    );
    rpcConnections[rpcUrl] = null;
    return null;
  }
}

// --- Core Retry Logic Function (Updated for Round-Robin) ---
async function executeWithRetry<T>(
  action: (contracts: RpcConnection) => Promise<T>
): Promise<T> {
  if (rpcUrls.length === 0) {
    throw new Error("No RPC URLs available to execute the action.");
  }

  const maxRetries = rpcUrls.length;
  let lastError: any = null;

  const startIndex = nextRpcIndexToStart;

  nextRpcIndexToStart = (startIndex + 1) % rpcUrls.length;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Calculate the index to try for *this attempt*, starting from startIndex
    const rpcIndexToTry = (startIndex + attempt) % rpcUrls.length;
    const rpcUrl = rpcUrls[rpcIndexToTry];
    console.log(
      `Attempt ${
        attempt + 1
      }/${maxRetries}: Trying RPC ${rpcIndexToTry} (${rpcUrl}) starting from index ${startIndex}`
    ); // Debugging

    const connection = getProviderAndContracts(rpcUrl);

    if (connection) {
      // Basic contract existence check (adjust per function if needed)
      if (!connection.peripheryContract && peripheryAddress) {
        console.warn(
          `Periphery contract not initialized for RPC ${rpcUrl}, skipping attempt.`
        );
        lastError = new Error(
          `Periphery contract not initialized for RPC ${rpcUrl}`
        );
        continue;
      }

      try {
        const result = await action(connection);
        // Success! No need to update the global index here anymore, it was updated at the start.
        // console.log(`Success with RPC ${rpcIndexToTry} (${rpcUrl})`); // Debugging
        return result; // Return successful result
      } catch (error: any) {
        lastError = error;
        console.warn(
          `RPC call failed on ${rpcUrl} (Attempt ${
            attempt + 1
          }/${maxRetries}):`,
          error.message || error
        );
        if (error.message?.includes("rate limit") || error.code === -32005) {
          console.log(`Rate limit detected on ${rpcUrl}, trying next RPC.`);
        }
        // Continue to the next RPC URL in the list for *this* call's retries
      }
    } else {
      lastError = new Error(
        `Failed to get provider/contracts for RPC ${rpcUrl}`
      );
      console.warn(
        `Could not establish connection with RPC ${rpcUrl}, trying next.`
      );
    }
  }

  // If loop finishes without success, throw the last encountered error
  console.error(
    `All RPCs failed after ${maxRetries} attempts (started trying from index ${startIndex}).`
  );
  throw lastError || new Error("All RPC calls failed.");
}

// --- Refactored Data Fetching Functions ---
// (No changes needed in the functions below this line, they just use executeWithRetry)

export async function getStats(
  _competitionAddress: string,
  playerAddress: string
): Promise<{ pnls: number[]; trades: number[] }> {
  try {
    return await executeWithRetry(async (connection) => {
      if (!connection.peripheryContract)
        throw new Error("Periphery contract is not initialized");
      if (!competitionAddress)
        throw new Error("Competition Address is not configured");

      const [pnls, trades] = await connection.peripheryContract.getStats(
        competitionAddress,
        playerAddress
      );
      const formattedPNLs = (pnls as bigint[]).map(
        (
          pnl: bigint // Added type assertion
        ) => Number(ethers.formatEther(pnl))
      );
      const formattedTrades = (trades as bigint[]).map((trade: bigint) =>
        Number(trade)
      ); // Added type assertion
      return { pnls: formattedPNLs, trades: formattedTrades };
    });
  } catch (error) {
    console.error("Error getting stats after all retries:", error);
    return { pnls: [], trades: [] };
  }
}

export function getPerson(index: number) {
  if (process.env.NEXT_PUBLIC_nicknames) {
    const nameData = process.env.NEXT_PUBLIC_nicknames.split(",")[index];
    if (nameData) {
      let [nickname, name, school] = nameData.split("`");
      if (!nickname && name)
        nickname = name.split(" ")[0]; // safe check for name
      else if (!nickname) nickname = `Player ${index}`; // fallback if name is also empty
      if (!school) school = process.env.NEXT_PUBLIC_DEFAULT_SCHOOL || "N/A"; // Add fallback for school env var
      return [nickname, name || `Player ${index}`, school];
    }
  }
  const template = "Player " + index;
  return [template, template, process.env.NEXT_PUBLIC_DEFAULT_SCHOOL || "N/A"];
}

export function getNickname(index: number): string {
  try {
    if (process.env.NEXT_PUBLIC_nicknames) {
      const participants = process.env.NEXT_PUBLIC_nicknames.split(",");
      if (index >= 0 && index < participants.length) {
        // Bounds check
        const nameData = participants[index];
        if (nameData) {
          const parts = nameData.split("`");
          const nickname = parts[0];
          const name = parts[1];
          if (nickname) return nickname;
          if (name) return name.split(" ")[0]; // Get first name if nickname is empty
        }
      }
    }
  } catch (e) {
    console.error("Error parsing nickname:", e); // Log error if parsing fails
  }
  return "Player " + index; // Default fallback
}

export async function fetchPNLData() {
  const defaultReturn = {
    participants: [],
    realizedPNLs: [],
    unrealizedPNLs: [],
    mmRealized: 0,
    mmUnrealized: 0,
  };
  try {
    return await executeWithRetry(async (connection) => {
      if (!connection.peripheryContract)
        throw new Error("Periphery contract is not initialized");
      if (!competitionAddress)
        throw new Error("Competition Address is not configured");
      const [
        participants,
        realizedPNLs,
        unrealizedPNLs,
        mmRealized,
        mmUnrealized,
      ] = await connection.peripheryContract.getPNLs(competitionAddress);
      const formattedRealizedPNLs = (realizedPNLs as bigint[]).map((pnl) =>
        Number(ethers.formatEther(pnl))
      );
      const formattedUnrealizedPNLs = (unrealizedPNLs as bigint[]).map((pnl) =>
        Number(ethers.formatEther(pnl))
      );
      return {
        participants: (participants as string[]).map((p) => p.toString()),
        realizedPNLs: formattedRealizedPNLs,
        unrealizedPNLs: formattedUnrealizedPNLs,
        mmRealized: Number(ethers.formatEther(mmRealized)),
        mmUnrealized: Number(ethers.formatEther(mmUnrealized)),
      };
    });
  } catch (error) {
    console.error("Error fetching PNL data after all retries:", error);
    return defaultReturn;
  }
}

export async function fetchParticipationData() {
  const defaultReturn = {
    latestRound: null,
    participants: [],
    participationScores: [],
    trades: [],
  };
  try {
    return await executeWithRetry(async (connection) => {
      if (!connection.peripheryContract)
        throw new Error("Periphery contract is not initialized");
      if (!competitionAddress)
        throw new Error("Competition Address is not configured");
      const result = await connection.peripheryContract.getParticipation(
        competitionAddress
      );
      if (!result || !Array.isArray(result) || result.length < 4) {
        console.error(
          "Unexpected response format from getParticipation:",
          result
        ); // Log the actual result
        throw new Error("Unexpected response format from getParticipation");
      }
      const [latestRound, participants, participationScores, trades] = result;
      const formattedParticipants = (participants as any[]).map(
        (p) => p?.toString() ?? ""
      ); // Handle null/undefined participants
      const formattedScores = (participationScores as bigint[]).map((score) =>
        Number(score)
      );
      const formattedTrades = (trades as bigint[]).map((tradeCount) =>
        Number(tradeCount)
      );
      return {
        latestRound: Number(latestRound),
        participants: formattedParticipants,
        participationScores: formattedScores,
        trades: formattedTrades,
      };
    });
  } catch (error) {
    console.error(
      "Error fetching participation data after all retries:",
      error
    );
    return defaultReturn;
  }
}

export async function getLatestRoundDetails(
  address?: string,
  roundNumber?: number
) {
  const defaultReturn = {
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
  try {
    return await executeWithRetry(async (connection) => {
      if (!connection.peripheryContract)
        throw new Error("Periphery contract is not initialized");
      if (!competitionAddress)
        throw new Error("Competition Address is not configured");
      const roundToFetch =
        roundNumber === undefined ? ethers.MaxUint256 : BigInt(roundNumber);
      const participantAddress = address || ethers.ZeroAddress;
      const result = await connection.peripheryContract.getRoundDetails(
        competitionAddress,
        roundToFetch,
        participantAddress
      );
      if (!result || !Array.isArray(result) || result.length < 11) {
        console.error(
          "Unexpected response format from getRoundDetails:",
          result
        );
        throw new Error("Unexpected response format from getRoundDetails");
      }
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
    });
  } catch (error) {
    console.error("Error fetching round details after all retries:", error);
    return defaultReturn;
  }
}

export async function fetchLatestRoundPNL(roundNumber?: number) {
  const defaultReturn = {
    latestRound: 0,
    participants: [],
    realizedPNLs: [],
    unrealizedPNLs: [],
    mmRealized: 0,
    mmUnrealized: 0,
  };
  try {
    return await executeWithRetry(async (connection) => {
      if (!connection.peripheryContract || !connection.competitionContract)
        throw new Error("Required contracts are not initialized");
      if (!competitionAddress)
        throw new Error("Competition Address is not configured");
      const roundToFetch =
        roundNumber === undefined ? ethers.MaxUint256 : BigInt(roundNumber);
      const [
        participants,
        realizedPNLs,
        unrealizedPNLs,
        mmRealized,
        mmUnrealized,
      ] = await connection.peripheryContract.getRoundPNLs(
        competitionAddress,
        roundToFetch
      );
      const latestRoundBN = await connection.competitionContract.currentRound(); // Fetch within the same retry scope
      const formattedRealizedPNLs = (realizedPNLs as bigint[]).map((pnl) =>
        Number(ethers.formatEther(pnl))
      );
      const formattedUnrealizedPNLs = (unrealizedPNLs as bigint[]).map((pnl) =>
        Number(ethers.formatEther(pnl))
      );
      const formattedParticipants = (participants as string[]).map((p) =>
        p.toString()
      );
      return {
        latestRound: Number(latestRoundBN.toString()),
        participants: formattedParticipants,
        realizedPNLs: formattedRealizedPNLs,
        unrealizedPNLs: formattedUnrealizedPNLs,
        mmRealized: Number(ethers.formatEther(mmRealized)),
        mmUnrealized: Number(ethers.formatEther(mmUnrealized)),
      };
    });
  } catch (error) {
    console.error(
      "Error fetching latest round PNL data after all retries:",
      error
    );
    return defaultReturn;
  }
}
