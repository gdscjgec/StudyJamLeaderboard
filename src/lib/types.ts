
export interface LeaderboardEntry {
  rank: number;
  'User Name': string;
  'User Email': string;
  'Google Cloud Skills Boost Profile URL': string;
  '# of Skill Badges Completed': number;
  '# of Arcade Games Completed': number;
  'All Skill Badges & Games Completed': 'Yes' | 'No' | string;
  // Other fields from CSV can be added here if needed for display
  [key: string]: any;
}

export interface FrozenUser {
  rank: number;
  data: Omit<LeaderboardEntry, 'rank'>;
}
