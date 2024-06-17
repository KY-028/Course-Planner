import express from "express"
import userRoutes from "./routes/users.js"
import authRoutes from "./routes/auth.js"

const app = express()

app.use(express.json())
app.use("/users", userRoutes)
app.use("/auth", authRoutes)

app.listen(8800, () => {
    console.log("connected!")
})