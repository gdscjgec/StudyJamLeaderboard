import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

export interface LeaderboardDoc {
  entries: LeaderboardEntry[];
  frozenUsers: Record<string, FrozenUser>;
}

const leaderboardSchema = new mongoose.Schema<LeaderboardDoc>({
  entries: [{ type: Object }],
  frozenUsers: { type: Object },
}, { timestamps: true });

export const Leaderboard = mongoose.models.Leaderboard || mongoose.model<LeaderboardDoc>('Leaderboard', leaderboardSchema);

let cached: typeof mongoose | null = null;

export const connectToDatabase = async () => {
  if (cached) return cached;
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    cached = conn;
    console.log('✅ Connected to MongoDB');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};