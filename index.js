import express from 'express';
import dotenv from 'dotenv';
import main from './config/db.js'; 
import cookieParser from 'cookie-parser';
import authrouter from './routes/userAuth.js';
import mongoose from 'mongoose';
import cors from 'cors';
import authrouter2 from './CreateWallet.js';

dotenv.config();
const app = express();

app.use(cors({
    origin: 'https://blockgo-frontend.onrender.com',
    credentials: true
}));

app.use(express.json()); 
app.use(cookieParser());

app.use("/", authrouter);
app.use("/", authrouter2);

const InitializeConnection = async () => {
    try {
        await main();     
        console.log("DB CONNECTED", mongoose.connection.name);
        app.listen(process.env.PORT, () => {
            console.log("Server Listening At Port Number " + process.env.PORT);     
        });
    } catch (err) {
        console.log("Error: " + err);
    }
}

InitializeConnection();
