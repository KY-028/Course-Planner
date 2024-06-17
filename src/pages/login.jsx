import React from 'react'
import { Link } from 'react-router-dom'
function Login() {
    return (
        <div className='login'>
            <form>
                <h1>Welcome</h1>
                <input required type="text" placeholder='User name'/>
                <input required type="password" placeholder='Password'/>
                <button>Login</button>
                <p>This is an error!</p>
                <span> Don't you have an account? <Link to="/signUp">Sign up</Link>
                </span>
            </form>
        </div>
    )
}

export default Login