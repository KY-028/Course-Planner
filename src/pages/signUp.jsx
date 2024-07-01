import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const signUp = () => {
    const [inputs, setInputs] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        grade: "",
    })

    const [err, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await axios.post("https://cp-backend-psi.vercel.app/backend/auth/signUp", inputs);
            navigate("/login");
        } catch (err) {
            const errorMessage = err.response?.data?.message || "An unexpected error occurred";
            setError(errorMessage);
        }
    };

    return (
        <div className='login'>
            <form onSubmit={handleSubmit}>
                <h1>Sign up</h1>
                <input required type="text" placeholder='First name' name='firstName' onChange={handleChange} />
                <input required type="text" placeholder='Last name' name='lastName' onChange={handleChange} />
                <input required type="text" placeholder='User name' name='username' onChange={handleChange} />
                <input required type="email" placeholder='Email' name='email' onChange={handleChange} />
                <input required type="password" placeholder='Password' name='password' onChange={handleChange} />
                <input required type="number" maxLength="1" placeholder='Year of Study' name='grade' onChange={handleChange} />
                <button>Sign up</button>
                <p style={{ minHeight: '25px' }} >{err ? err : ''}</p>
                <span> You already have an account? <Link to="/login">Login</Link>
                </span>
            </form>
        </div>
    )
}

export default signUp