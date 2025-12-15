import { Router, Request, Response } from "express";
import { paymentMiddleware, Resource } from "x402-express";
import { PAYMENT_CONFIG, getFacilitatorUrl, getPaymentAddress, isPaymentConfigured } from "../config/payment.config.js";

const router = Router();
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";



// Helper function to make CoinGecko API calls
async function callCoinGeckoAPI(endpoint: string, params?: Record<string, string>) {
  const url = new URL(`${COINGECKO_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'x-cg-demo-api-key': process.env.COINGEKO_API_KEY!
    }
  });

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// 1. GET /simple/price - Get current price for multiple tokens
router.get(
  "/simple/price",
  async (req: Request, res: Response) => {
    console.log("🪙 GET /coingecko/simple/price - Fetching token prices");

    try {
      const {
        ids,
        vs_currencies,
        include_market_cap,
        include_24hr_vol,
        include_24hr_change,
        include_last_updated_at,
        precision
      } = req.query;

      // Validate required parameters
      if (!ids || !vs_currencies) {
        return res.status(400).json({
          error: "Missing required parameters",
          required: ["ids", "vs_currencies"],
          message: "Both 'ids' and 'vs_currencies' are required parameters"
        });
      }

      // Build query parameters
      const params: Record<string, string> = {
        ids: ids as string,
        vs_currencies: vs_currencies as string,
      };

      // Add optional parameters if provided
    
      if (include_market_cap) params.include_market_cap = include_market_cap as string;
      if (include_24hr_vol) params.include_24hr_vol = include_24hr_vol as string;
      if (include_24hr_change) params.include_24hr_change = include_24hr_change as string;
      if (include_last_updated_at) params.include_last_updated_at = include_last_updated_at as string;
      if (precision) params.precision = precision as string;

      const data = await callCoinGeckoAPI("/simple/price", params);

      res.json({
        success: true,
        data,
        parameters: params
      });
    } catch (error) {
      console.error("❌ Error fetching simple price:", error);
      res.status(500).json({
        error: "Failed to fetch price data",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

// 2. GET /search/trending - Get trending coins (no parameters)
router.get(
  "/search/trending",
  async (req: Request, res: Response) => {
    console.log("🔥 GET /coingecko/search/trending - Fetching trending coins");

    try {
      const data = await callCoinGeckoAPI("/search/trending");

      res.json({
        success: true,
        data,
        message: "Trending coins fetched successfully"
      });
    } catch (error) {
      console.error("❌ Error fetching trending coins:", error);
      res.status(500).json({
        error: "Failed to fetch trending coins",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

// 3. GET /coins/list/new - Get newly listed coins (no parameters)
router.get(
  "/coins/list/new",
  async (req: Request, res: Response) => {
    console.log("🆕 GET /coingecko/coins/list/new - Fetching newly listed coins");

    try {
      const data = await callCoinGeckoAPI("/coins/list/new");

      res.json({
        success: true,
        data,
        message: "Newly listed coins fetched successfully"
      });
    } catch (error) {
      console.error("❌ Error fetching new coins:", error);
      res.status(500).json({
        error: "Failed to fetch new coins",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

// 4. GET /coins/:chainId/contract/:tokenAddress - Get token data by contract address
router.get(
  "/coins/:chainId/contract/:tokenAddress",
  async (req: Request, res: Response) => {
    console.log("📍 GET /coingecko/coins/:chainId/contract/:tokenAddress - Fetching token by address");

    try {
      const { chainId, tokenAddress } = req.params;
      const {
        localization,
        tickers,
        market_data,
        community_data,
        developer_data,
        sparkline
      } = req.query;

      // Validate required path parameters
      if (!chainId || !tokenAddress) {
        return res.status(400).json({
          error: "Missing required path parameters",
          required: ["chainId", "tokenAddress"],
          message: "Both 'chainId' and 'tokenAddress' are required in the URL path"
        });
      }

      // Build query parameters for optional data
      const params: Record<string, string> = {};
      if (localization !== undefined) params.localization = localization as string;
      if (tickers !== undefined) params.tickers = tickers as string;
      if (market_data !== undefined) params.market_data = market_data as string;
      if (community_data !== undefined) params.community_data = community_data as string;
      if (developer_data !== undefined) params.developer_data = developer_data as string;
      if (sparkline !== undefined) params.sparkline = sparkline as string;

      const endpoint = `/coins/${chainId}/contract/${tokenAddress}`;
      const data = await callCoinGeckoAPI(endpoint, Object.keys(params).length > 0 ? params : undefined);

      res.json({
        success: true,
        data,
        parameters: {
          chainId,
          tokenAddress,
          ...params
        }
      });
    } catch (error) {
      console.error("❌ Error fetching token by address:", error);
      res.status(500).json({
        error: "Failed to fetch token data",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

export default router;
