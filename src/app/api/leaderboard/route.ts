import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Leaderboard } from '@/lib/db';
import type { LeaderboardEntry, FrozenUser } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const doc = await Leaderboard.findOne({}) || { entries: [], frozenUsers: {} };
    console.log('Database Response:', doc); // Debug the fetched document

    // Transform the entries to match the expected structure
    const transformedEntries = Array.isArray(doc.entries)
      ? doc.entries.map((entry: any) => ({
          rank: entry.rank,
          'User Name': entry._0 || entry['User Name'] || 'Unknown',
          'User Email': entry._1 || entry['User Email'],
          'Google Cloud Skills Boost Profile URL': entry._2 || entry['Google Cloud Skills Boost Profile URL'],
          'Profile URL Status': entry._3 || entry['Profile URL Status'] || 'Unknown',
          'Access Code Redemption Status': entry._4 || entry['Access Code Redemption Status'] || 'No',
          'All Skill Badges & Games Completed': entry._5 || entry['All Skill Badges & Games Completed'] || 'No',
          '# of Skill Badges Completed': entry._6 || entry['# of Skill Badges Completed'] || 0,
          'Names of Completed Skill Badges': entry._7 || entry['Names of Completed Skill Badges'] || '',
          '# of Arcade Games Completed': entry._8 || entry['# of Arcade Games Completed'] || 0,
          'Names of Completed Arcade Games': entry._9 || entry['Names of Completed Arcade Games'] || '',
        })).filter((entry: any) => entry['User Email']) // Filter out entries without email
      : [];

    // To ensure, sort and reassign if needed, but since upload does it, optional
    // But to be safe, do it
    const sortedEntries = [...transformedEntries].sort((a, b) => {
      const aCompleted = a['All Skill Badges & Games Completed'] === 'Yes' ? 1 : 0;
      const bCompleted = b['All Skill Badges & Games Completed'] === 'Yes' ? 1 : 0;
      if (aCompleted !== bCompleted) return bCompleted - aCompleted;
      const aTotal = (a['# of Skill Badges Completed'] || 0) + (a['# of Arcade Games Completed'] || 0);
      const bTotal = (b['# of Skill Badges Completed'] || 0) + (b['# of Arcade Games Completed'] || 0);
      return bTotal - aTotal;
    });
    sortedEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return NextResponse.json({
      entries: sortedEntries as LeaderboardEntry[],
      frozenUsers: doc.frozenUsers as Record<string, FrozenUser>,
    });
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}