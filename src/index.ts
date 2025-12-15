import { config } from "dotenv";
import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import mcpRoutes from "./routes/mcp.routes.js";
import coingeckoRoutes from "./routes/coingecko.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { PAYMENT_CONFIG, getFacilitatorUrl, getPaymentAddress, isPaymentConfigured } from "./config/payment.config.js";
import { paymentMiddleware } from "x402-express";

// Load environment variables
config();

if (!isPaymentConfigured()) {
  console.log("⚠️  Payment not configured. Set FACILITATOR_URL and ADDRESS in .env file");
  console.log("⚠️  Server will run without payment requirements");
}

const facilitatorUrl = getFacilitatorUrl();
const payTo = getPaymentAddress();

if (!isPaymentConfigured()) {
  console.log("⚠️  Payment not configured. Set FACILITATOR_URL and ADDRESS in .env file");
  console.log("⚠️  Server will run without payment requirements");
}

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
// Payment middleware for tool endpoints (if configured)
if (facilitatorUrl && payTo) {
  console.log("💰 Payment middleware enabled for CoinGecko endpoints");
  app.use(
    paymentMiddleware(
      payTo,
      {
        "GET /mcp/simple/price": PAYMENT_CONFIG.tools.get_simple_price,
        "GET /mcp/search/trending": PAYMENT_CONFIG.tools.get_trending_coins,
        "GET /mcp/coins/list/new": PAYMENT_CONFIG.tools.get_new_coins,
        "GET /mcp/coins/:chainId/contract/:tokenAddress": PAYMENT_CONFIG.tools.get_token_price_by_address,
        "GET /mcp": PAYMENT_CONFIG.jsonRpc,
      },
      {
        url: facilitatorUrl,
      },
    ),
  );
}



// Routes
app.use("/", healthRoutes);
app.use("/mcp", mcpRoutes);
app.use("/mcp", coingeckoRoutes);




// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 CoinGecko Market Agent MCP Server");
  console.log("=".repeat(60));
  console.log(`\n📡 Server running on http://localhost:${PORT}`);
  
  // Payment status
  if (isPaymentConfigured()) {
    console.log(`\n💰 Payment: ENABLED (Coinbase x402)`);
    console.log(`   Network: base-sepolia`);
    console.log(`\n🪙 CoinGecko Pricing:`);
    console.log(`   Simple Price: ${PAYMENT_CONFIG.tools.get_simple_price.price}`);
    console.log(`   Trending Coins: ${PAYMENT_CONFIG.tools.get_trending_coins.price}`);
    console.log(`   New Coins: ${PAYMENT_CONFIG.tools.get_new_coins.price}`);
    console.log(`   Token by Address: ${PAYMENT_CONFIG.tools.get_token_price_by_address.price}`);
  } else {
    console.log(`\n💰 Payment: DISABLED (Configure .env to enable)`);
  }
  
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 SIGINT received, shutting down gracefully...");
  process.exit(0);
});
