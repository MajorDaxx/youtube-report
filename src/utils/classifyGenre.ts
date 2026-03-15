export type Genre =
  | 'Gaming'
  | 'Music'
  | 'Sports'
  | 'News & Politics'
  | 'Science & Tech'
  | 'Comedy & Entertainment'
  | 'Film & TV'
  | 'Education'
  | 'Food & Cooking'
  | 'Other'

export const GENRE_COLORS: Record<Genre, string> = {
  Gaming: '#6366f1',
  Music: '#ec4899',
  Sports: '#22c55e',
  'News & Politics': '#3b82f6',
  'Science & Tech': '#06b6d4',
  'Comedy & Entertainment': '#f59e0b',
  'Film & TV': '#8b5cf6',
  Education: '#10b981',
  'Food & Cooking': '#f97316',
  Other: '#6b7280',
}

type Rule = { keywords: string[]; hashtags: string[] }

const RULES: [Genre, Rule][] = [
  [
    'Gaming',
    {
      hashtags: ['gaming', 'game', 'gamer', 'minecraft', 'mario', 'roblox', 'fortnite', 'cod', 'valorant', 'lol', 'twitch', 'speedrun', 'gameplay'],
      keywords: ["let's play", 'lets play', 'gameplay', 'walkthrough', 'playthrough', 'speedrun', 'gaming', 'videogame', 'video game', 'spiel', 'spielen', 'zocken', 'streamer'],
    },
  ],
  [
    'Music',
    {
      hashtags: ['music', 'song', 'mv', 'lyrics', 'official', 'remix', 'cover', 'rap', 'hiphop', 'pop', 'edm', 'rnb', 'musik', 'konzert'],
      keywords: ['official video', 'official audio', 'music video', 'lyric video', 'lyrics', 'remix', 'cover', 'album', 'single', 'musik', 'konzert', 'feat.', '(prod.', 'beat'],
    },
  ],
  [
    'Sports',
    {
      hashtags: ['sport', 'sports', 'football', 'soccer', 'fussball', 'bundesliga', 'nfl', 'nba', 'tennis', 'f1', 'formula1', 'cycling', 'boxing', 'mma', 'gym', 'fitness', 'workout', 'training'],
      keywords: ['bundesliga', 'champions league', 'premier league', 'formula 1', 'grand prix', 'sportstudio', 'highlight', 'trikot', 'transfer', 'goal', 'tor ', 'match', 'spiel ', 'weltmeister', 'olympia'],
    },
  ],
  [
    'News & Politics',
    {
      hashtags: ['news', 'politik', 'politics', 'aktuell', 'breaking', 'tagesschau', 'nachrichten'],
      keywords: ['tagesschau', 'nachrichten', 'breaking news', 'politik', 'regierung', 'wahl', 'election', 'president', 'kanzler', 'parlament', 'ukraine', 'krieg', 'war ', 'biden', 'trump', 'minister'],
    },
  ],
  [
    'Science & Tech',
    {
      hashtags: ['science', 'tech', 'technik', 'technology', 'ai', 'nasa', 'physics', 'biology', 'chemistry', 'space', 'coding', 'programming'],
      keywords: ['nasa', 'rocket', 'spacex', 'artificial intelligence', 'machine learning', 'chatgpt', 'openai', 'claude', 'mcp', 'programming', 'code', 'developer', 'software', 'hardware', 'wissenschaft', 'forschung', 'studie', 'experiment', 'physik', 'chemie', 'biologie', 'quantencomputer'],
    },
  ],
  [
    'Comedy & Entertainment',
    {
      hashtags: ['comedy', 'funny', 'humor', 'lol', 'meme', 'prank', 'challenge', 'reaction', 'skit', 'viral', 'trending'],
      keywords: ['funny', 'comedy', 'prank', 'challenge', 'reaction', 'fails', 'meme', 'laugh', 'humor', 'lustig', 'witzig', 'spaß', 'show', 'entertainment'],
    },
  ],
  [
    'Film & TV',
    {
      hashtags: ['film', 'movie', 'cinema', 'serie', 'series', 'trailer', 'netflix', 'disney', 'marvel', 'dc'],
      keywords: ['trailer', 'official trailer', 'film ', 'movie', 'serie ', 'episode', 'staffel', 'season', 'netflix', 'amazon prime', 'disney+', 'hbo', 'review', 'explained', 'ending explained', '(2024)', '(2025)', '(2026)'],
    },
  ],
  [
    'Education',
    {
      hashtags: ['education', 'learn', 'tutorial', 'howto', 'uni', 'studium', 'schule', 'lernen', 'erklärt'],
      keywords: ['tutorial', 'how to', 'howto', 'explained', 'erklärt', 'erklärung', 'lernen', 'studium', 'schule', 'university', 'lecture', 'course', 'lesson', 'guide', 'diy'],
    },
  ],
  [
    'Food & Cooking',
    {
      hashtags: ['food', 'recipe', 'cooking', 'baking', 'kochen', 'essen', 'rezept', 'foodie'],
      keywords: ['recipe', 'cooking', 'baking', 'rezept', 'kochen', 'backen', 'essen', 'restaurant', 'food ', 'küche', 'gericht', 'zubereiten', 'zubereitung'],
    },
  ],
]

export function classifyGenre(title: string): Genre {
  if (!title) return 'Other'
  const lower = title.toLowerCase()

  // Extract hashtags from the title
  const titleHashtags = new Set(
    (lower.match(/#(\w+)/g) ?? []).map((h) => h.slice(1))
  )

  for (const [genre, { keywords, hashtags }] of RULES) {
    // Check hashtags first (high confidence)
    for (const tag of hashtags) {
      if (titleHashtags.has(tag)) return genre
    }
    // Check keywords
    for (const kw of keywords) {
      if (lower.includes(kw)) return genre
    }
  }

  return 'Other'
}
