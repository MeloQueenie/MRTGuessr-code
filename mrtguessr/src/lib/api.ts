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
  totalScore: number;
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
  totalScore: number;
  createdAt: string;
  completedAt: string | null;
  results: GuessResult[];
  displayName: string | null;
  username: string | null;
  profilePicture: string | null;
}
export interface GameStatisticsData {
  totalPanoramas: number;
  uniqueCities: number;
}

export interface InternalPanoramaData {
  [panoramaId: number]: {
    x: number;
    z: number;
    town: string;
    rank: string;
    notes: string;
  }
}

export interface DynmapPlayer {
  world: string;
  armor: number;
  name: string;
  x: number;
  y: number;
  health: number;
  z: number;
  sort: number;
  type: string;
  account: string;
}

export interface DynmapData {
  currentcount: number;
  hasStorm: boolean;
  players: DynmapPlayer[];
  isThundering: boolean;
  confighash: number;
  servertime: number;
  updates: any[];
  timestamp: number;
}

export interface User {
  uuid: string;
  username: string;
  display_name: string;
  description: string | null;
  profile_picture: string | null;
}

export interface AuthCheckResponse {
  authenticated: boolean;
  user?: User;
}

export interface UserProfile {
  uuid: string;
  username: string;
  displayName: string;
  description: string | null;
  profilePicture: string | null;
  createdAt: string;
}

export interface LeaderboardEntry {
  displayName: string;
  username: string;
  profilePicture: string | null;
  totalScore: number;
  createdAt: string;
}

export interface UserGame {
  uuid: string;
  createdAt: string;
  completedAt: string;
  totalScore: number;
  roundsPlayed: number;
}

export interface UserGamesResponse {
  games: UserGame[];
  page: number;
  limit: number;
  total: number;
  stats: {
    totalGames: number;
    totalScore: number;
    avgScore: number;
  };
}

// --- API Functions --- //

// Auth Functions
export async function checkAuth(): Promise<AuthCheckResponse> {
  let res = await fetch(`${API_URL}/auth/check`, {
    credentials: 'include',
  });
  let data = await res.json();
  return data;
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export function getLoginUrl(): string {
  return `${API_URL}/auth/login`;
}

export async function getHealth(): Promise<string> {
  let res = await fetch(`${BASE_URL}/health`);
  let data = await res.text();
  return data;
}

export async function fetchGameStatistics(): Promise<GameStatisticsData> {
  let res = await fetch(`${API_URL}/game/statistics`, {
    credentials: 'include',
  });
  let data = await res.json();
  return data;
}

export async function fetchInternalPanoramaData(): Promise<InternalPanoramaData> {
  let res = await fetch(`${API_URL}/game/internal_panorama_data`, {
    credentials: 'include',
  });
  let data = await res.json();
  return data;
}
export async function fetchDynmapNewData(): Promise<DynmapData> {
  let res = await fetch(`${API_URL}/tiles/dynmap_new.json`, {
    credentials: 'include',
  });
  let data = await res.json();
  return data;
}

export async function startGame(): Promise<StartData> {
  let res = await fetch(`${API_URL}/game/start`,
    { method: 'POST', credentials: 'include' }
  );
  let data = await res.json();
  return data;
}

export async function fetchRoundData(uuid: string): Promise<RoundData> {
  let res = await fetch(`${API_URL}/game/${uuid}/round`,
    { method: 'POST', credentials: 'include' }
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
    credentials: 'include',
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
  let res = await fetch(`${API_URL}/game/${uuid}/results`, {
    credentials: 'include',
  });
  let data = await res.json();
  return data;
}

export async function fetchUserProfile(identifier: string): Promise<UserProfile> {
  let res = await fetch(`${API_URL}/user/${identifier}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('User not found');
  }
  let data = await res.json();
  return data;
}

export async function updateUserProfile(identifier: string, description: string): Promise<UserProfile> {
  let res = await fetch(`${API_URL}/user/${identifier}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ description }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update profile');
  }
  let data = await res.json();
  return data;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  let res = await fetch(`${API_URL}/game/leaderboard`, {
    credentials: 'include',
  });
  let data = await res.json();
  return data;
}

export async function fetchUserGames(identifier: string, page: number = 1, limit: number = 10): Promise<UserGamesResponse> {
  let res = await fetch(`${API_URL}/user/${identifier}/games?page=${page}&limit=${limit}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch user games');
  }
  let data = await res.json();
  return data;
}