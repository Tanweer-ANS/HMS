import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ Please add your MongoDB URI to .env.local");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
declare global {
  // We must use `var` here, not `let` or `const`
  var mongooseCache: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export default async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string, {
        dbName: "hospital_management",
        bufferCommands: false,
      })
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected");
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // If the connection fails, reset the promise so a new attempt can be made
    cached.promise = null;
    console.error("❌ MongoDB connection error:", e);
    throw e;
  }

  return cached.conn;
}