export function getPlayerIDFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = token.split('.')[1]; // JWT format: header.payload.signature
    const decoded = JSON.parse(atob(payload));
    return decoded.id;
  } catch (error) {
    console.error('Failed to decode token', error);
    return null;
  }
}