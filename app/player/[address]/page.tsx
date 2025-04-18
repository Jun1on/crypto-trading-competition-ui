import PlayerCard from './PlayerCard';

export default function Page({ params }: { params: { address: string } }) {
  return <PlayerCard address={params.address} />;
}