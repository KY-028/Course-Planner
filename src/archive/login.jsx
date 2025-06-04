import React from 'react'
import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from "../context/authContext";

const Login = () => {
    const [inputs, setInputs] = useState({
        email: "",
        password: "",
    })

    const [err, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {

        e.preventDefault();
        try {
            await login(inputs);
            navigate("/course-selection", { replace: true });
        } catch (err) {
            const errorMessage = err.response?.data?.message || "An unexpected error occurred";
            setError(errorMessage);
        }
    };

    return (
        <div className='login'>
            <form>
                <h1>Welcome</h1>
                <input required type="email" placeholder='Email' name='email' onChange={handleChange} />
                <input required type="password" placeholder='Password' name='password' onChange={handleChange} />
                <button onClick={handleSubmit}>Log In</button>
                <p style={{ minHeight: '25px' }} >{err ? err : ''}</p>
                <span>
                    Do you have an account? <Link to="/signUp">Sign up</Link>
                </span>
            </form>
        </div>
    )
}

export default Login