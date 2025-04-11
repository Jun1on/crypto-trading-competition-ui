import { ethers } from "ethers";
import competitionAbi from "../abis/Competition.json";
import erc20Abi from "../abis/ERC20.json";
import PeripheryABI from "../abis/Periphery.json";

// Helper function to get provider and contracts when needed
// Instead of initializing at the module level
const getContracts = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return { provider: null, competitionContract: null, peripheryContract: null };
  }
  
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || '';
  const competitionAddress = process.env.NEXT_PUBLIC_competitionAddress || '';
  const peripheryAddress = process.env.NEXT_PUBLIC_peripheryAddress || '';
  
  if (!rpcUrl || !competitionAddress || !peripheryAddress) {
    console.error("Missing environment variables for contract initialization");
    return { provider: null, competitionContract: null, peripheryContract: null };
  }
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const competitionContract = new ethers.Contract(
    competitionAddress,
    competitionAbi,
    provider
  );
  const peripheryContract = new ethers.Contract(
    peripheryAddress,
    PeripheryABI,
    provider
  );
  
  return { provider, competitionContract, peripheryContract };
};

export async function getParticipants(): Promise<string[]> {
  const { competitionContract } = getContracts();
  if (!competitionContract) return [];
  
  const length = await competitionContract.participantsLength();
  let promises = [];
  for (let i = 0; i < length; i++) {
    promises.push(competitionContract.participants(i));
  }
  return await Promise.all(promises);
}

export async function getPNL(player: string) {
  const { competitionContract } = getContracts();
  if (!competitionContract) return { realizedPNL: 0, unrealizedPNL: 0 };
  
  const [realizedPNL, unrealizedPNL] = await competitionContract.getPNL(player);

  return {
    realizedPNL: parseFloat(ethers.formatEther(realizedPNL)),
    unrealizedPNL: parseFloat(ethers.formatEther(unrealizedPNL)),
  };
}

export async function getCurrentRound(): Promise<number> {
  const { competitionContract } = getContracts();
  if (!competitionContract) return 0;
  
  return Number((await competitionContract.currentRound()).toString());
}

export async function getCurrentToken(): Promise<string> {
  const { competitionContract } = getContracts();
  if (!competitionContract) return '';
  
  return await competitionContract.currentToken();
}

export async function getPlayerPNLHistory(player: string, currentRound: number) {
  const { competitionContract } = getContracts();
  if (!competitionContract) return [];
  
  const history = [];
  for (let i = 0; i < currentRound; i++) {
    const pnl = await competitionContract.playerPNLHistory(player, i);
    history.push(pnl);
  }
  return history;
}

export async function getNonce(player: string): Promise<number> {
  const { provider } = getContracts();
  if (!provider) return 0;
  
  return await provider.getTransactionCount(player);
}

export async function getTokenInfo(tokenAddress: string): Promise<[string, string]> {
  const { provider } = getContracts();
  if (!provider) return ['', ''];
  
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
    const { peripheryContract } = getContracts();
    if (!peripheryContract) return { participants: [], realizedPNLs: [], unrealizedPNLs: [] };
    
    const competitionAddress = process.env.NEXT_PUBLIC_competitionAddress || '';
    if (!competitionAddress) {
      return { participants: [], realizedPNLs: [], unrealizedPNLs: [] };
    }
    
    const [participants, realizedPNLs, unrealizedPNLs] =
      await peripheryContract.getPNLs(competitionAddress);

    const formattedRealizedPNLs = realizedPNLs.map((pnl: bigint) =>
      Number(ethers.formatEther(pnl))
    );

    const formattedUnrealizedPNLs = unrealizedPNLs.map((pnl: bigint) =>
      Number(ethers.formatEther(pnl))
    );

    return {
      participants,
      realizedPNLs: formattedRealizedPNLs,
      unrealizedPNLs: formattedUnrealizedPNLs,
    };
  } catch (error) {
    console.error("Error fetching PNL data:", error);
    return {
      participants: [],
      realizedPNLs: [],
      unrealizedPNLs: [],
    };
  }
}

export async function fetchParticipationData() {
  try {
    const { peripheryContract } = getContracts();
    if (!peripheryContract) return { participants: [], participationScores: [] };
    
    const competitionAddress = process.env.NEXT_PUBLIC_competitionAddress || '';
    if (!competitionAddress) {
      return { participants: [], participationScores: [] };
    }
    
    const [participants, participationScores] =
      await peripheryContract.getParticipation(competitionAddress);

    const formattedScores = participationScores.map((score: any) =>
      Number(score)
    );

    return {
      participants,
      participationScores: formattedScores,
    };
  } catch (error) {
    console.error("Error fetching participation data:", error);
    return {
      participants: [],
      participationScores: [],
    };
  }
}
