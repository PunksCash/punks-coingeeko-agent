import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * 
 * CoinGecko MCP Server Core
 * Provides tools, prompts, and resources for AI agents
 */
export class MCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "coingecko-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Tools Handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_simple_price",
            description: "Fetch the current price of one or more tokens using CoinGecko's /simple/price endpoint",
            inputSchema: {
              type: "object",
              properties: {
                ids: {
                  type: "string",
                  description: "Comma-separated list of token IDs (e.g., bitcoin,ethereum)",
                },
                vs_currencies: {
                  type: "string",
                  description: "Comma-separated list of quote currencies (e.g., usd,eur,inr)",
                },
                include_market_cap: {
                  type: "boolean",
                  description: "Include market cap in the response",
                },
                include_24hr_vol: {
                  type: "boolean",
                  description: "Include 24h volume in the response",
                },
                include_24hr_change: {
                  type: "boolean",
                  description: "Include 24h price change in the response",
                },
                include_last_updated_at: {
                  type: "boolean",
                  description: "Include last update timestamp in the response",
                },
                precision: {
                  type: "number",
                  description: "Decimal precision for price values",
                },
              },
              required: ["ids", "vs_currencies"],
            },
          },
          {
            name: "get_trending_coins",
            description: "Retrieve trending coins from CoinGecko using /search/trending",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "get_new_coins",
            description: "Retrieve a list of newly listed coins from CoinGecko using /coins/list/new",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "get_token_price_by_address",
            description: "Fetch USD price & market data for a token using /coins/{chainId}/contract/{tokenAddress}",
            inputSchema: {
              type: "object",
              properties: {
                chainId: {
                  type: "string",
                  description: "Blockchain identifier used by CoinGecko (e.g., ethereum, polygon-pos, binance-smart-chain)",
                },
                tokenAddress: {
                  type: "string",
                  description: "Token contract address",
                },
                localization: {
                  type: "string",
                  description: "Include localized language in response (true/false). Default: true",
                },
                tickers: {
                  type: "string",
                  description: "Include tickers data (true/false). Default: true",
                },
                market_data: {
                  type: "string",
                  description: "Include market data (true/false). Default: true",
                },
                community_data: {
                  type: "string",
                  description: "Include community data (true/false). Default: true",
                },
                developer_data: {
                  type: "string",
                  description: "Include developer data (true/false). Default: true",
                },
                sparkline: {
                  type: "string",
                  description: "Include sparkline 7 days data (true/false). Default: false",
                },
              },
              required: ["chainId", "tokenAddress"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "get_simple_price":
          return await this.handleGetSimplePrice(args as any);
        case "get_trending_coins":
          return await this.handleGetTrendingCoins(args as any);
        case "get_new_coins":
          return await this.handleGetNewCoins(args as any);
        case "get_token_price_by_address":
          return await this.handleGetTokenPriceByAddress(args as any);
        default:
          return {
            content: [
              {
                type: "text",
                text: `Error: Unknown tool ${name}`,
              },
            ],
          };
      }
    });

    // Prompts Handler
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: "crypto_price_check",
            description: "Get current prices for popular cryptocurrencies",
            arguments: [
              {
                name: "tokens",
                description: "Comma-separated list of crypto tokens (e.g., bitcoin,ethereum,solana)",
                required: true,
              },
              {
                name: "currencies",
                description: "Quote currencies (default: usd,eur)",
                required: false,
              },
            ],
          },
          {
            name: "market_analysis",
            description: "Comprehensive crypto market analysis with trending and new coins",
            arguments: [],
          },
          {
            name: "token_research",
            description: "Deep dive research on a specific token by contract address",
            arguments: [
              {
                name: "chain",
                description: "Blockchain name (e.g., ethereum, polygon-pos, binance-smart-chain)",
                required: true,
              },
              {
                name: "address",
                description: "Token contract address",
                required: true,
              },
            ],
          },
        ],
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "crypto_price_check":
          return await this.handleCryptoPriceCheckPrompt(args);
        case "market_analysis":
          return await this.handleMarketAnalysisPrompt();
        case "token_research":
          return await this.handleTokenResearchPrompt(args);
        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    });

    // Resources Handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "coingecko://market/status",
            name: "Market Status",
            description: "Current crypto market overview and statistics",
            mimeType: "application/json",
          },
          {
            uri: "coingecko://trending/coins",
            name: "Trending Coins",
            description: "Currently trending cryptocurrencies",
            mimeType: "application/json",
          },
          {
            uri: "coingecko://new/coins",
            name: "New Listings",
            description: "Recently listed cryptocurrencies on CoinGecko",
            mimeType: "application/json",
          },
          {
            uri: "coingecko://api/info",
            name: "API Information",
            description: "CoinGecko API documentation and available endpoints",
            mimeType: "text/plain",
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case "coingecko://market/status":
          return await this.handleMarketStatusResource();
        case "coingecko://trending/coins":
          return await this.handleTrendingCoinsResource();
        case "coingecko://new/coins":
          return await this.handleNewCoinsResource();
        case "coingecko://api/info":
          return await this.handleApiInfoResource();
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  getServer(): Server {
    return this.server;
  }

  getServerInfo() {
    return {
      name: "coingecko-agent-mcp-server",
      version: "1.0.0"
    };
  }

  getTools() {
    return [
      {
        name: "get_simple_price",
        description: "Fetch the current price of one or more tokens using CoinGecko's /simple/price endpoint",
        inputSchema: {
          type: "object",
          properties: {
            ids: {
              type: "string",
              description: "Comma-separated list of token IDs (e.g., bitcoin,ethereum)",
            },
            vs_currencies: {
              type: "string",
              description: "Comma-separated list of quote currencies (e.g., usd,eur,inr)",
            },
            include_market_cap: {
              type: "boolean",
              description: "Include market cap in the response",
            },
            include_24hr_vol: {
              type: "boolean",
              description: "Include 24h volume in the response",
            },
            include_24hr_change: {
              type: "boolean",
              description: "Include 24h price change in the response",
            },
            include_last_updated_at: {
              type: "boolean",
              description: "Include last update timestamp in the response",
            },
            precision: {
              type: "number",
              description: "Decimal precision for price values",
            },
          },
          required: ["ids", "vs_currencies"],
        },
      },
      {
        name: "get_trending_coins",
        description: "Retrieve trending coins from CoinGecko using /search/trending",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_new_coins",
        description: "Retrieve a list of newly listed coins from CoinGecko using /coins/list/new",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_token_price_by_address",
        description: "Fetch USD price & market data for a token using /coins/{chainId}/contract/{tokenAddress}",
        inputSchema: {
          type: "object",
          properties: {
            chainId: {
              type: "string",
              description: "Blockchain identifier used by CoinGecko (e.g., ethereum, polygon-pos, binance-smart-chain)",
            },
            tokenAddress: {
              type: "string",
              description: "Token contract address",
            },
            localization: {
              type: "string",
              description: "Include localized language in response (true/false). Default: true",
            },
            tickers: {
              type: "string",
              description: "Include tickers data (true/false). Default: true",
            },
            market_data: {
              type: "string",
              description: "Include market data (true/false). Default: true",
            },
            community_data: {
              type: "string",
              description: "Include community data (true/false). Default: true",
            },
            developer_data: {
              type: "string",
              description: "Include developer data (true/false). Default: true",
            },
            sparkline: {
              type: "string",
              description: "Include sparkline 7 days data (true/false). Default: false",
            },
          },
          required: ["chainId", "tokenAddress"],
        },
      },
    ];
  }

  getPrompts() {
    return [
      {
        name: "crypto_price_check",
        description: "Get current prices for popular cryptocurrencies",
        arguments: [
          {
            name: "tokens",
            description: "Comma-separated list of crypto tokens (e.g., bitcoin,ethereum,solana)",
            required: true,
          },
          {
            name: "currencies",
            description: "Quote currencies (default: usd,eur)",
            required: false,
          },
        ],
      },
      {
        name: "market_analysis",
        description: "Comprehensive crypto market analysis with trending and new coins",
        arguments: [],
      },
      {
        name: "token_research",
        description: "Deep dive research on a specific token by contract address",
        arguments: [
          {
            name: "chain",
            description: "Blockchain name (e.g., ethereum, polygon-pos, binance-smart-chain)",
            required: true,
          },
          {
            name: "address",
            description: "Token contract address",
            required: true,
          },
        ],
      },
    ];
  }

  getResources() {
    return [
      {
        uri: "coingecko://market/status",
        name: "Market Status",
        description: "Current crypto market overview and statistics",
        mimeType: "application/json",
      },
      {
        uri: "coingecko://trending/coins",
        name: "Trending Coins",
        description: "Currently trending cryptocurrencies",
        mimeType: "application/json",
      },
      {
        uri: "coingecko://new/coins",
        name: "New Listings",
        description: "Recently listed cryptocurrencies on CoinGecko",
        mimeType: "application/json",
      },
      {
        uri: "coingecko://api/info",
        name: "API Information",
        description: "CoinGecko API documentation and available endpoints",
        mimeType: "text/plain",
      },
    ];
  }

  async callTool(name: string, args: any) {
    switch (name) {
      case "get_simple_price":
        return await this.handleGetSimplePrice(args);
      case "get_trending_coins":
        return await this.handleGetTrendingCoins(args);
      case "get_new_coins":
        return await this.handleGetNewCoins(args);
      case "get_token_price_by_address":
        return await this.handleGetTokenPriceByAddress(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  // CoinGecko API helper
  private async callCoinGeckoAPI(endpoint: string, params?: Record<string, string>) {
    const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
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

  // CoinGecko Handlers
  private async handleGetSimplePrice(args: {
    ids: string;
    vs_currencies: string;
    include_market_cap?: boolean;
    include_24hr_vol?: boolean;
    include_24hr_change?: boolean;
    include_last_updated_at?: boolean;
    precision?: number;
  }) {
    try {
      const params: Record<string, string> = {
        ids: args.ids,
        vs_currencies: args.vs_currencies,
      };

      if (args.include_market_cap !== undefined) params.include_market_cap = String(args.include_market_cap);
      if (args.include_24hr_vol !== undefined) params.include_24hr_vol = String(args.include_24hr_vol);
      if (args.include_24hr_change !== undefined) params.include_24hr_change = String(args.include_24hr_change);
      if (args.include_last_updated_at !== undefined) params.include_last_updated_at = String(args.include_last_updated_at);
      if (args.precision !== undefined) params.precision = String(args.precision);

      const data = await this.callCoinGeckoAPI("/simple/price", params);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              data,
              parameters: params
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Failed to fetch price data",
              message: error instanceof Error ? error.message : String(error),
            }, null, 2),
          },
        ],
      };
    }
  }

  private async handleGetTrendingCoins(args: any) {
    try {
      const data = await this.callCoinGeckoAPI("/search/trending");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              data,
              message: "Trending coins fetched successfully"
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Failed to fetch trending coins",
              message: error instanceof Error ? error.message : String(error),
            }, null, 2),
          },
        ],
      };
    }
  }

  private async handleGetNewCoins(args: any) {
    try {
      const data = await this.callCoinGeckoAPI("/coins/list/new");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              data,
              message: "Newly listed coins fetched successfully"
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Failed to fetch new coins",
              message: error instanceof Error ? error.message : String(error),
            }, null, 2),
          },
        ],
      };
    }
  }

  private async handleGetTokenPriceByAddress(args: {
    chainId: string;
    tokenAddress: string;
    localization?: string;
    tickers?: string;
    market_data?: string;
    community_data?: string;
    developer_data?: string;
    sparkline?: string;
  }) {
    try {
      const { chainId, tokenAddress, ...optionalParams } = args;

      const params: Record<string, string> = {};
      if (optionalParams.localization !== undefined) params.localization = optionalParams.localization;
      if (optionalParams.tickers !== undefined) params.tickers = optionalParams.tickers;
      if (optionalParams.market_data !== undefined) params.market_data = optionalParams.market_data;
      if (optionalParams.community_data !== undefined) params.community_data = optionalParams.community_data;
      if (optionalParams.developer_data !== undefined) params.developer_data = optionalParams.developer_data;
      if (optionalParams.sparkline !== undefined) params.sparkline = optionalParams.sparkline;

      const endpoint = `/coins/${chainId}/contract/${tokenAddress}`;
      const data = await this.callCoinGeckoAPI(endpoint, Object.keys(params).length > 0 ? params : undefined);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              data,
              parameters: {
                chainId,
                tokenAddress,
                ...params
              }
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Failed to fetch token data",
              message: error instanceof Error ? error.message : String(error),
            }, null, 2),
          },
        ],
      };
    }
  }

  // Prompt Handlers
  private async handleCryptoPriceCheckPrompt(args: any) {
    const tokens = args?.tokens || "bitcoin,ethereum,solana";
    const currencies = args?.currencies || "usd,eur";
    
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please check the current prices for ${tokens} in ${currencies}. Use the get_simple_price tool with these parameters.`,
          },
        },
      ],
    };
  }

  private async handleMarketAnalysisPrompt() {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please provide a comprehensive crypto market analysis. First, get the trending coins using get_trending_coins, then fetch the newly listed coins using get_new_coins. Analyze the data and provide insights about current market trends.`,
          },
        },
      ],
    };
  }

  private async handleTokenResearchPrompt(args: any) {
    const chain = args?.chain || "ethereum";
    const address = args?.address;
    
    if (!address) {
      throw new Error("Token address is required for token research");
    }
    
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please research the token at address ${address} on ${chain} blockchain. Use the get_token_price_by_address tool with market_data=true to get comprehensive information including price, market cap, volume, and other key metrics.`,
          },
        },
      ],
    };
  }

  // Resource Handlers
  private async handleMarketStatusResource() {
    try {
      const trendingData = await this.callCoinGeckoAPI("/search/trending") as any;
      const priceData = await this.callCoinGeckoAPI("/simple/price", {
        ids: "bitcoin,ethereum",
        vs_currencies: "usd",
        include_market_cap: "true",
        include_24hr_vol: "true",
        include_24hr_change: "true"
      });
      
      return {
        contents: [
          {
            uri: "coingecko://market/status",
            mimeType: "application/json",
            text: JSON.stringify({
              status: "active",
              timestamp: new Date().toISOString(),
              topCoins: priceData,
              trendingCount: trendingData.coins?.length || 0,
              summary: "Live crypto market data from CoinGecko"
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch market status: ${error}`);
    }
  }

  private async handleTrendingCoinsResource() {
    try {
      const data = await this.callCoinGeckoAPI("/search/trending");
      
      return {
        contents: [
          {
            uri: "coingecko://trending/coins",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch trending coins: ${error}`);
    }
  }

  private async handleNewCoinsResource() {
    try {
      const data = await this.callCoinGeckoAPI("/coins/list/new");
      
      return {
        contents: [
          {
            uri: "coingecko://new/coins",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch new coins: ${error}`);
    }
  }

  private async handleApiInfoResource() {
    const apiInfo = `CoinGecko API Information
=============================

Base URL: https://api.coingecko.com/api/v3

Available Tools:
1. get_simple_price - Get current prices for cryptocurrencies
   Endpoint: /simple/price
   Required: ids, vs_currencies
   
2. get_trending_coins - Get trending cryptocurrencies
   Endpoint: /search/trending
   
3. get_new_coins - Get newly listed coins
   Endpoint: /coins/list/new
   
4. get_token_price_by_address - Get token info by contract address
   Endpoint: /coins/{chainId}/contract/{tokenAddress}
   Required: chainId, tokenAddress

Supported Blockchains:
- ethereum
- polygon-pos
- binance-smart-chain
- avalanche
- arbitrum-one
- optimistic-ethereum
- base
- And many more...

Rate Limits:
- Demo API: 30 calls/minute
- Pro API: Higher limits available

Authentication:
- API Key via x-cg-demo-api-key header
`;
    
    return {
      contents: [
        {
          uri: "coingecko://api/info",
          mimeType: "text/plain",
          text: apiInfo,
        },
      ],
    };
  }
}
