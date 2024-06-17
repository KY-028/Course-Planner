import express from "express"
import { addUser } from "../operation/user.js"

const router = express.Router()

router.get("/", addUser)

export default router