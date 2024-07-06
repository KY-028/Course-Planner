import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { motion, useAnimation } from 'framer-motion';
import { AuthContext } from "../context/authContext";
import UpdateManager from "./updatemanager"

export default function Nav({ activeTab }) {

    // For Log out
    const [isModalOpen, setIsModalOpen] = useState(false);
    const nav = useNavigate();

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const { currentUser, logout } = useContext(AuthContext);

    const handleLogout = async () => {
        try {
            await UpdateManager.waitForAllUpdates(); // Wait for all pending updates to complete
            // Proceed with logout
            console.log("All updates completed, proceeding with logout.");
            await logout()
            closeModal();
            nav('/login');
        } catch (error) {
            console.log(error);
            alert("Please give us a few seconds to store your changes before logging out.")
        }
    };

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
        <header className="w-full relative" style={{ zIndex: 50000 }}>
            {/* The Normal Screen Size */}
            <div className="z-40 lg:flex hidden justify-between items-center w-full h-16 px-4 py-10 bg-white">
                <div className="flex-1"></div> {/* This div is just to center the title with flex */}
                <div className="flex-1 flex justify-center items-center text-2xl font-bold text-dark-blue  whitespace-nowrap">Course Selection Planner</div>
                <div className="flex-1 flex flex-col items-end text-black">
                    {currentUser && currentUser.username ? (
                        <span>Username: {currentUser.username}</span>
                    ) : (
                        <span>Username: Not logged in!</span>
                    )}
                    <div>2024-2025</div>
                </div>
            </div>

            {/* The Smaller Screen Size */}

            <div className="lg:hidden flex w-full h-12 bg-dark-blue" style={{ zIndex: 2000000 }}>
                <div className="w-full h-full flex justify-center items-center md:text-2xl text-lg font-bold text-white"> Course Selection Planner</div>
                <div className="absolute top-0 right-0 items-center p-1">
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
                    className={`flex-col flex-grow pb-2 absolute right-0 top-10 bg-dark-blue bg-opacity-90 w-full text-right ${open ? 'flex' : 'hidden'}`}
                >
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
                    <motion.div variants={itemVariants} className="px-4 py-1 w-full font-semibold bg-transparent rounded-lg text-white focus:text-gray-400 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:shadow-outline">

                        {currentUser ?
                            <button onClick={openModal}>
                                Logout
                            </button> :
                            <Link to="/login" >
                                Log In
                            </Link>
                        }
                        {isModalOpen && (
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                                <div className="fixed inset-0 w-screen overflow-y-auto">
                                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
                                        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                            <div className="bg-white p-4">
                                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                                    </svg>
                                                </div>
                                                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                                    <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">Logout account</h3>
                                                    <div className="mt-2">
                                                        <p className="text-sm text-gray-500">Are you sure you want to logout?</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                                <button
                                                    type="button"
                                                    onClick={handleLogout}
                                                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={closeModal}
                                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                                >
                                                    No
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.nav>
            </div>

        </header>
    );

}