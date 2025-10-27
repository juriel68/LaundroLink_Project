import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import userRoutes from "./routes/users.js";
import orderRoutes from "./routes/orders.js";
import messagesRouter from './routes/messages.js';
import analyticsRouter from "./routes/analytics.js";
import shopRouter from "./routes/shops.js";
import authRouter from "./routes/auth.js"; 
import activityRouter from "./routes/activity.js";
import paymentRoutes from "./routes/payments.js";

dotenv.config();

const app = express();

const allowedOrigins = [
    // For local web/simulator testing (where your current error originates)
    'http://localhost:8081',
    'http://localhost:8080', 

    // For mobile device/emulator testing on the local network (based on your Metro output)
    'http://192.168.0.101:8081',

    // Add any other necessary origins (like the default localhost without port, etc.)
    'http://localhost',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true // Important if you use cookies/sessions later
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// API Routes
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messagesRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/shops", shopRouter);
app.use("/api/auth", authRouter); 
app.use("/api/activity", activityRouter);
app.use("/api/payments", paymentRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("🚀 Main Backend API is running...");
});

const hostArg = process.argv.find(arg => arg.startsWith('--host'));
const host = hostArg ? hostArg.split('=')[1] : 'localhost';

const PORT = process.env.PORT || 8080; // Your main backend runs on 8080

app.listen(PORT, host, () => {
  console.log(`🚀 Main Backend running on http://${host}:${PORT}`);
});