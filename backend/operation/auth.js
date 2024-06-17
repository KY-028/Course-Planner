import {db} from "../db.js"

export const signUp = (req,res)=>{

    // check existing user
    const q = "SELECT * FROM users WHERE email = ?"

    db.query(q, [req.body.email], (err,date) => {
        if (err) return res.json(err)
        if (date.length) return res.status(409).json("Success!")

        // Hash the pw and create a user
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(rec.body.password, salt);

        const q = "INSERT INTO users('firstName', 'lastName', 'username', 'email', 'password', 'grade')"
        const values = [
            req.body.firstName,
            req.body.lastName,
            req.body.username,
            req.body.email,
            hash,
            req.body.grade,
        ]

        db.query(q,[value], (err,data) => {
            if (err) return res.json(err);
            return res.status(200).json("User has been created")
        })
    })
}

export const login = (req,res)=>{
    
}

export const logout = (req,res)=>{
    
}
