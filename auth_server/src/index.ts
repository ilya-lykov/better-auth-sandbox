import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { Request, Response } from "express";
import { auth } from "./lib/auth.js";
import { db } from "./db/index.js";
import { session, user } from "./db/auth-schema.js";
import { eq } from "drizzle-orm";

const app = express();
const port = 3005;

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

app.use(express.json());
// app.all('/api/auth/*splat', toNodeHandler(auth));
app.all("/api/auth/*splat", (req, res, next) => {
  console.log(`[${req.method}] URL: ${req.url}`);
  toNodeHandler(auth);
  next();
});

// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth

app.post("/api/auth/sign-up/email", (req: Request, res: Response) => {
  console.log("Received sign-up request:", req.body);
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: "Missing required fields" });
  }

  const response = auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
    asResponse: true,
  }); // returns a response object instead of data

  res.json(response);
});

app.post("/api/auth/sign-in/email", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Missing required fields" });
  }
  const { headers, response } = await auth.api.signInEmail({
    returnHeaders: true,
    body: {
      email,
      password,
    },
  });
  const cookie = headers.get("set-cookie");
  res.append("set-cookie", <string>cookie);
  // // console.log(response);
  // console.log(res.getHeaders());
  // console.log(response);
  res.json(response.user);
});

app.get("/api/auth/get-session", async (req, res) => {
  const cookie = req.headers.cookie;
  const tokenId = cookie?.split("=")[1].split(".")[0];
  const userIdBySessionId = await db
    .select({
      userId: session.userId,
    })
    .from(session)
    .where(eq(session.token, <string>tokenId));
  console.log("SQL_select:", userIdBySessionId);

  const { userId } = userIdBySessionId[0];

  const userInfoByUserID = await db
    .select()
    .from(user)
    .where(eq(user.id, <string>userId));
  console.log("SQL_select:", userInfoByUserID);
  res.send(userInfoByUserID);
});

app.listen(port, () => {
  console.log(`Better Auth app listening on port ${port}`);
});
