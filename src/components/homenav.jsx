import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from 'framer-motion';

export default function HomeNav() {

    const [open, setOpen] = useState(false);
    const variants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <header className="w-full">
            {/* The Normal Screen Size */}
            <div className="sm:flex hidden w-full md:h-24 sm:h-16 justify-between bg-dark-blue">
                <div className="flex items-center">
                    <img src={"/logo.png"} alt="Course Planner" className="p-3 max-h-full object-contain" />
                    <div className="text-white md:text-2xl text-lg font-bold">Course Planner</div>
                </div>
                <div className="flex items-center text-white md:text-xl text-base mr-3">
                    <Link to="/about" className="md:mx-5 mx-3">
                        About
                    </Link>
                    <Link to="/support" className="md:mx-5 mx-3">
                        Support
                    </Link>
                </div>
                <div className="flex items-center">
                    <Link to="/login">
                        <button className="md:text-lg text-base p-3 py-1.5 rounded border-2 text-custom-blue-1 border-custom-blue-1">Log In</button>
                    </Link>
                    <Link to="/signup">
                        <button className="md:text-lg text-base mx-4 p-3 py-1.5 rounded bg-custom-blue-1 text-white">Sign Up</button>
                    </Link>
                </div>
            </div>
            {/* The Mobile Screen Size */}

            <div className="sm:hidden flex w-full h-10 justify-between bg-dark-blue">
                <div className="flex items-center">
                    <img src={"/logo.png"} alt="Course Planner" className="p-1 pl-2 max-h-full object-contain" />
                    <div className="text-white md:text-2xl text-lg font-bold">Course Planner</div>
                </div>
            <div className="flex items-center p-4">
                <button
                    className="relative w-8 h-8 rounded-lg md:hidden focus:outline-none focus:shadow-outline"
                    onClick={() => setOpen(!open)}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full object-contain"
                    >
                        <path
                            d="M4 6H20M4 12H20M4 18H20"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>
            <motion.nav
                initial="hidden"
                animate={open ? 'visible' : 'hidden'}
                variants={variants}
                className={`flex-col flex-grow pb-4 md:pb-0 md:flex md:justify-end md:flex-row absolute right-0 top-10 bg-dark-blue w-full md:w-auto ${open ? 'flex' : 'hidden'}`}
            >
                <Link className="px-4 py-2 mt-2 text-sm font-semibold bg-transparent rounded-lg md:mt-0 md:ml-4 text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:shadow-outline" to="/about">
                    About
                </Link>
                <Link className="px-4 py-2 mt-2 text-sm font-semibold bg-transparent rounded-lg md:mt-0 md:ml-4 text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700  focus:outline-none focus:shadow-outline" to="/support">
                    Support
                </Link>
                <Link className="px-4 py-2 mt-2 text-sm font-semibold bg-transparent rounded-lg md:mt-0 md:ml-4 text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700  focus:outline-none focus:shadow-outline" to="/login">
                    Log in
                </Link>
                <Link className="px-4 py-2 mt-2 text-sm font-semibold bg-transparent rounded-lg md:mt-0 md:ml-4 text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700  focus:outline-none focus:shadow-outline" to="/signup">
                    Sign up
                </Link>
            </motion.nav>
                {/* <div className="flex items-center text-white md:text2xl mr-3">
                    <Link to="/about" className="text-xl mx-5">
                        About
                    </Link>
                    <Link to="/support" className="text-xl mx-5">
                        Support
                    </Link>
                </div>
                <div className="flex items-center">
                    <Link to="/login">
                        <button className="md:text-xl text-lg p-2 rounded border-2 text-custom-blue-1 border-custom-blue-1">Log In</button>
                    </Link>
                    <Link to="/signup">
                        <button className="md:text-xl text-lg mx-3 p-2 rounded bg-custom-blue-1 text-white">Sign Up</button>
                    </Link>
                </div> */}
            </div>

        </header>
    );

}