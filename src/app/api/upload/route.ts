import { NextRequest, NextResponse } from 'next/server';
import csvParser from 'csv-parser';
import { connectToDatabase, Leaderboard } from '@/lib/db';
import type { LeaderboardEntry, FrozenUser } from '@/lib/types';
import { Readable } from 'stream';

// Process data with preserved frozen ranks
function processLeaderboardData(
  parsedUsers: Record<string, string>[],
  currentFrozen: Record<string, FrozenUser>
): { entries: LeaderboardEntry[]; frozenUsers: Record<string, FrozenUser> } {
  const newUsers = parsedUsers.map((p) => ({
    ...p,
    '# of Skill Badges Completed': parseInt(p['# of Skill Badges Completed'] || '0', 10),
    '# of Arcade Games Completed': parseInt(p['# of Arcade Games Completed'] || '0', 10),
    rank: parseInt(p['rank'] || '0', 10) || 0, // Preserve initial rank from CSV if present
  })) as LeaderboardEntry[];

  // Separate frozen and active users based on currentFrozen
  const frozenEntries = newUsers.filter((user) => currentFrozen[user['User Email']]);
  const activeUsers = newUsers.filter((user) => !currentFrozen[user['User Email']]);

  // Sort active users based on criteria
  activeUsers.sort((a, b) => {
    const aCompleted = a['All Skill Badges & Games Completed'] === 'Yes' ? 1 : 0;
    const bCompleted = b['All Skill Badges & Games Completed'] === 'Yes' ? 1 : 0;
    if (aCompleted !== bCompleted) return bCompleted - aCompleted;
    const aTotal = (a['# of Skill Badges Completed'] || 0) + (a['# of Arcade Games Completed'] || 0);
    const bTotal = (b['# of Skill Badges Completed'] || 0) + (b['# of Arcade Games Completed'] || 0);
    return bTotal - aTotal;
  });

  // Assign ranks to active users, avoiding conflicts with frozen ranks
  const occupiedRanks = new Set<number>(
    frozenEntries.map((user) => currentFrozen[user['User Email']].rank)
  );
  let currentRank = 1;
  activeUsers.forEach((user) => {
    while (occupiedRanks.has(currentRank)) {
      currentRank++;
    }
    user.rank = currentRank;
    currentRank++;
  });

  // Combine frozen and active users, ensuring frozen ranks are preserved
  const finalLeaderboard = [
    ...frozenEntries.map((user) => ({
      ...user,
      rank: currentFrozen[user['User Email']].rank, // Explicitly set frozen rank
    })),
    ...activeUsers,
  ];

  // Update or add new frozen users
  const updatedFrozenUsers = { ...currentFrozen };
  finalLeaderboard.forEach((user) => {
    const email = user['User Email'];
    if (user['All Skill Badges & Games Completed'] === 'Yes' && !updatedFrozenUsers[email]) {
      updatedFrozenUsers[email] = { rank: user.rank, data: { ...user } };
    }
  });

  // Sort for display order without reassigning frozen ranks
  finalLeaderboard.sort((a, b) => {
    const aCompleted = a['All Skill Badges & Games Completed'] === 'Yes' ? 1 : 0;
    const bCompleted = b['All Skill Badges & Games Completed'] === 'Yes' ? 1 : 0;
    if (aCompleted !== bCompleted) return bCompleted - aCompleted;
    const aTotal = (a['# of Skill Badges Completed'] || 0) + (a['# of Arcade Games Completed'] || 0);
    const bTotal = (b['# of Skill Badges Completed'] || 0) + (b['# of Arcade Games Completed'] || 0);
    return bTotal - aTotal;
  });

  // Ensure frozen ranks are not overwritten during final sort
  finalLeaderboard.forEach((user) => {
    if (currentFrozen[user['User Email']]) {
      user.rank = currentFrozen[user['User Email']].rank; // Restore frozen rank
    }
  });

  return { entries: finalLeaderboard, frozenUsers: updatedFrozenUsers };
}

export async function POST(request: NextRequest) {
  console.log('📤 API /upload hit!');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.type !== 'text/csv') {
      console.log('❌ Invalid file:', file?.name, file?.type);
      return NextResponse.json({ error: 'Please upload a valid CSV file' }, { status: 400 });
    }

    console.log('📄 File received:', file.name, file.size, 'bytes');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    const parsedUsers: Record<string, string>[] = [];
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csvParser({ headers: true, quote: '"', escape: '"' }))
        .on('data', (row) => parsedUsers.push(row))
        .on('end', resolve)
        .on('error', (err) => {
          console.error('CSV parse error:', err);
          reject(err);
        });
    });

    console.log('📊 Parsed users (before filter):', parsedUsers.length);

    if (parsedUsers.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 });
    }

    const dataRows = parsedUsers.slice(1); // Skip the first row (header)
    console.log('📊 Parsed users (after filter):', dataRows.length);

    if (dataRows.length === 0) {
      return NextResponse.json({ error: 'No data rows found after removing header' }, { status: 400 });
    }

    await connectToDatabase();
    const doc = await Leaderboard.findOne({});
    const currentFrozen = doc?.frozenUsers || {};

    console.log('🔒 Current frozen users:', Object.keys(currentFrozen).length);

    const { entries, frozenUsers } = processLeaderboardData(dataRows, currentFrozen);

    await Leaderboard.findOneAndUpdate(
      {},
      { entries, frozenUsers },
      { upsert: true, new: true }
    );

    console.log('✅ Upload success! Entries saved:', entries.length);
    return NextResponse.json({ success: true, message: 'Leaderboard updated successfully' });
  } catch (error: any) {
    console.error('💥 Upload error details:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}