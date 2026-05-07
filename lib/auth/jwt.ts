import { SignJWT, jwtVerify, JWTPayload } from 'jose';

// Retrieve the secret securely from environment variables
const getSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  // The jose library requires the secret to be a Uint8Array
  return new TextEncoder().encode(secret);
};

/**
 * Signs a payload into a JWT string.
 * Uses Edge-compatible jose library.
 * 
 * @param payload Data to encode in the token (e.g., userId, role)
 * @returns Signed JWT string valid for 7 days
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
  const secretKey = getSecretKey();
  
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Expires in 7 days
    .sign(secretKey);
}

/**
 * Verifies a JWT string and returns the decoded payload.
 * Throws an error if the token is invalid or expired.
 * 
 * @param token The JWT string to verify
 * @returns The decoded JWTPayload
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  const secretKey = getSecretKey();
  
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
