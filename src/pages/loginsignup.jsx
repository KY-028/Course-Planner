import React from "react";
import * as Components from "/src/components/logincomponents";
import { useContext, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from "../context/authContext";
import Homenav from "/src/components/homenav"
import axios from 'axios'

export default function LoginSignup({ signinintent }) {

    const { login, currentUser } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            navigate("/course-selection");
        }
    }, [currentUser, navigate]);

    const [logininputs, setLoginInputs] = useState({
        email: "",
        password: "",
    })

    const [signupInputs, setSignupInputs] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        grade: "",
    })

    const [err, setError] = useState(null);
    const [signIn, toggle] = React.useState(signinintent);


    const handleLoginChange = (e) => {
        setLoginInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleSignupChange = (e) => {
        setSignupInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        try {
            await login(logininputs)
            navigate("/course-selection");
        } catch (err) {
            const errorMessage = err.response?.data?.message || "An unexpected error occurred";
            setError(errorMessage);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post("https://cp-backend-psi.vercel.app/backend/auth/signUp", signupInputs);
            setError("Success!");
            setLoginInputs((prev) => ({ ...prev, email: signupInputs.email }));
            setTimeout(() => {
                toggle(true);
                setError(null);
            }, 2000);
        } catch (err) {
            const errorMessage = err.response?.data?.message || "An Unexpected Error Has Occurred";
            setError(errorMessage);
        }
    };


    const handleToggle = (value) => {
        if (value) {
            setLoginInputs((prev) => ({ ...prev, password: "" }));
        } else {
            setSignupInputs((prev) => ({ ...prev, email: logininputs.email }));
        }
        toggle(value);
        setError(null);
    };


    return (
        <div>
            <Homenav accountpage={true} />
            <div className="md:flex hidden w-full h-screen items-center justify-center accountbackground">
                <div className="account bg-white rounded-lg shadow-lg relative overflow-hidden lg:w-[800px] lg:h-[50%] md:w-[678px] sm:w-[80%] min-w-[400px] min-h-[400px]">
                    <Components.SignUpContainer signingin={signIn}>
                        <form onSubmit={handleSignupSubmit} className={`${!signIn && "z-50"} bg-white flex items-center justify-center flex-col px-16 h-full text-center`}>
                            <h1>Create Account</h1>
                            <input required onChange={handleSignupChange} value={signupInputs.email} name="email" type="email" placeholder="Email" />
                            <input required onChange={handleSignupChange} value={signupInputs.username} name="username" type="text" placeholder="Username" />
                            <input required onChange={handleSignupChange} value={signupInputs.password} name="password" type="password" placeholder="Password" />
                            <input required onChange={handleSignupChange} value={signupInputs.grade} name="grade" type="number" min={1} placeholder="Year of Study" />
                            <p className="error">{err ? err : ''}</p>
                            <button type="submit">Sign Up</button>
                        </form>
                    </Components.SignUpContainer>
                    <Components.SignInContainer signingin={signIn}>
                        <form onSubmit={handleLoginSubmit} className="bg-white flex items-center justify-center flex-col px-16 h-full text-center">
                            <h1>Sign in</h1>
                            <input required onChange={handleLoginChange} value={logininputs.email} name="email" type="email" placeholder="Email" />
                            <input required onChange={handleLoginChange} value={logininputs.password} name="password" type="password" placeholder="Password" />
                            <p className="error" style={{ minHeight: '25px' }}>{err ? err : ''}</p>
                            <button type="submit">Sign In</button>
                        </form>
                    </Components.SignInContainer>
                    <Components.OverlayContainer signingin={signIn}>
                        <Components.Overlay signingin={signIn}>
                            <Components.LeftOverlayPanel signingin={signIn}>
                                <h1>Welcome Back!</h1>
                                <p>
                                    If you already have an account, please login with your personal info!
                                </p>
                                <Components.GhostButton onClick={() => handleToggle(true)}>
                                    Sign In
                                </Components.GhostButton>
                            </Components.LeftOverlayPanel>
                            <Components.RightOverlayPanel signingin={signIn}>
                                <h1>Don't have an account yet?</h1>
                                <p>
                                    Create an account with us now in just a few seconds!
                                </p>
                                <Components.GhostButton onClick={() => handleToggle(false)}>
                                    Sign Up
                                </Components.GhostButton>
                            </Components.RightOverlayPanel>
                        </Components.Overlay>
                    </Components.OverlayContainer>
                </div>
            </div>
            {
                signIn ? (
                    <div className="bg-[#264569] md:hidden flex flex-col w-full h-screen items-center justify-center">

                        <form className="sm:w-[60%] w-[80%] flex flex-col items-center justify-center" onSubmit={handleLoginSubmit}>
                            <h1 className="font-bold text-2xl mb-1.5 mt-10 text-white">Welcome back!</h1>
                            <input className="bg-transparent border-b border-gray-300 text-white p-[5px_2px] m-[8px_10px]  focus:border-b-white focus:outline-none md:text-base w-3/4" required type="email" placeholder='Email' name='email' onChange={handleLoginChange} value={logininputs.email} />
                            <input className="bg-transparent border-b border-gray-300 text-white p-[5px_2px] m-[8px_10px] focus:border-b-white focus:outline-none md:text-base w-3/4" required type="password" placeholder='Password' name='password' onChange={handleLoginChange} value={logininputs.password} />
                            <button className="border border-[#79b7ff] text-white text-lg font-bold p-1.5 w-3/5 tracking-wide my-3.5 transition-transform duration-75 ease-in focus:outline-none active:scale-95 sm:text-sm sm:p-1 sm:w-3/4" onClick={handleLoginSubmit}>Log In</button>
                            <p className="text-base text-center text-yellow-300 mb-2.5" style={{ minHeight: '25px' }} >{err ? err : ''}</p>
                            <span className="text-white text-base text-center flex-col mb-10">
                                Don't have an account yet? <a className="text-[#b0e6ff] underline cursor-pointer" onClick={() => handleToggle(false)}>Sign up</a>
                            </span>
                        </form>
                    </div>

                ) : (

                    <div className="bg-[#264569] md:hidden flex flex-col w-full h-screen items-center justify-center">
                        <form className="sm:w-[60%] w-[80%]  flex flex-col items-center justify-center" onSubmit={handleSignupSubmit}>
                            <h1 className="font-bold text-xl mb-1.5 mt-10 text-white">Create Account</h1>

                            <input className="bg-transparent border-b border-gray-300 text-white p-[5px_2px] m-[8px_10px] w-3/5 focus:border-b-white focus:outline-none md:text-base md:w-3/4" required onChange={handleSignupChange} value={signupInputs.email} name="email" type="email" placeholder="Email" />
                            <input className="bg-transparent border-b border-gray-300 text-white p-[5px_2px] m-[8px_10px] w-3/5 focus:border-b-white focus:outline-none md:text-base md:w-3/4" required onChange={handleSignupChange} value={signupInputs.username} name="username" type="text" placeholder="Username" />
                            <input className="bg-transparent border-b border-gray-300 text-white p-[5px_2px] m-[8px_10px] w-3/5 focus:border-b-white focus:outline-none md:text-base md:w-3/4" required onChange={handleSignupChange} value={signupInputs.password} name="password" type="password" placeholder="Password" />
                            <input className="bg-transparent border-b border-gray-300 text-white p-[5px_2px] m-[8px_10px] w-3/5 focus:border-b-white focus:outline-none md:text-base md:w-3/4" required onChange={handleSignupChange} value={signupInputs.grade} name="grade" type="number" min={1} placeholder="Year of Study" />
                            <button className="border border-[#79b7ff] text-white text-lg font-bold p-1.5 w-3/5 tracking-wide my-3.5 transition-transform duration-75 ease-in focus:outline-none active:scale-95 sm:text-sm sm:p-1 sm:w-3/4">Sign Up</button>

                            <p className="text-base text-center text-yellow-300 mb-2.5" style={{ minHeight: '25px' }} >{err ? err : ''}</p>
                            <span className="text-white text-base text-center flex-col mb-10">
                                Already have an account? <a className="text-[#b0e6ff] underline cursor-pointer" onClick={() => handleToggle(true)}>Log in</a>
                            </span>
                        </form>
                    </div>
                )
            }
        </div>
    );
}
