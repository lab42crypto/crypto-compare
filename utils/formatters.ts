export function formatPrice(price: number): string {
  if (price === 0) return "$0";

  // Convert to string to count leading zeros after decimal point
  const priceStr = price.toString();
  const match = priceStr.match(/^0\.0+/);

  if (match) {
    const leadingZeros = match[0].length - 2; // Subtract 2 for "0."
    if (leadingZeros > 3) {
      // Find the first non-zero digit after the zeros
      const firstNonZero = priceStr.match(/[1-9]/);
      if (firstNonZero) {
        return `$0.0{${leadingZeros}}${firstNonZero[0]}`;
      }
    }
  }

  // For regular prices, use toLocaleString with fixed decimals
  return `$${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })}`;
}
