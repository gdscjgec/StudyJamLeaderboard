# **App Name**: JGEC Study Jam Leaderboard

## Core Features:

- CSV Upload and Parsing: Accept a CSV file upload containing user data (Name, Email, Google Cloud Skills Boost Profile URL, Profile URL Status, Access Code Redemption Status, All Skill Badges & Games Completed, # of Skill Badges Completed, Names of Completed Skill Badges, # of Arcade Games Completed, Names of Completed Arcade Games).  Parse the CSV data to extract relevant information and stores them.
- Dynamic Leaderboard Generation: Generate a dynamic leaderboard based on the parsed CSV data, ranking users based on '# of Skill Badges Completed', with tie-breaking done via '# of Arcade Games Completed'.
- Position Freezing: Implement a feature where, if 'All Skill Badges & Games Completed' is 'Yes', the user's leaderboard position is frozen at their current rank.
- Persistent Ranking: Store frozen ranks and names and apply persistent ranking.  The position of users whose badges and game are complete is retained through CSV updates and app restarts.
- Data Validation Tool: Use AI to suggest likely data discrepancies between uploaded csv files. This serves as a tool for fixing faulty data.
- User Profile Linking: Display User Name, Email, and Google Cloud Skills Boost Profile URL in the leaderboard.

## Style Guidelines:

- Primary color: Google blue (#4285F4) for a familiar and trusted feel.
- Background color: Light gray (#F1F3F4), near-white for a clean interface.
- Accent color: Google yellow (#FBBC04) for highlighting key metrics.
- Font pairing: 'Inter' (sans-serif) for body text, and 'Space Grotesk' (sans-serif) for headlines. 'Inter' is used for its modern neutral feel and readability in tabular data, while 'Space Grotesk' can add a touch of computerized feel suitable for headlines
- Use clear, tabular layouts for the leaderboard with intuitive column sorting and filtering.
- Employ Google's Material Design icons for a consistent and recognizable look.
- Implement subtle animations for ranking updates and data loading.