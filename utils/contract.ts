import { ethers } from "ethers";
import competitionAbi from "../abis/Competition.json";
import erc20Abi from "../abis/ERC20.json";
import PeripheryABI from "../abis/Periphery.json";
const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
const competitionContract = new ethers.Contract(
  process.env.NEXT_PUBLIC_competitionAddress,
  competitionAbi,
  provider
);
const peripheryContract = new ethers.Contract(
  process.env.NEXT_PUBLIC_peripheryAddress,
  PeripheryABI,
  provider
);

export async function getParticipants() {
  const length = await competitionContract.participantsLength();
  let promises = [];
  for (let i = 0; i < length; i++) {
    promises.push(competitionContract.participants(i));
  }
  return await Promise.all(promises);
}
export async function getPNL(player) {
  const [realizedPNL, unrealizedPNL] = await competitionContract.getPNL(player);

  return {
    realizedPNL: parseFloat(ethers.formatEther(realizedPNL)),
    unrealizedPNL: parseFloat(ethers.formatEther(unrealizedPNL)),
  };
}

export async function getCurrentRound() {
  return Number((await competitionContract.currentRound()).toString());
}

export async function getCurrentToken() {
  return await competitionContract.currentToken();
}

export async function getPlayerPNLHistory(player, currentRound) {
  const history = [];
  for (let i = 0; i < currentRound; i++) {
    const pnl = await competitionContract.playerPNLHistory(player, i);
    history.push(pnl);
  }
  return history;
}

export async function getNonce(player) {
  return await provider.getTransactionCount(player);
}

export async function getTokenInfo(tokenAddress) {
  const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
  const [name, symbol] = await Promise.all([
    tokenContract.name(),
    tokenContract.symbol(),
  ]);
  return [name, symbol];
}

export function getNickname(index) {
  if (process.env.NEXT_PUBLIC_nicknames) {
    const nickname = process.env.NEXT_PUBLIC_nicknames.split(",")[index];
    if (nickname) return nickname;
  }
  return "Player " + index;
}

export async function fetchPNLData() {
  try {
    const [participants, realizedPNLs, unrealizedPNLs] =
      await peripheryContract.getPNLs(
        process.env.NEXT_PUBLIC_competitionAddress
      );

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
    const [participants, participationScores] =
      await peripheryContract.getParticipation(
        process.env.NEXT_PUBLIC_competitionAddress
      );

    const formattedScores = participationScores.map((score) =>
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
