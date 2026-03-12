// middleware/auth.middleware.js

const supabase = require("../config/supabaseClient");
const pool = require("../config/db");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    // Fetch role and verification status from our database
    const dbUserResult = await pool.query(
      "SELECT role, is_verified FROM users WHERE user_id = $1",
      [user.id]
    );

    if (dbUserResult.rowCount === 0) {
      return res.status(403).json({ error: "User profile not found." });
    }

    const dbUser = dbUserResult.rows[0];

    // Check if user is verified (Admins bypass this)
    if (dbUser.role !== 'admin' && !dbUser.is_verified) {
      return res.status(403).json({ error: "Your account is pending admin approval." });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: dbUser.role,
      is_verified: dbUser.is_verified
    };

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(500).json({ error: "Authentication failed." });
  }
};

module.exports = authMiddleware;