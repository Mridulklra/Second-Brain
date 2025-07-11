// src/index.ts
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import z from "zod";
import cors from "cors";
import { ContentModel, LinkModel, UserModel } from "./db";
import { JWT_SECRET, FRONTEND_URL } from "./config";
import { userMiddleware } from "./middleware";
import { random } from "./utils";

const app = express();
console.log("✅ JWT_SECRET inside index.ts:", JWT_SECRET);
// CORS config
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

/** ------------------ Signup ------------------ */
app.post("/api/v1/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("📝 Signup endpoint hit");
    const requireBody = z.object({
      username: z.string().min(4).max(20),
      password: z.string().min(4).max(20)
    });

    const parsed = requireBody.safeParse(req.body);
    if (!parsed.success) {
      console.warn("⚠️ Signup validation failed:", parsed.error);
      res.status(400).json({ message: "Invalid input", error: parsed.error });
      return;
    }

    const { username, password } = req.body;
    await UserModel.create({ username, password });
    console.log("✅ User signed up:", username);
    res.json({ message: "User signed up" });

  } catch (error) {
    console.error("❌ Error in /signup:", error);
    res.status(400).json({ message: "Username already exists, try another." });
  }
});

/** ------------------ Signin ------------------ */
app.post("/api/v1/signin", async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("🔐 Signin endpoint hit");
    const { username, password } = req.body;

    const user = await UserModel.findOne({ username, password });
    if (!user) {
      console.warn("⚠️ Invalid login for:", username);
      res.status(403).json({ message: "Incorrect credentials" });
      return;
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    console.log("✅ Login successful for:", username);
    res.json({ token });

  } catch (error) {
    console.error("❌ Error in /signin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/** ------------------ Create Content ------------------ */
app.post("/api/v1/content", userMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, link, text, type } = req.body;

    await ContentModel.create({
      title,
      link,
      text,
      type,
      //@ts-ignore
      userId: req.userId,
      tags: []
    });

    res.json({ message: "Content added" });

  } catch (error) {
    console.error("❌ Error in /content POST:", error);
    res.status(500).json({ message: "Failed to add content" });
  }
});

/** ------------------ Get Content ------------------ */
app.get("/api/v1/content", userMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    //@ts-ignore
    const content = await ContentModel.find({ userId: req.userId }).populate("userId", "username");
    res.json({ content });
  } catch (error) {
    console.error("❌ Error in /content GET:", error);
    res.status(500).json({ message: "Failed to fetch content" });
  }
});

/** ------------------ Delete Content ------------------ */
app.delete("/api/v1/content", userMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.body;
    await ContentModel.deleteMany({
      _id: contentId,
      //@ts-ignore
      userId: req.userId
    });

    res.json({ message: "Content deleted" });
  } catch (error) {
    console.error("❌ Error in /content DELETE:", error);
    res.status(500).json({ message: "Failed to delete content" });
  }
});

/** ------------------ Share Link ------------------ */
app.post("/api/v1/brain/share", userMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { share } = req.body;

    if (share) {
      const existing = await LinkModel.findOne({
        //@ts-ignore
        userId: req.userId
      });

      if (existing) {
        res.json({ hash: existing.hash });
        return;
      }

      const hash = random(8);
      await LinkModel.create({
        //@ts-ignore
        userId: req.userId,
        hash
      });

      res.json({ hash });

    } else {
      await LinkModel.deleteOne({
        //@ts-ignore
        userId: req.userId
      });

      res.json({ message: "Removed share link" });
    }

  } catch (error) {
    console.error("❌ Error in /brain/share:", error);
    res.status(500).json({ message: "Error processing share request" });
  }
});

/** ------------------ Access Shared Brain ------------------ */
app.get("/api/v1/brain/:sharelink", async (req: Request, res: Response): Promise<void> => {
  try {
    const { sharelink: hash } = req.params;

    const link = await LinkModel.findOne({ hash });
    if (!link) {
      res.status(404).json({ message: "Invalid share link" });
      return;
    }

    const content = await ContentModel.find({ userId: link.userId });
    const user = await UserModel.findById(link.userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      username: user.username,
      content
    });

  } catch (error) {
    console.error("❌ Error in /brain/:sharelink:", error);
    res.status(500).json({ message: "Error accessing shared content" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\u2705 Server running at http://localhost:${PORT}`);
});

export default app;
