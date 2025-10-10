import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import userRoutes from "./routes/users.js";
import orderRoutes from "./routes/orders.js";
import messagesRouter from './routes/messages.js';
// 1. IMPORT THE NEW ANALYTICS ROUTE
import analyticsRoutes from "./routes/analytics.js";

dotenv.config();

const app = express();

// ✅ Middlewares
// This CORS configuration is correct for your setup
app.use(cors({
  origin: 'http://localhost'
}));
app.use(express.json());

// ✅ API Routes
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messagesRouter);
// 2. USE THE NEW ANALYTICS ROUTE
app.use("/api/analytics", analyticsRoutes);


// ✅ Health check route (for quick testing in browser)
app.get("/", (req, res) => {
  res.send("🚀 Backend API is running...");
});

const hostArg = process.argv.find(arg => arg.startsWith('--host'));
const host = hostArg ? hostArg.split('=')[1] : 'localhost';

const PORT = process.env.PORT || 8080;

// Use the host variable in app.listen
app.listen(PORT, host, () => {
  console.log(`🚀 Backend running on http://${host}:${PORT}`);
});