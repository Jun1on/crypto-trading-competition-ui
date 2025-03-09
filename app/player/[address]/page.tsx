const PlayerDetails = ({ params }: { params: { address: string } }) => {
  const { address } = params;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">
        Player Details:{" "}
        {address
          ? address.slice(0, 6) + "..." + address.slice(-4)
          : "Loading..."}
      </h1>
    </div>
  );
};

export default PlayerDetails;
