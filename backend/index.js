import express from "express"
import cors from "cors"
import userRoutes from "./routes/users.js"
import authRoutes from "./routes/auth.js"
import courseChangeRoutes from "./routes/courseChange.js"
import cookieParser from "cookie-parser";


const app = express();
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.use(
    cors({
      origin: "http://localhost:3000",
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    })
);

app.use("/backend/users", userRoutes);
app.use("/backend/auth", authRoutes);
app.use("/backend/courseChange", courseChangeRoutes);

app.listen(8800, () => {
    console.log("connected!")
})