export const DAILY_RESET_HOUR = 6;

export type DailyPassword = {
  answer: string;
  category: string;
  trendSignal: string;
  eraHint: string;
  proximityTerms: string[];
};

const OFFLINE_TREND_PASSWORDS: DailyPassword[] = [
  {
    answer: "Iran",
    category: "international news",
    trendSignal: "a geopolitical flashpoint drawing intense coverage",
    eraHint: "The signal is coming from beyond the usual domestic static.",
    proximityTerms: ["tehran", "middle east", "persian gulf", "war", "sanctions"],
  },
  {
    answer: "Bitcoin",
    category: "markets and technology",
    trendSignal: "a volatile digital money story with a lot of chart-watching",
    eraHint: "Follow the green numbers, but do not trust them.",
    proximityTerms: ["crypto", "ethereum", "blockchain", "market", "coin"],
  },
  {
    answer: "Nvidia",
    category: "technology and markets",
    trendSignal: "an AI hardware giant repeatedly surfacing in business coverage",
    eraHint: "The machine in the corner is thinking too loudly.",
    proximityTerms: ["ai chips", "gpu", "semiconductor", "stock", "artificial intelligence"],
  },
  {
    answer: "Olympics",
    category: "sports and culture",
    trendSignal: "a global competition that pulls every time zone into the same arena",
    eraHint: "Listen for flags, medals, and broadcast fanfare.",
    proximityTerms: ["medals", "games", "athletes", "paris", "sports"],
  },
  {
    answer: "Taylor Swift",
    category: "entertainment",
    trendSignal: "a pop-culture machine powerful enough to bend headlines around it",
    eraHint: "The jukebox has swallowed the newswire.",
    proximityTerms: ["concert", "eras", "music", "pop star", "tour"],
  },
  {
    answer: "Election",
    category: "politics",
    trendSignal: "campaign coverage, polling, and arguments about who gets power next",
    eraHint: "Every terminal in town is counting votes before they exist.",
    proximityTerms: ["polls", "president", "candidate", "campaign", "vote"],
  },
  {
    answer: "Climate",
    category: "science and policy",
    trendSignal: "weather extremes, policy fights, and planetary warning lights",
    eraHint: "The forecast is not merely about whether you need an umbrella.",
    proximityTerms: ["heat", "weather", "warming", "emissions", "storm"],
  },
  {
    answer: "TikTok",
    category: "technology and culture",
    trendSignal: "a social video platform tangled in regulation and attention economics",
    eraHint: "Short clips. Long arguments. Endless scrolling.",
    proximityTerms: ["social media", "ban", "bytedance", "video", "influencer"],
  },
  {
    answer: "NASA",
    category: "science",
    trendSignal: "space launches, cosmic discoveries, and official mission chatter",
    eraHint: "Point the antenna up, not out.",
    proximityTerms: ["space", "moon", "rocket", "astronaut", "mars"],
  },
  {
    answer: "Cyberattack",
    category: "security and technology",
    trendSignal: "systems failing, companies apologizing, and investigators tracing packets",
    eraHint: "Something is knocking on the wrong port.",
    proximityTerms: ["hack", "ransomware", "breach", "malware", "outage"],
  },
];

export function getDailyPassword(now = new Date()): DailyPassword & { dayKey: string; resetsAt: Date } {
  const dayKey = getGameDayKey(now);
  const index = positiveHash(dayKey) % OFFLINE_TREND_PASSWORDS.length;

  return {
    ...OFFLINE_TREND_PASSWORDS[index],
    dayKey,
    resetsAt: getNextReset(now),
  };
}

export function getGameDayKey(now = new Date()): string {
  const gameDate = new Date(now);

  if (gameDate.getHours() < DAILY_RESET_HOUR) {
    gameDate.setDate(gameDate.getDate() - 1);
  }

  const year = gameDate.getFullYear();
  const month = String(gameDate.getMonth() + 1).padStart(2, "0");
  const day = String(gameDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNextReset(now: Date): Date {
  const reset = new Date(now);
  reset.setHours(DAILY_RESET_HOUR, 0, 0, 0);

  if (now >= reset) {
    reset.setDate(reset.getDate() + 1);
  }

  return reset;
}

function positiveHash(value: string): number {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }

  return Math.abs(hash);
}
