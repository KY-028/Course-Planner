import React from 'react'
import { Link } from 'react-router-dom'
function signUp() {
    return (
        <div className='login'>
            <form>
                <h1>Sign up</h1>
                <input required type="text" placeholder='First name'/>
                <input required type="text" placeholder='Last name'/>
                <input required type="text" placeholder='User name'/>
                <input required type="email" placeholder='Email'/>
                <input required type="password" placeholder='Password'/>
                <input required type="text" placeholder='Your grade'/>
                <button>Sign up</button>
                <p>This is an error!</p>
                <span> You already have an account? <Link to="/login">Login</Link>
                </span>
            </form>
        </div>
    )
}

export default signUp