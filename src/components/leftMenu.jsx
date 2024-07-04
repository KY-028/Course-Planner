import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import mainIcon from '/src/assets/icon1.png';
import { AuthContext } from "../context/authContext";
import UpdateManager from "./updatemanager"

const LeftMenu = ({ activeTab }) => {
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
            alert("Please give us a few seconds to store your changes before logging out.")
        }
    };

    return (
        <div className="xl:w-64 lg:w-1/5 lg:flex hidden h-screen bg-dark-blue text-white flex-col p-5 drop-shadow-lg m-0 fixed" style={{ zIndex: 1000000 }}>
            <Link to="/">
                <div className='flex items-center mb-8'>
                    <img src={mainIcon} alt="icon" className="w-10 h-10 mr-2" />
                    <h1 className="text-xl font-bold ml-1.5">Course Planner</h1>
                </div>
            </Link>
            <Link to="/course-selection" className={`w-fit my-1.5 mx-4 text-xl ${activeTab === 'courses' ? 'text-teal' : ''}`}>Courses</Link>
            <Link to="/planner" className={`w-fit ub my-1.5 mx-4 text-xl ${activeTab === 'planner' ? 'text-teal' : ''}`}>Planner</Link>
            <Link to="/about" className={`w-fit ub my-1.5 mx-4 text-xl ${activeTab === 'about' ? 'text-teal ' : ''}`}>About</Link>
            <Link to="/support" className={`w-fit ub my-1.5 mx-4 text-xl ${activeTab === 'support' ? 'text-teal' : ''}`}>Support</Link>

            <div className='w-fit my-1.5 mx-4 text-gray-300 absolute bottom-8 text-sm text-start tracking-tight leading-tight'>Course database last updated: July 3rd (ECON), July 2nd (CISC, MATH, STAT)</div>

            {currentUser ?
                <button onClick={openModal} className={`w-fit ub my-1.5 mx-4 absolute xl:bottom-24 bottom-28 text-xl text-start`}>
                    Logout
                </button> :
                <Link to="/login" className={`w-fit ub my-1.5 mx-4 absolute bottom-8 text-xl text-start`}>
                    Log In
                </Link>
            }

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true" style={{ zIndex: 1100000 }}>
                    <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg z-60">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
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
        </div>
    );
}

export default LeftMenu;