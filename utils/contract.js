import { ethers } from 'ethers';
import competitionAbi from '../abis/Competition.json';
import config from '../config.json';

const provider = new ethers.JsonRpcProvider(config.rpc);
const competitionAddress = config.competitionAddress;
const competitionContract = new ethers.Contract(competitionAddress, competitionAbi, provider);

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
    // Optional: simplified since they’re already BigNumbers, but original is fine too
    return { realizedPNL, unrealizedPNL };
}

export async function getCurrentRound() {
    return (await competitionContract.currentRound()).toNumber();
}

export async function getPlayerPNLHistory(player, currentRound) {
    const history = [];
    for (let i = 0; i < currentRound; i++) {
        const pnl = await competitionContract.playerPNLHistory(player, i);
        // Optional: simplified since pnl is already a BigNumber, but original is fine
        history.push(pnl);
    }
    return history;
}

export async function getNonce(player) {
    return await provider.getTransactionCount(player);
}