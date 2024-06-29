import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, useAnimation } from 'framer-motion';

export default function HomeNav() {

    const [open, setOpen] = useState(false);

    const menuVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.2
            }
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
    };

    const controls = useAnimation();

    useEffect(() => {
        if (open) {
            controls.start("visible");
        } else {
            controls.start("hidden");
        }
    }, [open, controls]);

    return (
        <header className="w-full z-50 sm:relative fixed top-0">
            {/* The Normal Screen Size */}
            <div className="sm:flex hidden w-full md:h-24 sm:h-16 justify-between bg-dark-blue">
                <Link to="/" className="flex items-center">
                    <img src={"/logo.png"} alt="Course Planner" className="p-4 max-h-full object-contain" />
                    <div className="text-white md:text-2xl text-lg font-bold">Course Planner</div>
                </Link>
                <div className="flex items-center text-white md:text-xl text-base mr-3">
                    <Link to="/about" className="ub md:mx-5 mx-3">
                        About
                    </Link>
                    <Link to="/support" className="ub md:mx-5 mx-3">
                        Support
                    </Link>
                </div>
                <div className="flex items-center">
                    <Link to="/login">
                        <button className="md:text-lg text-base p-3 py-1.5 rounded border-2 text-custom-blue-1 border-custom-blue-1 hover:bg-white hover:text-dark-blue hover:border-none">Log In</button>
                    </Link>
                    <Link to="/signup">
                        <button className="md:text-lg text-base mx-4 p-3 py-1.5 rounded bg-custom-blue-1 text-white hover:bg-white hover:text-dark-blue">Sign Up</button>
                    </Link>
                </div>
            </div>
            {/* The Mobile Screen Size */}

            <div className="sm:hidden flex w-full h-10 justify-between bg-dark-blue py-1">
                <Link to="/" className="flex items-center">
                    <img src={"/logo.png"} alt="Course Planner" className="p-1.5 pl-3 max-h-full object-contain" />
                    <div className="text-white text-lg font-bold">Course Planner</div>
                </Link>
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
                    animate={controls}
                    variants={menuVariants}
                    className={`z-40 flex-col flex-grow pb-2 absolute right-0 top-10 bg-dark-blue bg-opacity-90 w-full text-right ${open ? 'flex' : 'hidden'}`}
                >
                    <motion.div variants={itemVariants} className="px-4 py-2 w-full text-sm font-semibold bg-transparent rounded-lg text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:shadow-outline">
                        <Link to="/about">
                            About
                        </Link>
                    </motion.div>
                    <motion.div variants={itemVariants} className="px-4 py-2 w-full text-sm font-semibold bg-transparent rounded-lg text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:shadow-outline">
                        <Link to="/support">
                            Support
                        </Link>
                    </motion.div>
                    {/* <motion.div variants={itemVariants} className="px-4 py-2 w-full text-sm font-semibold bg-transparent rounded-lg text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:shadow-outline">
                        <Link to="/login">
                            Log in
                        </Link>
                    </motion.div>
                    <motion.div variants={itemVariants} className="px-4 py-2 w-full text-sm font-semibold bg-transparent rounded-lg text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:shadow-outline">
                        <Link to="/signup">
                            Sign up
                        </Link>
                    </motion.div> */}
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