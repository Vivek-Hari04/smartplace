require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

/*IMPORT BACKEND MODULES*/

const router = require("./src/routes/router");
const errorMiddleware = require("./src/middleware/error.middleware");
const pool = require("./src/config/db"); // Shared DB pool instance

const app = express();
const port = process.env.PORT || 3000;

/*GLOBAL MIDDLEWARE*/

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*SUPABASE CLIENT(Used for token validation)*/

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/*AUTHENTICATION MIDDLEWARE*/

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

/*HEALTH CHECK (Public)*/

app.get("/", async (req, res) => {
  try {
    const dbResult = await pool.query("SELECT NOW()");
    res.send(`Backend is running! DB Time: ${dbResult.rows[0].now}`);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Database connection failed",
      message: err.message,
    });
  }
});

/*PROTECTED TEST ROUTES*/

app.get("/db", authenticateUser, async (req, res) => {
  try {
    const result = await pool.query("SELECT fname, lname FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB query failed" });
  }
});

app.get("/student_list", authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT fname, lname FROM users WHERE role = 'student'"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB query failed" });
  }
});

/*PROTECT ALL MAIN API ROUTES*/

app.use("/api", authenticateUser, router);

/*GLOBAL ERROR HANDLER */

app.use(errorMiddleware);

/*SERVER START*/

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});

module.exports = app;