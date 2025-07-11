"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRONTEND_URL = exports.JWT_SECRET = exports.MONGO_URL = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.MONGO_URL = "mongodb+srv://Mridulkalra:Kalra@cluster0.kmgsqbf.mongodb.net/myDatabase?retryWrites=true&w=majority&appName=Cluster0";
exports.JWT_SECRET = "supersecretkey";
exports.FRONTEND_URL = process.env.FRONTEND_URL || "";
