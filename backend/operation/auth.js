import {db} from "../db.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export const signUp = (req,res) => {

    // check existing user
    const q = "SELECT * FROM users WHERE email = ?";

    db.query(q, [req.body.email], (err, data) => {
        if (err) {
            return res.status(500).json({ message: "Database error occurred!" });;
        }
        if (data.length) return res.status(409).json({ message: "User has been created!" });
        
        // Hash the pw and create a user
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);

        const q = "INSERT INTO users (firstName, lastName, username, email, password, grade) VALUES (?)";
        const values = [
            req.body.firstName,
            req.body.lastName,
            req.body.username,
            req.body.email,
            hash,
            req.body.grade,
        ];
        
        db.query(q, [values], (err,data) => {
            if (err) return res.status(500).json({ message: "Error creating user!" });
            return res.status(200).json({ message: "User has been created!" })
        });
    });
};

export const login = (req,res)=>{
    const q = "SELECT * FROM users WHERE email = ?"

    db.query(q, [req.body.email], (err, data) => {
        if (err) return res.status(500).json({ message: "Database error occurred!" })
        if (data.length === 0 ) return res.status(404).json({ message: "User not found!" })

        const checkPassword = bcrypt.compareSync(req.body.password, data[0].password)
        if (!checkPassword) 
            return res.status(400).json({ message: "Wrong password or username!" })
        
        const token = jwt.sign({ id: data[0].id }, "secretkey");
        const { password, ...others } = data[0];

        res.cookie("accessToken", token, {
            httpOnly: true,
        }).status(200).json(others);
    })
}

export const logout = (req,res)=>{
    res.clearCookie("accessToken",{
        httpOnly: true,
        secure:true,
        sameSite:"None"
    }).status(200).json("User already logout")
}
