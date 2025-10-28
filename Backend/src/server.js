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
import adminRoutes from "./routes/admin.js";
// ✅ Add any new routes here if you create them (e.g., /delivery, /invoices)

dotenv.config();

const app = express();

// --- Robust CORS Configuration ---
const allowedOrigins = [
    // 1. Local Development Environments
    'http://localhost:8081', // React Native Dev Server (common default)
    'http://localhost:8080', // Default port for Web apps
    'http://localhost:3000', // React/Next.js frontend default
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8080',

    // 2. Mobile Emulator/Device Testing (You may need to update the 192.x.x.x IP)
    'http://192.168.0.101:8081', // Your specific local IP
    'http://10.0.2.2:8081',      // Android Emulator localhost
    'http://10.0.3.2:8081',      // Genymotion Emulator localhost

    // 3. Production/Staging Domains (Replace these with your actual deployed URLs)
    // process.env.CLIENT_URL, 
    // 'https://your-production-app.com', 
    
    // Add any others as needed...
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
        if (!origin) return callback(null, true); 
        
        // If the origin is in our allowed list, permit it
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Log for debugging if a request is blocked
            console.log(`CORS Blocked: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Crucial for handling cookies/sessions/auth tokens
}));
// --- End CORS Configuration ---

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
app.use("/api/admin", adminRoutes);
// ✅ New routes go here

// Health check route
app.get("/", (req, res) => {
    res.send("🚀 Main Backend API is running...");
});

// --- Server Startup Logic ---
// Use environment variable for host if available, otherwise default to a permissive '0.0.0.0' for wider network access.
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0'; // '0.0.0.0' allows connections from outside localhost (e.g., from a mobile device)

app.listen(PORT, HOST, () => {
    console.log(`🚀 Main Backend running on http://${HOST}:${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser (if running locally)`);
});