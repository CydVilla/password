import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from "react";
import { getDailyPassword } from "./game/dailyPassword";
import { answerQuestion, evaluateGuess } from "./game/gameLogic";

type QuestionLog = {
  question: string;
  response: string;
};

type GuessLog = {
  guess: string;
  response: string;
  closeness: "cold" | "warm" | "hot";
};

type LeaderboardEntry = {
  id: string;
  name: string;
  completedAt: string;
  solveTimeMs: number;
};

type TerminalLineStyle = CSSProperties & {
  "--line-delay": string;
};

const MAX_QUESTIONS = 5;

function App() {
  const [now, setNow] = useState(() => new Date());
  const puzzle = useMemo(() => getDailyPassword(now), [now]);
  const [phase, setPhase] = useState<"intro" | "playing" | "won">("intro");
  const [playerName, setPlayerName] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [questionInput, setQuestionInput] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [questions, setQuestions] = useState<QuestionLog[]>([]);
  const [guesses, setGuesses] = useState<GuessLog[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [winnerEntryId, setWinnerEntryId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setPhase("intro");
    setPlayerName("");
    setPendingName("");
    setQuestionInput("");
    setGuessInput("");
    setQuestions([]);
    setGuesses([]);
    setStartedAt(null);
    setWinnerEntryId(null);
    setLeaderboard(loadLeaderboard(puzzle.dayKey));
  }, [puzzle.dayKey]);

  const questionsRemaining = MAX_QUESTIONS - questions.length;
  const hasWon = phase === "won";
  const currentRank = winnerEntryId
    ? leaderboard.findIndex((entry) => entry.id === winnerEntryId) + 1
    : null;

  function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanedName = pendingName.trim().slice(0, 24);

    if (!cleanedName) {
      return;
    }

    setPlayerName(cleanedName);
    setStartedAt(Date.now());
    setPhase("playing");
  }

  function handleQuestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = questionInput.trim();

    if (!question || questionsRemaining <= 0 || hasWon) {
      return;
    }

    const response = answerQuestion(question, puzzle, questions.length);
    setQuestions((current) => [...current, { question, response }]);
    setQuestionInput("");
  }

  function handleGuessSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const guess = guessInput.trim();

    if (!guess || hasWon || !startedAt) {
      return;
    }

    const result = evaluateGuess(guess, puzzle, guesses.length);
    setGuesses((current) => [
      ...current,
      {
        guess,
        response: result.response,
        closeness: result.closeness,
      },
    ]);
    setGuessInput("");

    if (result.isCorrect) {
      const completedAt = new Date();
      const entry: LeaderboardEntry = {
        id: `${completedAt.toISOString()}-${crypto.randomUUID()}`,
        name: playerName,
        completedAt: completedAt.toISOString(),
        solveTimeMs: completedAt.getTime() - startedAt,
      };
      const updatedLeaderboard = saveLeaderboard(puzzle.dayKey, entry);

      setLeaderboard(updatedLeaderboard);
      setWinnerEntryId(entry.id);
      setPhase("won");
    }
  }

  return (
    <main className="screen">
      <section className="terminal" aria-labelledby="game-title">
        <div className="terminal__chrome">
          <span />
          <span />
          <span />
        </div>

        <header className="hero">
          <p className="kicker">Daily encrypted news signal</p>
          <h1 id="game-title">PASSWORD</h1>
          <p className="subtitle">
            Guess the word buried in the news cycle. The system resets at 06:00.
          </p>
        </header>

        <div className="status-grid" aria-label="Daily game status">
          <Status label="Game day" value={puzzle.dayKey} />
          <Status label="Questions left" value={`${questionsRemaining}/${MAX_QUESTIONS}`} />
          <Status label="Next reset" value={formatTime(puzzle.resetsAt)} />
        </div>

        {phase === "intro" ? (
          <section className="panel">
            <p className="prompt-line">
              RUN PLAYER_REGISTRATION.EXE. Enter any handle. The machine will pretend to care.
            </p>
            <form className="command-form" onSubmit={handleNameSubmit}>
              <label htmlFor="player-name">Operator name</label>
              <div className="input-row">
                <span aria-hidden="true">&gt;</span>
                <input
                  id="player-name"
                  value={pendingName}
                  onChange={(event) => setPendingName(event.target.value)}
                  maxLength={24}
                  placeholder="e.g. rad_guest"
                  autoComplete="off"
                />
                <button type="submit">Boot</button>
              </div>
            </form>
          </section>
        ) : (
          <section className="game-grid">
            <div className="panel">
              <p className="prompt-line">
                WELCOME, {playerName.toUpperCase()}. Ask up to five questions, then guess the password.
              </p>

              <form className="command-form" onSubmit={handleQuestionSubmit}>
                <label htmlFor="question">Ask the hint daemon</label>
                <div className="input-row">
                  <span aria-hidden="true">?</span>
                  <input
                    id="question"
                    value={questionInput}
                    onChange={(event) => setQuestionInput(event.target.value)}
                    placeholder={
                      questionsRemaining > 0 ? "Is it politics, tech, sports..." : "Question limit exhausted"
                    }
                    disabled={questionsRemaining <= 0 || hasWon}
                    autoComplete="off"
                  />
                  <button type="submit" disabled={questionsRemaining <= 0 || hasWon}>
                    Ask
                  </button>
                </div>
              </form>

              <form className="command-form" onSubmit={handleGuessSubmit}>
                <label htmlFor="guess">Enter password guess</label>
                <div className="input-row">
                  <span aria-hidden="true">&gt;</span>
                  <input
                    id="guess"
                    value={guessInput}
                    onChange={(event) => setGuessInput(event.target.value)}
                    placeholder="Type the daily password"
                    disabled={hasWon}
                    autoComplete="off"
                  />
                  <button type="submit" disabled={hasWon}>
                    Submit
                  </button>
                </div>
              </form>

              {hasWon && (
                <div className="win-card" role="status">
                  <p>ACCESS GRANTED.</p>
                  <p>
                    Rank #{currentRank ?? "?"} for today. Finished at{" "}
                    {formatTime(new Date(leaderboard.find((entry) => entry.id === winnerEntryId)?.completedAt ?? ""))}.
                  </p>
                </div>
              )}
            </div>

            <div className="panel log-panel" aria-live="polite">
              <div className="log-panel__header">
                <div>
                  <p className="log-panel__eyebrow">MOTHER TERMINAL // 2122-A</p>
                  <h2>Session Log</h2>
                </div>
                <span className="log-panel__status">Signal open</span>
              </div>
              {questions.length === 0 && guesses.length === 0 ? (
                <div className="log__empty">
                  <span>Awaiting operator command</span>
                  <span className="terminal-cursor" aria-hidden="true" />
                </div>
              ) : (
                <ol className="log">
                  {questions.map((entry, index) => (
                    <li
                      className="log-entry log-entry--question"
                      key={`question-${index}`}
                      style={lineDelay(index)}
                    >
                      <span className="log-entry__meta">QUERY {String(index + 1).padStart(2, "0")}</span>
                      <span className="terminal-line terminal-line--command">? {entry.question}</span>
                      <span className="terminal-line terminal-line--response">{entry.response}</span>
                    </li>
                  ))}
                  {guesses.map((entry, index) => (
                    <li
                      className="log-entry log-entry--guess"
                      key={`guess-${index}`}
                      style={lineDelay(questions.length + index)}
                    >
                      <span className="log-entry__meta">PASSWORD ATTEMPT {String(index + 1).padStart(2, "0")}</span>
                      <span className="terminal-line terminal-line--command">&gt; {entry.guess}</span>
                      <span className={`badge badge--${entry.closeness}`}>{entry.closeness}</span>
                      <span className="terminal-line terminal-line--response">{entry.response}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        )}

        <section className="panel leaderboard" aria-labelledby="leaderboard-title">
          <div>
            <h2 id="leaderboard-title">Today&apos;s Leaderboard</h2>
            <p className="muted">Stored locally for this offline build. Global rankings need a backend.</p>
          </div>

          {leaderboard.length === 0 ? (
            <p className="empty-state">No confirmed operators yet.</p>
          ) : (
            <ol>
              {leaderboard.map((entry, index) => (
                <li key={entry.id}>
                  <span>#{index + 1}</span>
                  <strong>{entry.name}</strong>
                  <time dateTime={entry.completedAt}>{formatTime(new Date(entry.completedAt))}</time>
                  <small>{formatDuration(entry.solveTimeMs)}</small>
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>
    </main>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="status">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function lineDelay(index: number): TerminalLineStyle {
  return {
    "--line-delay": `${Math.min(index * 90, 720)}ms`,
  };
}

function leaderboardKey(dayKey: string) {
  return `password:leaderboard:${dayKey}`;
}

function loadLeaderboard(dayKey: string): LeaderboardEntry[] {
  try {
    const stored = window.localStorage.getItem(leaderboardKey(dayKey));
    return stored ? sortLeaderboard(JSON.parse(stored) as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLeaderboard(dayKey: string, entry: LeaderboardEntry): LeaderboardEntry[] {
  const updated = sortLeaderboard([...loadLeaderboard(dayKey), entry]);
  window.localStorage.setItem(leaderboardKey(dayKey), JSON.stringify(updated));
  return updated;
}

function sortLeaderboard(entries: LeaderboardEntry[]) {
  return entries.sort((left, right) => Date.parse(left.completedAt) - Date.parse(right.completedAt));
}

function formatTime(date: Date) {
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export default App;
