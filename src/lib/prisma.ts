import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// Create Prisma client with connection retry logic and pool settings
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Add connection lifecycle management
let isConnecting = false;
let isConnected = false;

// Ensure connection is established
export async function ensureConnection() {
  if (isConnected) return;
  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise(resolve => setTimeout(resolve, 100));
    return ensureConnection();
  }
  
  isConnecting = true;
  try {
    await prisma.$connect();
    isConnected = true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
  } finally {
    isConnecting = false;
  }
}

// Gracefully disconnect on process termination
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    isConnected = false;
    await prisma.$disconnect();
  });
  
  process.on('SIGINT', async () => {
    isConnected = false;
    await prisma.$disconnect();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    isConnected = false;
    await prisma.$disconnect();
    process.exit(0);
  });
}
