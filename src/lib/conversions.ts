export type UnitType = 'weight' | 'volume' | 'count';
export type Unit = 'g' | 'kg' | 'L' | 'mL' | 'items';

export interface UnitInfo {
  name: string;
  symbol: Unit;
  type: UnitType;
}

export const UNITS: Record<Unit, UnitInfo> = {
  g: { name: 'grams', symbol: 'g', type: 'weight' },
  kg: { name: 'kilograms', symbol: 'kg', type: 'weight' },
  mL: { name: 'milliliters', symbol: 'mL', type: 'volume' },
  L: { name: 'liters', symbol: 'L', type: 'volume' },
  items: { name: 'items', symbol: 'items', type: 'count' },
};

export const UNIT_TYPES: Record<UnitType, Unit[]> = {
  weight: ['g', 'kg'],
  volume: ['mL', 'L'],
  count: ['items'],
};

/**
 * Get conversion factor F from targetUnit (order unit) to baseUnit.
 * Multiplied by order quantity gives base quantity.
 * Multiplied by base price gives order unit price.
 * 
 * baseQuantity = orderQuantity * F
 * orderUnitPrice = baseUnitPrice * F
 */
export function getConversionFactor(baseUnit: Unit, targetUnit: Unit): number {
  if (baseUnit === targetUnit) return 1;

  const baseInfo = UNITS[baseUnit];
  const targetInfo = UNITS[targetUnit];

  if (!baseInfo || !targetInfo || baseInfo.type !== targetInfo.type) {
    throw new Error(`Incompatible units: cannot convert from ${targetUnit} to ${baseUnit}`);
  }

  // Weight conversions
  if (baseInfo.type === 'weight') {
    if (baseUnit === 'kg' && targetUnit === 'g') return 0.001;
    if (baseUnit === 'g' && targetUnit === 'kg') return 1000;
  }

  // Volume conversions
  if (baseInfo.type === 'volume') {
    if (baseUnit === 'L' && targetUnit === 'mL') return 0.001;
    if (baseUnit === 'mL' && targetUnit === 'L') return 1000;
  }

  return 1;
}

/**
 * Formats a unit symbol for user-friendly display
 */
export function formatUnit(qty: number | string, unit: Unit): string {
  const numericQty = typeof qty === 'string' ? parseFloat(qty) : qty;
  return `${numericQty.toLocaleString('en-IN', { maximumFractionDigits: 4 })} ${unit}`;
}

/**
 * Formats a price in INR
 */
export function formatINR(price: number | string): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `₹${numericPrice.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
