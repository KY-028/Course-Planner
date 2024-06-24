import React from 'react';
import { Link } from 'react-router-dom';
import mainIcon from '../assets/icon1.png';

const LeftMenu = ({ activeTab }) => {
    return (
        <div className="xl:w-64 lg:w-1/5 lg:flex hidden h-screen bg-dark-blue text-white flex-col p-5 drop-shadow-lg m-0 fixed">
            <Link to="/">
                <div className='flex items-center mb-8'>
                    <img src={mainIcon} alt="icon" className="w-10 h-10 mr-2" />
                    <h1 className="text-xl font-bold ml-1.5">Course Planner</h1>
                </div>
            </Link>
            <Link to="/course-selection" className={`py-1.5 px-4 rounded-lg  text-xl ${activeTab === 'courses' ? 'text-teal' : ''}`}>Courses</Link>
            <Link to="/planner" className={`py-1.5 px-4 rounded-lg  text-xl ${activeTab === 'planner' ? 'text-teal' : ''}`}>Planner</Link>
            <Link to="/about" className={`py-1.5 px-4 rounded-lg  text-xl ${activeTab === 'about' ? 'text-teal ' : ''}`}>About</Link>
            <Link to="/support" className={`py-1.5 px-4 rounded-lg  text-xl ${activeTab === 'support' ? 'text-teal' : ''}`}>Support</Link>
        </div>
    )
}

export default LeftMenu;