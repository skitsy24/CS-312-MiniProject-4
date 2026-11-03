import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import session from "express-session";
import { hashPassword, verifyPassword } from "./passwords.js";

dotenv.config();

const db = new pg.Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

const app = express();
const port = 3000;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));
app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

function validCredentials(userId, password) {
    return typeof userId === "string" && userId.trim().length > 0 &&
        userId.trim().length <= 255 && typeof password === "string" &&
        password.length > 0 && password.length <= 1024;
}

function validName(name) {
    return typeof name === "string" && name.trim().length > 0 &&
        name.trim().length <= 255;
}

function trimmedField(value) {
    return typeof value === "string" ? value.trim() : "";
}

async function registerUser(userId, name, password) {
    try {
        await db.query(
            "INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)",
            [userId, await hashPassword(password), name]
        );
        return true;
    } catch (error) {
        if (error.code === "23505") return false;
        throw error;
    }
}

async function authenticateUser(userId, password) {
    const result = await db.query(
        "SELECT user_id, name, password FROM users WHERE user_id = $1",
        [userId]
    );
    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password))) return null;

    if (!user.password.startsWith("scrypt:")) {
        await db.query(
            "UPDATE users SET password = $1 WHERE user_id = $2 AND password = $3",
            [await hashPassword(password), userId, user.password]
        );
    }

    return { userId: user.user_id, name: user.name };
}

function startSession(req, user) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((error) => {
            if (error) return reject(error);
            req.session.user = user;
            req.session.save((saveError) => saveError ? reject(saveError) : resolve());
        });
    });
}

// middleware to require login for editing
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/signin");
    }

    next();
}

app.get("/api/me", (req, res) => {
    res.json({ user: req.session.user || null });
});

app.post("/api/signup", async (req, res) => {
    const userId = trimmedField(req.body?.user_id);
    const name = trimmedField(req.body?.name);
    const password = req.body?.password;

    if (!validCredentials(userId, password) || !validName(name)) {
        return res.status(400).json({ error: "Enter a user ID, name, and password." });
    }

    try {
        if (!(await registerUser(userId, name, password))) {
            return res.status(409).json({ error: "That user ID is already taken." });
        }
        res.status(201).json({ message: "Account created. Please sign in." });
    } catch (error) {
        console.error("Signup failed:", error);
        res.status(500).json({ error: "Could not create account." });
    }
});

app.post("/api/signin", async (req, res) => {
    const userId = trimmedField(req.body?.user_id);
    const password = req.body?.password;

    if (!validCredentials(userId, password)) {
        return res.status(400).json({ error: "Enter a user ID and password." });
    }

    try {
        const user = await authenticateUser(userId, password);
        if (!user) {
            return res.status(401).json({ error: "Incorrect user ID or password." });
        }
        await startSession(req, user);
        res.json({ user });
    } catch (error) {
        console.error("Signin failed:", error);
        res.status(500).json({ error: "Could not sign in." });
    }
});

app.post("/api/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Logout failed:", error);
            return res.status(500).json({ error: "Could not sign out." });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Signed out." });
    });
});

app.get("/signup", (req, res) => {
    res.render("signup", { error: null, userId: "", name: "" });
});

app.post("/signup", async (req, res) => {
    const userId = trimmedField(req.body.user_id);
    const name = trimmedField(req.body.name);
    const password = req.body.password;

    if (!validCredentials(userId, password) || !validName(name)) {
        return res.render("signup", {
            error: "Enter a user ID, name, and password.", userId, name
        });
    }

    if (!(await registerUser(userId, name, password))) {
        return res.render("signup", {
            error: "That user ID is already taken.", userId, name
        });
    }

    res.redirect("/signin");
});

app.get("/signin", (req, res) => {
    res.render("signin", { error: null });
});

app.post("/signin", async (req, res) => {
    const userId = trimmedField(req.body.user_id);
    const password = req.body.password;

    const user = validCredentials(userId, password)
        ? await authenticateUser(userId, password) : null;
    if (!user) {
        return res.render("signin", {
            error: "Incorrect user ID or password."
        });
    }

    await startSession(req, user);
    res.redirect("/");
});

app.post("/logout", (req, res, next) => {
    req.session.destroy((error) => {
        if (error) return next(error);
        res.clearCookie("connect.sid");
        res.redirect("/");
    });
});

