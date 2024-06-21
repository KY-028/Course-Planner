import React from 'react';
import { Link } from 'react-router-dom';
import mainIcon from '../assets/icon1.png';

const LeftMenu = ({ activeTab }) => {
    return(
        <div className="w-64 h-screen bg-darkdarkBlue text-white flex flex-col p-5 drop-shadow-lg">
            <div className='flex items-center mb-8'>
                <img src={mainIcon} alt="icon" className="w-10 h-10 mr-2" />
                <h1 className="text-xl font-bold ml-3">CoursePlanner</h1>
            </div>
            <Link to="/" className={`py-1.5 px-4 rounded-lg  text-xl ${activeTab === 'home' ? 'text-teal ' : ''}`}>Home</Link>
            <Link to="/" className={`py-1.5 px-4 rounded-lg  text-xl ${activeTab === 'planner' ? 'text-teal' : ''}`}>Planner</Link>
        </div>
    )
}

export default LeftMenu;