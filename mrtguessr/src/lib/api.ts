export const BASE_URL = 'http://localhost:5000';
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

export async function fetchRoundData() {
  let res = await fetch(`${API_URL}/round`);
  let data = await res.json();
  return data;
}


export async function getPanoramaUrl(panoramaId: string) {
  return `${API_URL}/panorama/${panoramaId}`;
}

export interface GuessResult {
  actualX: number;
  actualZ: number;
  distance: number;
  score: number;
  town: string;
}

export async function postGuess(panoramaId: string, guessX: number, guessZ: number): Promise<GuessResult> {
  let res = await fetch(`${API_URL}/guess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      panoramaId: panoramaId,
      guessX: guessX,
      guessZ: guessZ,
    }),
  });
  let data = await res.json();
  console.log(data);
  return data;
}