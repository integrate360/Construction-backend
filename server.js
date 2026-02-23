import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUI from "./swagger/swaggerUI.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import attributeRoutes from "./routes/attributeRoutes.js";
import attributeSetRoutes from "./routes/attributeSetRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";

dotenv.config({ quiet: true });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

swaggerUI(app);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Construction ERP API Running",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/attribute", attributeRoutes);
app.use("/api/attribute-sets", attributeSetRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/attendance", attendanceRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

// Start server AFTER DB connects
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📄 Swagger Docs → http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;
