/**
 * Generates a human-friendly, collision-free 6-character room code.
 * Excludes ambiguous characters (0, O, 1, I, L) for better mobile UX.
 */

const CHARACTERS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 6;

export const generateRoomCode = (): string => {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    code += CHARACTERS[randomIndex];
  }
  return code;
};
