
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  // Min 8 chars
  return password.length >= 8;
};

export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

export const sanitizeString = (value: string): string => {
  return value.trim();
};
