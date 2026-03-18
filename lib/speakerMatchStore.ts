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
  token?: string;
}

const STORAGE_KEY = "speakerMatchData";

// js-cache-storage: cache en memoria para evitar lecturas repetidas a localStorage
// (se invalida en cada write y en clear)
let _cache: SpeakerMatchData | null = null;

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

  if (_cache) return _cache;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw) as Partial<SpeakerMatchData> | null;

    if (!parsed || typeof parsed !== "object") {
      return getDefaultData();
    }

    const base = getDefaultData();

    _cache = {
      intake: {
        ...base.intake,
        ...(parsed.intake ?? {}),
      },
      matchAnswers: Array.isArray(parsed.matchAnswers)
        ? parsed.matchAnswers.map((v) => (typeof v === "string" ? v : "")).filter(Boolean)
        : base.matchAnswers,
      token: typeof parsed.token === "string" ? parsed.token : undefined,
    };

    return _cache;
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
    token: partial.token !== undefined ? partial.token : current.token,
  };

  _cache = merged;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // noop: si localStorage falla, no rompemos la app
  }
}

export function clearSpeakerMatchData(): void {
  _cache = null;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
