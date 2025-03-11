import Leaderboard from "./components/Leaderboard";
import RoundDashboard from "./components/RoundDashboard";

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <RoundDashboard />
      <Leaderboard />
    </div>
  );
}
