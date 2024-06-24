import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, useAnimation } from 'framer-motion';

export default function Nav({ activeTab }) {

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
        <header className="w-full z-40">
            {/* The Normal Screen Size */}
            <div className="lg:flex hidden justify-between items-center w-full h-16 px-4">
                <div className="flex-1"></div> {/* This div is just to center the title with flex */}
                <div className="flex-1 flex justify-center items-center text-2xl font-bold text-black  whitespace-nowrap">Course Selection Planner</div>
                <div className="flex-1 flex flex-col items-end text-black">
                    <div>Planning For</div>
                    <div>2024-2025</div>
                </div>
            </div>

            {/* The Smaller Screen Size */}

            <div className="lg:hidden flex w-full h-12 bg-dark-blue">
                <div className="w-full h-full flex justify-center items-center md:text-2xl text-lg font-bold text-white"> Course Selection Planner</div>
                <div className="z-50 absolute top-0 right-0 items-center p-1">
                    <button
                        className="relative w-8 h-8 rounded-lg focus:outline-none focus:shadow-outline"
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
                    className={`z-30 flex-col flex-grow pb-2 absolute right-0 top-10 bg-dark-blue bg-opacity-90 w-full text-right ${open ? 'flex' : 'hidden'}`}
                >
                    <motion.div variants={itemVariants} className="px-4 py-1 w-full font-semibold bg-transparent rounded-lg text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:shadow-outline">
                        <Link to="/home" className={`${activeTab === 'home' ? 'text-teal ' : ''}`}>Home</Link>
                    </motion.div>
                    <motion.div variants={itemVariants} className="px-4 py-1 w-full font-semibold bg-transparent rounded-lg text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:shadow-outline">
                        <Link to="/course-selection" className={`${activeTab === 'courses' ? 'text-teal' : ''}`}>Courses</Link>
                    </motion.div>
                    <motion.div variants={itemVariants} className="px-4 py-1 w-full font-semibold bg-transparent rounded-lg text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:shadow-outline">
                        <Link to="/planner" className={`${activeTab === 'planner' ? 'text-teal' : ''}`}>Planner</Link>
                    </motion.div>
                    <motion.div variants={itemVariants} className="px-4 py-1 w-full font-semibold bg-transparent rounded-lg text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:shadow-outline">
                        <Link to="/about" className={`${activeTab === 'about' ? 'text-teal ' : ''}`}>About</Link>
                    </motion.div>
                    <motion.div variants={itemVariants} className="px-4 py-1 w-full font-semibold bg-transparent rounded-lg text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:shadow-outline">
                        <Link to="/support" className={`${activeTab === 'support' ? 'text-teal' : ''}`}>Support</Link>
                    </motion.div>
                </motion.nav>
            </div>

        </header>
    );

}