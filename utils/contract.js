import { ethers } from 'ethers';
import competitionAbi from '../abis/Competition.json';
import erc20Abi from '../abis/ERC20.json';

const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
const competitionContract = new ethers.Contract(process.env.NEXT_PUBLIC_competitionAddress, competitionAbi, provider);

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
        unrealizedPNL: parseFloat(ethers.formatEther(unrealizedPNL))
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
        tokenContract.symbol()
    ]);
    return [name, symbol];
}


export function getNickname(index) {
    if (process.env.NEXT_PUBLIC_nicknames) {
        const nickname = process.env.NEXT_PUBLIC_nicknames.split(', ')[index];
        if (nickname) return nickname;
    }
    return "Player " + index;
}