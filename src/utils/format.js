export const formatNumber = (n) => {
  if (n === null || n === undefined) return "0";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString();
};
