import "reflect-metadata";
import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { Server } from "http";
import { AppDataSource } from "./config/db";
import loadRoute from './router/load.route';
import kafkaConfig from "./config/kafkaConfig";
import { handleUserEvent } from "./kafkaService/userEventHandler";

dotenv.config();

const app: Application = express();
const port = parseInt(process.env.PORT || "3017", 10);

app.use(cors({ origin: "*" }));
app.use(morgan("dev"));
app.use(express.urlencoded({ limit: "100mb", extended: false }));
app.use(express.json({ limit: "100mb" }));
app.use("/api/", loadRoute);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    service: 'subscription-service',
    timestamp: new Date().toISOString()
  });
});

const connectDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("✓ MySQL connected successfully with TypeORM");
  } catch (error) {
    console.error("✗ Database connection failed:", error);
    process.exit(1);
  }
};

async function startKafkaConsumer(): Promise<void> {
  try {
    await kafkaConfig.getConsumer('subscription-group');
    await kafkaConfig.subscribe(['user-events']);
    await kafkaConfig.startConsuming(handleUserEvent);
    console.log('✅ Kafka consumer started successfully');
  } catch (error) {
    console.error('❌ Failed to start Kafka consumer:', error);
    process.exit(1);
  }
}

const startServer = async (): Promise<Server> => {
  await connectDatabase();
  await startKafkaConsumer();
  
  const server = app.listen(port, () => {
    console.log(`✓ Server running on http://localhost:${port}`);
  });
  
  return server;
};

// Start the server and keep reference
let server: Server;

startServer()
  .then((srv) => {
    server = srv;
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
  
  let isShuttingDown = false;
  
  if (isShuttingDown) {
    console.log('⚠️ Already shutting down...');
    return;
  }
  
  isShuttingDown = true;

  const forceShutdownTimeout = setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);

  try {
    if (server) {
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
    }

    await kafkaConfig.disconnect();
    console.log('✅ Kafka consumer disconnected');

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Database connection closed');
    }

    clearTimeout(forceShutdownTimeout);
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    clearTimeout(forceShutdownTimeout);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});
