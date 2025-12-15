import { Router, Request, Response } from "express";
import { MCPServer } from "../server.js";
import { isPaymentConfigured, PAYMENT_CONFIG } from "../config/payment.config.js";

const router = Router();

// Root endpoint - Server info
router.get("/", (req: Request, res: Response) => {
  res.json({
    name: "CoinGecko MCP Server",
    version: "1.0.0",
    status: "healthy",
    paymentEnabled: isPaymentConfigured(),
    endpoints: {
      initialize: "POST /mcp/initialize",
      tools: {
        list: "GET/POST /mcp/tools",
        get_simple_price: "GET /coingecko/simple/price",
        get_trending_coins: "GET /coingecko/search/trending",
        get_new_coins: "GET /coingecko/coins/list/new",
        get_token_price_by_address: "GET /coingecko/coins/:chainId/contract/:tokenAddress"
      },
      prompts: {
        list: "GET/POST /mcp/prompts"
      },
      resources: {
        list: "GET/POST /mcp/resources"
      },
      jsonRpc: "POST /mcp",
      health: "GET /health",
      info: "GET /info"
    },
    pricing: isPaymentConfigured() ? {
      get_simple_price: PAYMENT_CONFIG.tools.get_simple_price.price,
      get_trending_coins: PAYMENT_CONFIG.tools.get_trending_coins.price,
      get_new_coins: PAYMENT_CONFIG.tools.get_new_coins.price,
      get_token_price_by_address: PAYMENT_CONFIG.tools.get_token_price_by_address.price,
      jsonRpc: PAYMENT_CONFIG.jsonRpc.price,
      network: "base-sepolia"
    } : null,
    examples: {
      get_simple_price: {
        get: "/coingecko/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
      },
      get_trending_coins: {
        get: "/coingecko/search/trending",
      },
      get_new_coins: {
        get: "/coingecko/coins/list/new",
      },
      get_token_price_by_address: {
        get: "/coingecko/coins/ethereum/contract/0x...",
      }
    },
    capabilities: {
      tools: ["get_simple_price", "get_trending_coins", "get_new_coins", "get_token_price_by_address"],
      prompts: ["crypto_price_check", "market_analysis", "token_research"],
      resources: ["coingecko://market/status", "coingecko://trending/coins", "coingecko://new/coins", "coingecko://api/info"],
    },
  });
});

// Health check endpoint
router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Info endpoint
router.get("/info", (req: Request, res: Response) => {
  res.json({
    name: "coingecko-mcp-server",
    version: "1.0.0",
    protocol: "Model Context Protocol",
    description: "MCP server providing CoinGecko crypto market data tools",
    paymentEnabled: isPaymentConfigured(),
    paymentNetwork: isPaymentConfigured() ? "base-sepolia" : null,
    capabilities: {
      tools: {
        get_simple_price: "Get current prices for multiple crypto tokens",
        get_trending_coins: "Get currently trending coins on CoinGecko",
        get_new_coins: "Get newly listed coins on CoinGecko",
        get_token_price_by_address: "Get token data by contract address",
      },
      prompts: {
        crypto_price_check: "Get current prices for popular cryptocurrencies",
        market_analysis: "Comprehensive crypto market analysis with trending and new coins",
        token_research: "Deep dive research on a specific token by contract address",
      },
      resources: {
        "coingecko://market/status": "Current crypto market overview and statistics",
        "coingecko://trending/coins": "Currently trending cryptocurrencies",
        "coingecko://new/coins": "Recently listed cryptocurrencies on CoinGecko",
        "coingecko://api/info": "CoinGecko API documentation and available endpoints",
      },
    },
    pricing: isPaymentConfigured() ? {
      tools: {
        get_simple_price: PAYMENT_CONFIG.tools.get_simple_price.price,
        get_trending_coins: PAYMENT_CONFIG.tools.get_trending_coins.price,
        get_new_coins: PAYMENT_CONFIG.tools.get_new_coins.price,
        get_token_price_by_address: PAYMENT_CONFIG.tools.get_token_price_by_address.price,
      },
      jsonRpc: PAYMENT_CONFIG.jsonRpc.price,
    } : null,
  });
});

export default router;
