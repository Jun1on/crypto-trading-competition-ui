"use client";
import Leaderboard from "./components/Leaderboard";
import RoundDashboard from "./components/RoundDashboard";
import { useAccount } from "wagmi";

export default function Home() {
  const { address } = useAccount();
  const mockParticipants = [
    "0x1234567890abcdef1234567890abcdef12345678",
    "0x2345678901abcdef2345678901abcdef23456789",
    "0x3456789012abcdef3456789012abcdef34567890",
    "0x4567890123abcdef4567890123abcdef45678901",
    "0x5678901234abcdef5678901234abcdef56789012",
  ];

  const mockRealizedPNLs = [1500.25, -450.75, 2200.0, 0.0, 875.5];
  const mockUnrealizedPNLs = [500.0, 200.5, -300.75, 150.25, -125.0];

  return (
    <div className="container mx-auto p-4">
      <RoundDashboard />
      <Leaderboard
        participants={mockParticipants}
        realizedPNLs={mockRealizedPNLs}
        unrealizedPNLs={mockUnrealizedPNLs}
        me={address}
      />
    </div>
  );
}
