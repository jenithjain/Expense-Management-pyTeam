import axios from 'axios';

// Cache for exchange rates (in-memory for simplicity, consider Redis for production)
const ratesCache = new Map<string, { rates: any; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch exchange rates for a base currency
 * Caches results for 1 hour
 */
export async function getExchangeRates(baseCurrency: string): Promise<any> {
  const now = Date.now();
  const cached = ratesCache.get(baseCurrency);

  // Return cached data if still valid
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.rates;
  }

  try {
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );

    if (response.data && response.data.rates) {
      // Cache the rates
      ratesCache.set(baseCurrency, {
        rates: response.data.rates,
        timestamp: now,
      });

      return response.data.rates;
    }

    throw new Error('Invalid response from exchange rate API');
  } catch (error: any) {
    console.error('Error fetching exchange rates:', error.message);
    
    // If we have expired cache, use it as fallback
    if (cached) {
      console.warn('Using expired cache as fallback');
      return cached.rates;
    }

    throw new Error('Failed to fetch exchange rates');
  }
}

/**
 * Convert amount from one currency to another
 * @param amount - The amount to convert
 * @param fromCurrency - Source currency code (e.g., 'USD')
 * @param toCurrency - Target currency code (e.g., 'EUR')
 * @returns Converted amount rounded to 2 decimal places
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) {
    return Math.round(amount * 100) / 100;
  }

  try {
    // Get rates with fromCurrency as base
    const rates = await getExchangeRates(fromCurrency);

    if (!rates[toCurrency]) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }

    // Convert and round to 2 decimal places
    const convertedAmount = amount * rates[toCurrency];
    return Math.round(convertedAmount * 100) / 100;
  } catch (error: any) {
    console.error('Currency conversion error:', error.message);
    throw new Error(`Failed to convert from ${fromCurrency} to ${toCurrency}`);
  }
}

/**
 * Clear the rates cache (useful for testing or manual refresh)
 */
export function clearRatesCache(): void {
  ratesCache.clear();
}
