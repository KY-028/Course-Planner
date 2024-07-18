import React, { useState } from 'react';

const DonateBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const paypalLink = "https://www.paypal.com/donate/?hosted_button_id=L2TFH8944UFCS";

  const handleClose = () => {
    setIsVisible(false);
  }

  const handleDonateClick = () => {
    const popupWidth = 400;
    const popupHeight = 600;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const popupLeft = (windowWidth / 2) - (popupWidth / 2);
    const popupTop = (windowHeight / 2) - (popupHeight / 2);
    window.open(paypalLink, "Donate", `width=${popupWidth},height=${popupHeight},top=${popupTop},left=${popupLeft}`);
  }

  if (!isVisible) return null;

  return (
    <div className="relative w-full bg-blue-100 flex justify-center items-center py-2 mb-2 bg-opacity-40">
      <button onClick={handleClose} className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl text-black hover:text-[#D2042D]">
        &times;
      </button>
      <p className="sm:block hidden text-center text-blue-800">Liked Course Planner? Send a donation!</p>
      <p className="sm:hidden block text-center text-blue-800">Send a donation!</p>
      <button
        className="ml-2 text-blue-800 hover:text-blue-600"
        onMouseOver={() => document.getElementById('info-tooltip').style.visibility = 'visible'}
        onMouseOut={() => document.getElementById('info-tooltip').style.visibility = 'hidden'}
      >
        <img src='info.svg' className='w-4'></img>
      </button>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded ml-3 text-sm"
        onClick={handleDonateClick}
      >
        Donate!
      </button>
      <div id="info-tooltip" className="z-50 absolute w-[35%] top-full mt-2 left-1/2 -translate-x-1/2 bg-white text-black p-2 border rounded shadow-lg text-xs invisible" >
        Help us cover the web hosting, server set up, and labor costs to keep the site running for future years and other upcoming amazing features!
      </div>
    </div>
  );
}

export default DonateBanner;
