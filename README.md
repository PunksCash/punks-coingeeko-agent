# Building Custom MCP Agents with Payment Integration

## Overview

This technical guide demonstrates how to build Model Context Protocol (MCP) agents with integrated payment systems using TypeScript, Express.js, and Coinbase's x402 payment middleware. The architecture supports tools, prompts, and resources with per-call pricing on blockchain networks.

## Architecture Components

### Core Dependencies
```json
{
  "@modelcontextprotocol/sdk": "^1.0.4",
  "express": "^4.18.2", 
  "x402-express": "^0.7.1",
  "dotenv": "^17.2.3",
  "cors": "^2.8.5",
  "typescript": "^5.3.3"
}
```

### Project Structure
```
src/
├── index.ts                    # Server entry point
├── server.ts                   # MCP protocol implementation
├── config/
│   ├── constants.ts           # Application constants
│   └── payment.config.ts      # Payment configuration
├── controllers/
│   ├── mcp.controller.ts      # MCP request handlers
│   └── tool.controller.ts     # Tool execution logic
├── middleware/
│   └── errorHandler.ts        # Error handling middleware
└── routes/
    ├── health.routes.ts       # Health check endpoints
    ├── mcp.routes.ts          # MCP protocol routes
    └── [agent].routes.ts      # Agent-specific routes
```

## Configuration Setup

### Environment Variables (.env)
```bash
# API Configuration
[API_NAME]_API_KEY=your_api_key_here
PORT=3000

# Payment Configuration (Optional)
FACILITATOR_URL=https://your-facilitator-url.com
ADDRESS=0xYourPaymentAddress
```

### Payment Configuration (payment.config.ts)
```typescript
import { Resource, type SolanaAddress } from "x402-express";

export const PAYMENT_CONFIG = {
  tools: {
    [tool_name]: {
      price: "$0.001",
      network: "[network_name]" as const,
    },
    // Add more tools...
  },
  jsonRpc: {
    price: "$0.001",
    network: "[network_name]" as const,
  },
};

export const getFacilitatorUrl = (): string | null => {
  return process.env.FACILITATOR_URL || null;
};

export const getPaymentAddress = (): string | null => {
  return process.env.ADDRESS || null;
};

export const isPaymentConfigured = (): boolean => {
  return !!(getFacilitatorUrl() && getPaymentAddress());
};
```

## MCP Server Implementation

### Core Server Class (server.ts)
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

