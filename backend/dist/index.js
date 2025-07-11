"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = __importDefault(require("zod"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./db");
const config_1 = require("./config");
const middleware_1 = require("./middleware");
const utils_1 = require("./utils");
const app = (0, express_1.default)();
console.log("✅ JWT_SECRET inside index.ts:", config_1.JWT_SECRET);
// CORS config
app.use((0, cors_1.default)({
    origin: config_1.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express_1.default.json());
/** ------------------ Signup ------------------ */
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("📝 Signup endpoint hit");
        const requireBody = zod_1.default.object({
            username: zod_1.default.string().min(4).max(20),
            password: zod_1.default.string().min(4).max(20)
        });
        const parsed = requireBody.safeParse(req.body);
        if (!parsed.success) {
            console.warn("⚠️ Signup validation failed:", parsed.error);
            res.status(400).json({ message: "Invalid input", error: parsed.error });
            return;
        }
        const { username, password } = req.body;
        yield db_1.UserModel.create({ username, password });
        console.log("✅ User signed up:", username);
        res.json({ message: "User signed up" });
    }
    catch (error) {
        console.error("❌ Error in /signup:", error);
        res.status(400).json({ message: "Username already exists, try another." });
    }
}));
/** ------------------ Signin ------------------ */
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("🔐 Signin endpoint hit");
        const { username, password } = req.body;
        const user = yield db_1.UserModel.findOne({ username, password });
        if (!user) {
            console.warn("⚠️ Invalid login for:", username);
            res.status(403).json({ message: "Incorrect credentials" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, config_1.JWT_SECRET);
        console.log("✅ Login successful for:", username);
        res.json({ token });
    }
    catch (error) {
        console.error("❌ Error in /signin:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
/** ------------------ Create Content ------------------ */
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, link, text, type } = req.body;
        yield db_1.ContentModel.create({
            title,
            link,
            text,
            type,
            //@ts-ignore
            userId: req.userId,
            tags: []
        });
        res.json({ message: "Content added" });
    }
    catch (error) {
        console.error("❌ Error in /content POST:", error);
        res.status(500).json({ message: "Failed to add content" });
    }
}));
/** ------------------ Get Content ------------------ */
app.get("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const content = yield db_1.ContentModel.find({ userId: req.userId }).populate("userId", "username");
        res.json({ content });
    }
    catch (error) {
        console.error("❌ Error in /content GET:", error);
        res.status(500).json({ message: "Failed to fetch content" });
    }
}));
/** ------------------ Delete Content ------------------ */
app.delete("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contentId } = req.body;
        yield db_1.ContentModel.deleteMany({
            _id: contentId,
            //@ts-ignore
            userId: req.userId
        });
        res.json({ message: "Content deleted" });
    }
    catch (error) {
        console.error("❌ Error in /content DELETE:", error);
        res.status(500).json({ message: "Failed to delete content" });
    }
}));
/** ------------------ Share Link ------------------ */
app.post("/api/v1/brain/share", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { share } = req.body;
        if (share) {
            const existing = yield db_1.LinkModel.findOne({
                //@ts-ignore
                userId: req.userId
            });
            if (existing) {
                res.json({ hash: existing.hash });
                return;
            }
            const hash = (0, utils_1.random)(8);
            yield db_1.LinkModel.create({
                //@ts-ignore
                userId: req.userId,
                hash
            });
            res.json({ hash });
        }
        else {
            yield db_1.LinkModel.deleteOne({
                //@ts-ignore
                userId: req.userId
            });
            res.json({ message: "Removed share link" });
        }
    }
    catch (error) {
        console.error("❌ Error in /brain/share:", error);
        res.status(500).json({ message: "Error processing share request" });
    }
}));
/** ------------------ Access Shared Brain ------------------ */
app.get("/api/v1/brain/:sharelink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sharelink: hash } = req.params;
        const link = yield db_1.LinkModel.findOne({ hash });
        if (!link) {
            res.status(404).json({ message: "Invalid share link" });
            return;
        }
        const content = yield db_1.ContentModel.find({ userId: link.userId });
        const user = yield db_1.UserModel.findById(link.userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json({
            username: user.username,
            content
        });
    }
    catch (error) {
        console.error("❌ Error in /brain/:sharelink:", error);
        res.status(500).json({ message: "Error accessing shared content" });
    }
}));
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\u2705 Server running at http://localhost:${PORT}`);
});
exports.default = app;
