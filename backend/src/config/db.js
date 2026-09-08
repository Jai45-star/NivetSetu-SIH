import mongoose from 'mongoose';
import dns from 'node:dns';

/**
 * Configure DNS resolution for MongoDB Atlas SRV lookups.
 * Many Windows systems, local routers, and ISPs fail or refuse SRV queries
 * ('querySrv ECONNREFUSED'). Directing c-ares to reliable public DNS resolvers
 * (Google 8.8.8.8 and Cloudflare 1.1.1.1) resolves Atlas cluster endpoints reliably.
 */
export function configureDNS() {
  try {
    const customDns = process.env.DNS_SERVERS
      ? process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean)
      : ['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1'];

    dns.setServers(customDns);

    if (typeof dns.setDefaultResultOrder === 'function') {
      dns.setDefaultResultOrder('ipv4first');
    }
  } catch (dnsErr) {
    console.warn(`[NiveshSetu] Note: Could not set custom DNS servers: ${dnsErr.message}`);
  }
}

// Ensure DNS configuration runs immediately upon module import
configureDNS();

let isConnected = false;

function resolveDbName(uri) {
  if (process.env.MONGODB_DB_NAME) return process.env.MONGODB_DB_NAME;
  try {
    const url = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'http://'));
    const path = url.pathname.replace(/^\//, '');
    if (path) return path;
  } catch {
    // fallback if URL parsing fails
  }
  return 'niveshsetu';
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[NiveshSetu] Notice: MONGODB_URI is not defined. Operating with in-memory demo mode. Data is lost when this API process restarts.');
    return false;
  }

  // Re-verify DNS is set before connecting
  configureDNS();

  const dbName = resolveDbName(uri);

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4,
      dbName,
    });
    isConnected = true;
    console.log(`[NiveshSetu] MongoDB connected successfully to database "${mongoose.connection.name}".`);
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

