import dotenv from "dotenv";
dotenv.config();


export const MONGO_URL="mongodb+srv://Mridulkalra:Kalra@cluster0.kmgsqbf.mongodb.net/myDatabase?retryWrites=true&w=majority&appName=Cluster0";
export const JWT_SECRET ="supersecretkey";
 
export const FRONTEND_URL = process.env.FRONTEND_URL || "";