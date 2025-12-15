import { MCPServer } from "../server.js";

export class ToolController {
  private mcpServer: MCPServer;

  constructor() {
    this.mcpServer = new MCPServer();
  }

  async getSimplePrice(
    ids: string,
    vs_currencies: string,
    include_market_cap?: boolean,
    include_24hr_vol?: boolean,
    include_24hr_change?: boolean,
    include_last_updated_at?: boolean,
    precision?: number
  ) {
    return await this.mcpServer.callTool("get_simple_price", {
      ids,
      vs_currencies,
      include_market_cap,
      include_24hr_vol,
      include_24hr_change,
      include_last_updated_at,
      precision,
    });
  }

  async getTrendingCoins() {
    return await this.mcpServer.callTool("get_trending_coins", {});
  }

  async getNewCoins() {
    return await this.mcpServer.callTool("get_new_coins", {});
  }

  async getTokenPriceByAddress(
    chainId: string,
    tokenAddress: string,
    localization?: string,
    tickers?: string,
    market_data?: string,
    community_data?: string,
    developer_data?: string,
    sparkline?: string
  ) {
    return await this.mcpServer.callTool("get_token_price_by_address", {
      chainId,
      tokenAddress,
      localization,
      tickers,
      market_data,
      community_data,
      developer_data,
      sparkline,
    });
  }
}
