import express from "express"
import {courseChange} from "../operation/courseChange.js"

const router = express.Router()

router.post("/", courseChange)

export default router