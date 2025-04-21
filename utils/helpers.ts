export const pnlColor = (value: number) => {
  if (value > 0) return "text-green-400";
  if (value < 0) return "text-red-400";
  return "text-gray-400";
};

export const formatNumber = (
  num: number,
  minimumFractionDigits: number = 0
) => {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatPNL = (PNL: number) => {
  return `${PNL > 0 ? "+$" : "-$"}${formatNumber(Math.abs(PNL))}`;
};

export const truncateAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
};
