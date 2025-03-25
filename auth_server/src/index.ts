import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { Request, Response } from "express";
import { auth } from "./lib/auth.js";

const app = express();
const port = 3005;

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

// app.all('/api/auth/*splat', toNodeHandler(auth));
app.all("/api/auth/*splat", (req, resp) => {
  console.log(req.body);
  resp.send(`\n Отработал middleware \n`);
  toNodeHandler(auth);
});

// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.use(express.json());

app.post("/api/auth/sign-up/email", (req: Request, res: Response) => {
  console.log("Received signup request:", req.body);
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: "Missing required fields" });
  }

  res.json({ message: "User registered", email, name });
});

app.listen(port, () => {
  console.log(`Better Auth app listening on port ${port}`);
});
