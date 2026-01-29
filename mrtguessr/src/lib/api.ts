export const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';
export const API_URL = `${BASE_URL}/api`;

export const guessButtonPartsUrl = {
  LCorner: `${BASE_URL}/graphics/guessButton/MRTGuessr-GuessButton_LCorner.svg`,
  RCorner: `${BASE_URL}/graphics/guessButton/MRTGuessr-GuessButton_RCorner.svg`,
  Width: `${BASE_URL}/graphics/guessButton/MRTGuessr-GuessButton_Width.svg`,
  Text: `${BASE_URL}/graphics/guessButton/MRTGuessr-GuessButton_Text.svg`,
}

export const logoUrl = {
  Full: `${BASE_URL}/graphics/logo/MRTGuessr-GameLogo_Logo.svg`,
  Icon: `${BASE_URL}/graphics/logo/MRTGuessr-GameLogo_LogoOnly.svg`,
  Text: `${BASE_URL}/graphics/logo/MRTGuessr-GameLogo_TextOnly.svg`,
}

export const pinpointUrl = {
  Actual: `${BASE_URL}/graphics/pinpoint/MRTGuessr-PinpointLogo_Actual.svg`,
  Guess: `${BASE_URL}/graphics/pinpoint/MRTGuessr-PinpointLogo_Guess.svg`,
}

// --- Interfaces --- //
export interface StartData {
  uuid: string;
}
export interface RoundData {
  panoramaId: number;
  roundNumber: number;
  createdAt: string;
  error?: string;
}
export interface GuessResult {
  guessX: number;
  guessZ: number;
  actualX: number;
  actualZ: number;
  distance: number;
  score: number;
  town: string;
  roundNumber: number;
}
export interface ResultsData {
  roundNumber: number;
  createdAt: string;
  completedAt: string | null;
  results: GuessResult[];
}
export interface GameStatisticsData {
  totalPanoramas: number;
  uniqueCities: number;
}

// --- API Functions --- //

export async function getHealth(): Promise<string> {
  let res = await fetch(`${BASE_URL}/health`);
  let data = await res.text();
  return data;
}

export async function fetchGameStatistics(): Promise<GameStatisticsData> {
  let res = await fetch(`${API_URL}/game/statistics`);
  let data = await res.json();
  return data;
}

export async function startGame(): Promise<StartData> {
  let res = await fetch(`${API_URL}/game/start`,
    { method: 'POST' }
  );
  let data = await res.json();
  return data;
}

export async function fetchRoundData(uuid: string): Promise<RoundData> {
  let res = await fetch(`${API_URL}/game/${uuid}/round`,
    { method: 'POST' }
  );
  let data = await res.json();
  return data;
}

export async function getPanoramaUrl(panoramaId: number) {
  return `${API_URL}/panorama/${panoramaId}`;
}

export async function postGuess(uuid: string, guessX: number, guessZ: number): Promise<GuessResult> {
  let res = await fetch(`${API_URL}/game/${uuid}/guess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      guessX: guessX,
      guessZ: guessZ,
    }),
  });
  let data = await res.json();
  console.log(data);
  return data;
}

export async function fetchResults(uuid: string): Promise<ResultsData> {
  let res = await fetch(`${API_URL}/game/${uuid}/results`);
  let data = await res.json();
  return data;
}