app.get("/api/posts", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM blogs");
        res.json(result.rows);
    } catch (error) {
        console.error("Failed to load posts:", error);
        res.status(500).json({ error: "Could not load posts." });
    }
});

app.post("/api/posts", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Sign in to create a post." });
    }

    const title = trimmedField(req.body?.title);
    const body = req.body?.body;
    if (!title || title.length > 255 || typeof body !== "string" || !body.trim()) {
        return res.status(400).json({ error: "Enter a title and post body." });
    }

    try {
        const result = await db.query(
            `INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created)
             VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
            [req.session.user.name, req.session.user.userId, title, body]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Could not create post:", error);
        res.status(500).json({ error: "Could not create post." });
    }
});

app.patch("/api/posts/:id", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Sign in to edit a post." });
    }

    const title = trimmedField(req.body?.title);
    const body = req.body?.body;
    if (!/^\d+$/.test(req.params.id) || !title || title.length > 255 ||
        typeof body !== "string" || !body.trim()) {
        return res.status(400).json({ error: "Enter a title and post body." });
    }

    try {
        const result = await db.query(
            `UPDATE blogs SET title = $1, body = $2
             WHERE blog_id = $3 AND creator_user_id = $4 RETURNING *`,
            [title, body, req.params.id, req.session.user.userId]
        );
        if (result.rowCount === 0) {
            return res.status(403).json({ error: "You cannot edit this post." });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Could not edit post:", error);
        res.status(500).json({ error: "Could not edit post." });
    }
});

app.delete("/api/posts/:id", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Sign in to delete a post." });
    }
    if (!/^\d+$/.test(req.params.id)) {
        return res.status(400).json({ error: "Invalid post ID." });
    }

    try {
        const result = await db.query(
            "DELETE FROM blogs WHERE blog_id = $1 AND creator_user_id = $2",
            [req.params.id, req.session.user.userId]
        );
        if (result.rowCount === 0) {
            return res.status(403).json({ error: "You cannot delete this post." });
        }
        res.json({ message: "Post deleted." });
    } catch (error) {
        console.error("Could not delete post:", error);
        res.status(500).json({ error: "Could not delete post." });
    }
});

app.get("/", async (req, res) => {
    const result = await db.query("SELECT * FROM blogs");   

    res.render("index", {
        posts: result.rows,
        currentUser: req.session.user || null
    });
});

app.post("/posts", async (req, res) => {
    if (!req.session.user) return res.redirect("/signin");

    const title = req.body.title;
    const body = req.body.content;

    const creatorUserId = req.session.user.userId;
    const creatorName = req.session.user.name;

    await db.query(
        `INSERT INTO blogs
        (creator_name, creator_user_id, title, body, date_created)
        VALUES ($1, $2, $3, $4, NOW())`,
        [creatorName, creatorUserId, title, body]
    );

    res.redirect("/");

});

app.get("/posts/:id/edit", requireLogin, async (req, res) => {
    const id = req.params.id;

    const result = await db.query(
        `SELECT * FROM blogs
         WHERE blog_id = $1 AND creator_user_id = $2`,
        [id, req.session.user.userId]
    );

    if (result.rows.length === 0) {
        return res.status(403).send("You cannot edit this post.");
    }

    res.render("edit", { post: result.rows[0] });
});

app.post("/posts/:id/edit", requireLogin, async (req, res) => {
    const id = req.params.id;

    const result = await db.query(
        `UPDATE blogs
         SET title = $1, body = $2
         WHERE blog_id = $3 AND creator_user_id = $4`,
        [
            req.body.title,
            req.body.content,
            id,
            req.session.user.userId
        ]
    );

    if (result.rowCount === 0) {
        return res.status(403).send("You cannot edit this post.");
    }

    res.redirect("/");
});

app.post("/posts/:id/delete", requireLogin, async (req, res) => {
    const id = req.params.id;

    const result = await db.query(
        `DELETE FROM blogs
         WHERE blog_id = $1 AND creator_user_id = $2`,
        [id, req.session.user.userId]
    );

    if (result.rowCount === 0) {
        return res.status(403).send("You cannot delete this post.");
    }

    res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
