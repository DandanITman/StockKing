import express from 'express';
import { pool } from '../database/connection.js';
const router = express.Router();
// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }
        // Check if user already exists
        const existingQuery = 'SELECT id FROM users WHERE email = $1 OR username = $2';
        const existing = await pool.query(existingQuery, [email, username]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'User with this email or username already exists' });
        }
        // In a real app, you would hash the password here
        // For now, we'll store it as plain text (NOT recommended for production)
        const insertQuery = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, created_at
    `;
        const result = await pool.query(insertQuery, [username, email, password]);
        res.status(201).json({ user: result.rows[0] });
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});
// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const query = 'SELECT id, username, email, password_hash FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        // In a real app, you would compare hashed passwords
        // For now, we'll do a simple comparison (NOT recommended for production)
        if (user.password_hash !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Remove password from response
        const { password_hash, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    }
    catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});
// Get user profile
router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const query = 'SELECT id, username, email, created_at FROM users WHERE id = $1';
        const result = await pool.query(query, [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: result.rows[0] });
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});
// Update user preferences
router.put('/preferences/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { preferences } = req.body;
        if (!preferences) {
            return res.status(400).json({ error: 'Preferences are required' });
        }
        const query = `
      INSERT INTO user_preferences (user_id, preferences)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET preferences = $2, updated_at = CURRENT_TIMESTAMP
      RETURNING user_id, preferences, updated_at
    `;
        const result = await pool.query(query, [userId, JSON.stringify(preferences)]);
        res.json({ preferences: result.rows[0] });
    }
    catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});
// Get user preferences
router.get('/preferences/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const query = 'SELECT preferences, updated_at FROM user_preferences WHERE user_id = $1';
        const result = await pool.query(query, [userId]);
        if (result.rows.length === 0) {
            return res.json({ preferences: null });
        }
        res.json({ preferences: result.rows[0] });
    }
    catch (error) {
        console.error('Error fetching user preferences:', error);
        res.status(500).json({ error: 'Failed to fetch preferences' });
    }
});
export default router;
//# sourceMappingURL=users.js.map