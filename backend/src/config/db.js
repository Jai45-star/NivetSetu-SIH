import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[NiveshSetu] Notice: MONGODB_URI is not defined. Operating with persistent in-memory fallback for demo mode.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log('[NiveshSetu] MongoDB connected successfully.');
    return true;
  } catch (error) {
    console.warn(`[NiveshSetu] MongoDB connection failed (${error.message}). Operating with in-memory draft fallback.`);
    isConnected = false;
    return false;
  }
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
