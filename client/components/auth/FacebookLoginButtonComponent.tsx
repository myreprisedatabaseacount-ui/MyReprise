const FacebookLoginButton = ({ onClick }) => {
    return (
        <button onClick={onClick} className="flex items-center justify-center py-2.5 px-4 border border-[#F0EBE2] rounded-lg hover:bg-[#F8F6F2] transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    fill="#1877F2"
                />
                <path
                    d="M15.893 14.89l.443-2.89h-2.773v-1.876c0-.791.387-1.562 1.63-1.562h1.26v-2.46s-1.144-.195-2.238-.195c-2.285 0-3.777 1.384-3.777 3.89V12h-2.54v2.89h2.54v6.988a10.06 10.06 0 003.124 0v-6.988h2.33z"
                    fill="#ffffff"
                />
            </svg>
            <span className="ml-2 text-sm font-medium text-gray-700">Facebook</span>
        </button>
    );
};

export default FacebookLoginButton;