import jwt from "jsonwebtoken";

export const generateToken = (id) => {
  // Validate JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return token;
  } catch (error) {
    console.error('❌ Token generation error:', error.message);
    throw new Error('Failed to generate authentication token');
  }
};
