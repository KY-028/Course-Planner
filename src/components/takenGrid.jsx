import plusIcon from '/plus_icon.svg';

export default function TakenGrid() {
    const headers = ["1st Year", "2nd Year", "3rd Year", "4th+ Year", "Transfer Credits"];
    
    return (
        <div className="w-full">
            {/* Headers */}
            <div className="grid grid-cols-5 rounded-t-lg overflow-hidden border border-gray-200">
                {headers.map((header, index) => (
                    <div 
                        key={index}
                        className="p-2 text-center font-medium border-l border-r border-gray-200 border-t border-b-0 border-solid"
                    >
                        {header}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="w-full grid grid-cols-5 rounded-b-lg overflow-hidden border border-gray-200">
                {[...Array(60)].map((_, index) => (
                    <div 
                        key={index}
                        className="bg-gray-100 hover:bg-gray-200 cursor-pointer px-2 xl:h-18 md-custom:h-16 sm:h-14 h-14 flex items-center justify-center border-l border-r border-gray-200 border-t border-b-0 border-solid"
                    >
                        <img src={plusIcon} alt="plus" className="sm:w-4 sm:h-4 w-3 h-3 md:mr-2 sm:mr-1 mr-0.5" />
                        <span className="w-full md-custom:text-base sm:text-sm xs:text-xs text-xs">Course</span>
                    </div>
                ))}
            </div>
        </div>
    );
}