export class MCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "[agent-name]-mcp-server",
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
            name: "[tool_name]",
            description: "[tool_description]",
            inputSchema: {
              type: "object",
              properties: {
                [parameter_name]: {
                  type: "[parameter_type]",
                  description: "[parameter_description]",
                },
              },
              required: ["[required_parameter]"],
            },
          },
        ],
      };
    });

    // Tool Execution Handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case "[tool_name]":
          return await this.handle[ToolName](args as any);
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
            name: "[prompt_name]",
            description: "[prompt_description]",
            arguments: [
              {
                name: "[argument_name]",
                description: "[argument_description]",
                required: [true/false],
              },
            ],
          },
        ],
      };
    });

    // Resources Handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "[agent]://[resource_type]/[resource_name]",
            name: "[Resource Name]",
            description: "[resource_description]",
            mimeType: "[mime_type]",
          },
        ],
      };
    });
  }
}
```

### API Integration Helper
```typescript
private async call[API]API(endpoint: string, params?: Record<string, string>) {
  const [API]_BASE_URL = "https://api.[service].com/v[version]";
  const url = new URL(`${[API]_BASE_URL}${endpoint}`);
  
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
      '[api-key-header]': process.env.[API_KEY_ENV_VAR]!
    }
  });

  if (!response.ok) {
    throw new Error(`[API] API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
```

## Payment Integration

### Server Entry Point (index.ts)
```typescript
import { paymentMiddleware } from "x402-express";
import { PAYMENT_CONFIG, getFacilitatorUrl, getPaymentAddress, isPaymentConfigured } from "./config/payment.config.js";

const facilitatorUrl = getFacilitatorUrl();
const payTo = getPaymentAddress();

// Payment middleware registration
if (facilitatorUrl && payTo) {
  console.log("💰 Payment middleware enabled for agent endpoints");
  app.use(
    paymentMiddleware(
      payTo,
      {
        "GET /mcp/[tool_endpoint_1]": PAYMENT_CONFIG.tools.[tool_name_1],
        "GET /mcp/[tool_endpoint_2]": PAYMENT_CONFIG.tools.[tool_name_2],
        "GET /mcp": PAYMENT_CONFIG.jsonRpc,
      },
      {
        url: facilitatorUrl,
      },
    ),
  );
}
```

### Route-Level Payment Integration
```typescript
import { paymentMiddleware, Resource } from "x402-express";

// Configure payment for specific routes
const facilitatorUrl = getFacilitatorUrl();
const payTo = getPaymentAddress();

if (isPaymentConfigured() && facilitatorUrl && payTo) {
  router.use(
    paymentMiddleware(
      payTo,
      {
        "GET /[endpoint_1]": PAYMENT_CONFIG.tools.[tool_name_1],
        "GET /[endpoint_2]": PAYMENT_CONFIG.tools.[tool_name_2],
      },
      {
        url: facilitatorUrl,
      }
    )
  );
}
```

## Route Implementation

### Agent-Specific Routes
```typescript
// [endpoint] - [description]
router.get(
  "/[endpoint]",
  async (req: Request, res: Response) => {
    console.log("🔧 GET /[agent]/[endpoint] - [action_description]");

    try {
      const { [param1], [param2] } = req.query;

      // Validate required parameters
      if (![required_param]) {
        return res.status(400).json({
          error: "Missing required parameters",
          required: ["[required_param]"],
        });
      }

      const params: Record<string, string> = {
        [param1]: [param1] as string,
      };

      // Add optional parameters
      if ([optional_param]) params.[optional_param] = [optional_param] as string;

      const data = await call[API]API("/[api_endpoint]", params);

      res.json({
        success: true,
        data,
        parameters: params
      });
    } catch (error) {
      console.error("❌ Error:", error);
      res.status(500).json({
        error: "Failed to process request",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
);
```

## MCP Protocol Routes

### Tools, Prompts, and Resources Endpoints
```typescript
// Tools endpoint with pricing information
router.get("/tools", (req: Request, res: Response) => {
  const mcpServer = new MCPServer();
  const tools = mcpServer.getTools();
  
  const pricingMap: Record<string, { 
    price: string; 
    network: string;
    tokens: Array<{ address: string; symbol: string; decimals: number }>;
    chainId: number;
  }> = {
    [tool_name]: {
      ...PAYMENT_CONFIG.tools.[tool_name],
      tokens: [
        { address: "[token_contract_address]", symbol: "[TOKEN_SYMBOL]", decimals: [decimals] }
      ],
      chainId: [chain_id]
    },
  };
  
  const simplifiedTools = tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    endpoint: `/[endpoint_mapping]`,
    parameters: tool.inputSchema.properties ? 
      Object.entries(tool.inputSchema.properties).map(([key, value]: [string, any]) => ({
        name: key,
        type: value.type,
        description: value.description,
        required: (tool.inputSchema.required as string[] | undefined)?.includes(key) || false,
      })) : [],
    pricing: pricingMap[tool.name]
  }));
  
  res.json(simplifiedTools);
});
```

## Health and Info Endpoints

### Server Information
```typescript
// Root endpoint
router.get("/", (req: Request, res: Response) => {
  res.json({
    name: "[Agent Name] MCP Server",
    version: "1.0.0",
    status: "healthy",
    paymentEnabled: isPaymentConfigured(),
    endpoints: {
      tools: {
        [tool_name]: "GET /[agent]/[endpoint]"
      },
      mcp: {
        initialize: "POST /mcp/initialize",
        tools: "GET /mcp/tools",
        prompts: "GET /mcp/prompts", 
        resources: "GET /mcp/resources"
      }
    },
    pricing: isPaymentConfigured() ? {
      [tool_name]: PAYMENT_CONFIG.tools.[tool_name].price,
      network: "[network_name]"
    } : null,
    capabilities: {
      tools: ["[tool_1]", "[tool_2]"],
      prompts: ["[prompt_1]", "[prompt_2]"],
      resources: ["[agent]://[resource_1]", "[agent]://[resource_2]"],
    },
  });
});
```

## Blockchain Network Configuration

### Supported Networks
- **Ethereum Mainnet**: Chain ID 1
- **Base**: Chain ID 8453  
- **Base Sepolia** (Testnet): Chain ID 84532
- **Polygon**: Chain ID 137
- **Arbitrum One**: Chain ID 42161

### Token Configuration
```typescript
const tokenConfig = {
  USDC: {
    ethereum: "0xA0b86a33E6411C0c82ca99bEf8c8A1fFc73a8a23",
    base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 
    "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    polygon: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
  }
};
```

## Error Handling

### Global Error Middleware
```typescript
export const errorHandler = (
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.error("🚨 Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
};
```

## Deployment Configuration

### Build Scripts (package.json)
```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc", 
    "start": "node dist/index.js",
    "vercel-build": "tsc"
  }
}
```

### TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext", 
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Testing and Validation

### Development Server
```bash
npm run dev  # Development with hot reload
npm run build # TypeScript compilation
npm start    # Production server
```

### API Testing Examples
```bash
# Test tool endpoint
curl "http://localhost:[PORT]/[agent]/[endpoint]?[param]=[value]"

# Test MCP tools list
curl "http://localhost:[PORT]/mcp/tools"

# Test health check
curl "http://localhost:[PORT]/health"
```

## Security Considerations

1. **API Key Protection**: Store API keys in environment variables, never hardcode
2. **Payment Validation**: Validate payment middleware configuration before enabling
3. **Input Validation**: Sanitize and validate all user inputs
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **CORS Configuration**: Configure CORS appropriately for production

## Best Practices

1. **Modular Architecture**: Separate concerns into distinct modules
2. **Type Safety**: Leverage TypeScript for compile-time error checking
3. **Error Handling**: Implement comprehensive error handling and logging
4. **Documentation**: Document all tools, prompts, and resources
5. **Testing**: Implement unit and integration tests
6. **Monitoring**: Add logging and monitoring for production deployments

## Customization Guidelines

Replace placeholder values throughout the codebase:
- `[agent_name]` - Your agent's identifier
- `[API_NAME]` - External API service name
- `[tool_name]` - Individual tool identifiers
- `[endpoint]` - API endpoint paths
- `[network_name]` - Blockchain network identifier
- `[chain_id]` - Blockchain network chain ID
- `[token_contract_address]` - Payment token contract address

This architecture provides a scalable foundation for building MCP agents with integrated payment systems across multiple blockchain networks.

## Example Implementation

This repository demonstrates a complete CoinGecko MCP agent implementation with the following features:

### Tools
- `get_simple_price` - Get current prices for cryptocurrencies
- `get_trending_coins` - Get trending cryptocurrencies  
- `get_new_coins` - Get newly listed coins
- `get_token_price_by_address` - Get token info by contract address

### Prompts
- `crypto_price_check` - Get current prices for popular cryptocurrencies
- `market_analysis` - Comprehensive crypto market analysis
- `token_research` - Deep dive research on specific tokens

### Resources
- `coingecko://market/status` - Current crypto market overview
- `coingecko://trending/coins` - Currently trending cryptocurrencies
- `coingecko://new/coins` - Recently listed cryptocurrencies
- `coingecko://api/info` - CoinGecko API documentation

### Payment Configuration
- Network: Base Sepolia (Chain ID: 84532)
- Token: USDC (0x036CbD53842c5426634e7929541eC2318f3dCF7e)
- Pricing: $0.001 per API call

### GET /
Server information and capabilities overview

```json
{
  "name": "Sovereign Swarm MCP Server",
  "version": "1.0.0",
  "status": "healthy",
  "endpoints": {
    "mcp": "/mcp",
    "health": "/health",
    "info": "/info"
  },
  "capabilities": {
    "tools": [...],
    "prompts": [...],
    "resources": [...]
  }
}
```

### GET /health
Health check endpoint for monitoring

```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2025-11-11T08:00:00.000Z"
}
```

### GET /info
Detailed server information and capabilities

### POST /mcp
Main MCP protocol endpoint using Server-Sent Events (SSE)

## Capabilities

### Tools (Executable Functions)

1. **calculate**
   - Perform mathematical operations (add, subtract, multiply, divide)
   - Input: `{ operation, a, b }`
   - Output: Calculation result

2. **get_weather**
   - Get weather information for a location
   - Input: `{ location, unit? }`
   - Output: Weather data (mock)

3. **echo**
   - Echo back a message
   - Input: `{ message }`
   - Output: Echoed message

4. **get_timestamp**
   - Get current timestamp in various formats
   - Input: `{ format? }`
   - Output: Formatted timestamp

### Prompts (Templates)

1. **greeting**
   - Generate personalized greetings
   - Args: `name`, `time_of_day`

2. **code_review**
   - Code review request templates
   - Args: `language`, `complexity`

3. **debug_assistant**
   - Debugging assistance prompts
   - Args: `error_type`

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd mcp-server
vercel
```

### Option 2: GitHub Integration

1. Push this folder to GitHub
2. Import repository in Vercel dashboard
3. Set root directory to `mcp-server`
4. Deploy!

### Environment Variables (Optional)

```bash
PORT=3000  # Port number (default: 3000)
```

## Deploy to Other Platforms

### Heroku

```bash
# Create Heroku app
heroku create your-mcp-server

# Deploy
git subtree push --prefix mcp-server heroku main
```

### AWS Lambda / API Gateway

Use the Serverless framework or AWS SAM to deploy as a Lambda function.

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Usage with Sovereign Swarm

```typescript
import { Sovereign } from "sovereign-swarm";

// Create agent with your deployed MCP server
const agent = sdk.createAgent("My Agent", "Description", "image");
await agent.setMCP("https://your-mcp-server.vercel.app/mcp");
await agent.registerIPFS();

// Agent is now discoverable with MCP capabilities!
```

## Testing with MCP Client

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(
  new URL("https://your-mcp-server.vercel.app/mcp")
);

const client = new Client({
  name: "test-client",
  version: "1.0.0",
}, { capabilities: {} });

await client.connect(transport);

// List tools
const tools = await client.listTools();
console.log(tools);

// Call a tool
const result = await client.callTool({
  name: "calculate",
  arguments: { operation: "add", a: 10, b: 20 }
});
console.log(result);
```

## Project Structure

```
mcp-server/
├── src/
│   ├── index.ts       # Express server with HTTP/SSE
│   └── server.ts      # MCP server core logic
├── dist/              # Compiled JavaScript (generated)
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── vercel.json        # Vercel deployment config
└── README.md          # This file
```

## Development

### Adding New Tools

Edit `src/server.ts` and add to the tools array:

```typescript
{
  name: "your_tool",
  description: "Tool description",
  inputSchema: {
    type: "object",
    properties: { ... },
    required: [...]
  }
}
```

Then implement the handler in `handleTool` method.

### Adding New Prompts

Add to the prompts array and implement handler in `handlePrompt` method.

### Adding New Resources

Add to the resources array and implement handler in `handleResource` method.

## Monitoring

Once deployed, monitor your server:

```bash
# Check health
curl https://your-mcp-server.vercel.app/health

# View logs (Vercel)
vercel logs

# View metrics (Vercel Dashboard)
# Analytics → Functions → /mcp
```

## Security

For production deployments:

1. **Add Authentication**: Implement API key or OAuth
2. **Rate Limiting**: Use middleware to prevent abuse
3. **Input Validation**: Validate all tool inputs
4. **CORS Configuration**: Restrict origins as needed
5. **Error Handling**: Don't expose sensitive error details

Example with API key:

```typescript
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

## License

MIT
