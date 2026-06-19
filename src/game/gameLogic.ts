import type { DailyPassword } from "./dailyPassword";

export type GuessResult = {
  isCorrect: boolean;
  closeness: "cold" | "warm" | "hot";
  response: string;
};

const DIRECT_ANSWER_PATTERNS = [
  "answer",
  "password",
  "spell",
  "first letter",
  "starts with",
  "last letter",
  "how many letters",
  "give it",
  "tell me",
];

const QUESTION_RESPONSES = {
  direct: [
    "ACCESS DENIED. Nice try, operator. The machine refuses to print the password.",
    "NEGATIVE. If I hand you the word, the ghosts in the modem win.",
    "REQUEST REJECTED. Ask for a clue, not the contents of the vault.",
  ],
  category: [
    "The signal belongs to {category}. That is more than you deserve.",
    "Tune your antenna toward {category}. Do not get smug.",
    "Sector scan says {category}. The terminal sighs at your dependence.",
  ],
  news: [
    "It keeps surfacing because it is {trendSignal}.",
    "The newswire keeps blinking over {trendSignal}.",
    "The modem chatter points to {trendSignal}.",
  ],
  vague: [
    "CLUE BUFFER: {eraHint}",
    "SIGNAL READ: {eraHint} Stay near the headlines people keep repeating.",
    "TERMINAL HINT: {eraHint}",
  ],
};

const COLD_TAUNTS = [
  "That guess has drifted into deep space. The terminal laughs in 8-bit.",
  "A bold failure. Not adjacent, not nearby, barely in the same arcade.",
  "The machine accepts your offering and immediately files it under junk input.",
  "Incorrect. Somewhere, a dial-up modem screams for mercy.",
];

const WARM_TAUNTS = [
  "Wrong, but not embarrassing. The signal flickered for a second.",
  "Not the password. Still, the terminal briefly stopped insulting your map.",
  "You are orbiting the right noise, even if your landing gear is missing.",
  "Incorrect, but the guess has a pulse. Do not let that go to your head.",
];

const HOT_TAUNTS = [
  "Agonizingly wrong. You are close enough for the machine to get annoyed.",
  "No. But the terminal just sat up straighter, which is rude of it.",
  "That is near the vault door. Sadly, you still walked into the wall.",
  "Incorrect, but warm enough to fog the CRT glass.",
];

export function answerQuestion(question: string, puzzle: DailyPassword, questionNumber: number): string {
  const normalizedQuestion = normalize(question);
  const responseBank = pickQuestionBank(normalizedQuestion);
  const template = responseBank[questionNumber % responseBank.length];
  const response = template
    .replace("{category}", puzzle.category)
    .replace("{trendSignal}", puzzle.trendSignal)
    .replace("{eraHint}", puzzle.eraHint);

  return redactAnswer(response, puzzle.answer);
}

export function evaluateGuess(guess: string, puzzle: DailyPassword, attemptNumber: number): GuessResult {
  if (normalize(guess) === normalize(puzzle.answer)) {
    return {
      isCorrect: true,
      closeness: "hot",
      response: "ACCESS GRANTED. The password is accepted. The terminal begrudgingly respects you.",
    };
  }

  const closeness = scoreGuess(guess, puzzle);

  if (closeness >= 0.72) {
    return {
      isCorrect: false,
      closeness: "hot",
      response: HOT_TAUNTS[attemptNumber % HOT_TAUNTS.length],
    };
  }

  if (closeness >= 0.42) {
    return {
      isCorrect: false,
      closeness: "warm",
      response: WARM_TAUNTS[attemptNumber % WARM_TAUNTS.length],
    };
  }

  return {
    isCorrect: false,
    closeness: "cold",
    response: COLD_TAUNTS[attemptNumber % COLD_TAUNTS.length],
  };
}

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pickQuestionBank(question: string): string[] {
  if (DIRECT_ANSWER_PATTERNS.some((pattern) => question.includes(pattern))) {
    return QUESTION_RESPONSES.direct;
  }

  if (question.includes("category") || question.includes("topic") || question.includes("kind")) {
    return QUESTION_RESPONSES.category;
  }

  if (
    question.includes("news") ||
    question.includes("trend") ||
    question.includes("why") ||
    question.includes("where")
  ) {
    return QUESTION_RESPONSES.news;
  }

  return QUESTION_RESPONSES.vague;
}

function scoreGuess(guess: string, puzzle: DailyPassword): number {
  const normalizedGuess = normalize(guess);
  const normalizedAnswer = normalize(puzzle.answer);

  if (!normalizedGuess) {
    return 0;
  }

  const synonymScore = puzzle.proximityTerms.reduce((best, term) => {
    const normalizedTerm = normalize(term);

    if (normalizedGuess === normalizedTerm || normalizedGuess.includes(normalizedTerm)) {
      return Math.max(best, 0.68);
    }

    if (normalizedTerm.includes(normalizedGuess) && normalizedGuess.length > 3) {
      return Math.max(best, 0.56);
    }

    return best;
  }, 0);

  const editDistance = levenshtein(normalizedGuess, normalizedAnswer);
  const maxLength = Math.max(normalizedGuess.length, normalizedAnswer.length);
  const spellingScore = maxLength === 0 ? 0 : 1 - editDistance / maxLength;
  const tokenScore = sharedTokenScore(normalizedGuess, normalizedAnswer);

  return Math.max(synonymScore, spellingScore, tokenScore);
}

function sharedTokenScore(guess: string, answer: string): number {
  const guessTokens = new Set(guess.split(" ").filter(Boolean));
  const answerTokens = answer.split(" ").filter(Boolean);

  if (guessTokens.size === 0 || answerTokens.length === 0) {
    return 0;
  }

  const sharedTokens = answerTokens.filter((token) => guessTokens.has(token)).length;
  return sharedTokens / answerTokens.length;
}

function levenshtein(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

function redactAnswer(response: string, answer: string): string {
  const escapedAnswer = answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return response.replace(new RegExp(escapedAnswer, "gi"), "[REDACTED]");
}
