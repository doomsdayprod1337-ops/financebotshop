const COINGECKO_API_KEY = 'CG-AfsLKx6Dqnc3TFmp2PCrmgvD';
const BASE_URL = 'https://api.coingecko.com/api/v3';

export const cryptoService = {
  // Get current prices for multiple cryptocurrencies
  async getPrices(coinIds = ['bitcoin', 'ethereum', 'tether'], vsCurrencies = ['usd']) {
    try {
      const response = await fetch(
        `${BASE_URL}/simple/price?ids=${coinIds.join(',')}&vs_currencies=${vsCurrencies.join(',')}&x_cg_demo_api_key=${COINGECKO_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      throw error;
    }
  },

  // Get detailed market data
  async getMarketData(coinIds = ['bitcoin', 'ethereum'], vsCurrency = 'usd') {
    try {
      const response = await fetch(
        `${BASE_URL}/coins/markets?vs_currency=${vsCurrency}&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=10&page=1&sparkline=false&x_cg_demo_api_key=${COINGECKO_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  },

  // Convert bot price to crypto equivalent
  async convertPrice(usdAmount, cryptoCurrency = 'bitcoin') {
    try {
      const prices = await this.getPrices([cryptoCurrency], ['usd']);
      const cryptoPrice = prices[cryptoCurrency]?.usd;
      
      if (!cryptoPrice) {
        throw new Error(`Price not found for ${cryptoCurrency}`);
      }
      
      return {
        usdAmount,
        cryptoAmount: usdAmount / cryptoPrice,
        cryptoPrice,
        currency: cryptoCurrency
      };
    } catch (error) {
      console.error('Error converting price:', error);
      throw error;
    }
  }
};
