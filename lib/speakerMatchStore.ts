export interface SpeakerMatchIntakeData {
  nombre: string;
  apellido: string;
  empresa: string;
  email: string;
  fecha: string;
}

export interface SpeakerMatchData {
  intake: SpeakerMatchIntakeData;
  matchAnswers: string[];
}

const STORAGE_KEY = "speakerMatchData";

function getDefaultData(): SpeakerMatchData {
  return {
    intake: {
      nombre: "",
      apellido: "",
      empresa: "",
      email: "",
      fecha: "",
    },
    matchAnswers: [],
  };
}

export function readSpeakerMatchData(): SpeakerMatchData {
  if (typeof window === "undefined") {
    return getDefaultData();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw) as Partial<SpeakerMatchData> | null;

    if (!parsed || typeof parsed !== "object") {
      return getDefaultData();
    }

    const base = getDefaultData();

    return {
      intake: {
        ...base.intake,
        ...(parsed.intake ?? {}),
      },
      matchAnswers: Array.isArray(parsed.matchAnswers)
        ? parsed.matchAnswers.map((v) => (typeof v === "string" ? v : "")).filter(Boolean)
        : base.matchAnswers,
    };
  } catch {
    return getDefaultData();
  }
}

export function writeSpeakerMatchData(partial: Partial<SpeakerMatchData>): void {
  if (typeof window === "undefined") return;

  const current = readSpeakerMatchData();
  const merged: SpeakerMatchData = {
    intake: {
      ...current.intake,
      ...(partial.intake ?? {}),
    },
    matchAnswers: partial.matchAnswers ?? current.matchAnswers,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // noop: si localStorage falla, no rompemos la app
  }
}

export function clearSpeakerMatchData(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

