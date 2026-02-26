import React from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#102E50] to-[#1a3f6a] flex items-center justify-center p-4">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#E78B48]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E78B48]/5 rounded-full blur-3xl"></div>
            
            {/* Main card */}
            <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20">
                

                {/* Lock Icon or decorative element */}
                <div className="flex justify-center mb-4">
                    <div className="bg-[#E78B48]/10 p-3 rounded-full">
                        <svg className="w-8 h-8 text-[#E78B48]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                    </div>
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-bold text-center text-[#102E50] mb-2">
                    Forgot Password?
                </h2>

                {/* Message Card */}
                <div className="bg-[#102E50]/5 rounded-xl p-6 mb-6 border border-[#E78B48]/20">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-[#E78B48]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div>
                            <p className="text-[#102E50] font-medium mb-2">
                                Please contact your administrator
                            </p>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                For security reasons, password resets can only be processed by your system administrator. They will provide you with a temporary password to access your account.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Admin Contact Info */}
                <div className="bg-[#E78B48]/10 rounded-lg p-4 mb-6">
                    <h3 className="text-[#102E50] font-semibold mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-[#E78B48]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        Admin Contact:
                    </h3>
                    <p className="text-gray-700 text-sm mb-1">
                        <span className="font-medium">Email:</span> lawrence_admin@gmail.com
                    </p>
                    <p className="text-gray-700 text-sm">
                        <span className="font-medium">Office:</span> +1 (555) 123-4567
                    </p>
                </div>

                {/* Important Note */}
                <div className="text-xs text-gray-500 text-center mb-6">
                    <span className="bg-[#102E50]/5 px-3 py-1 rounded-full">
                        You are required to change your password after logging in the temporary password
                    </span>
                </div>

                {/* Return to Login Button */}
                <Link 
                    to="/login" 
                    className="block w-full bg-[#102E50] hover:bg-[#0a1f33] text-white font-semibold py-3 px-4 rounded-lg text-center transition duration-300 ease-in-out transform hover:scale-[1.02] shadow-lg"
                >
                    Return to Login
                </Link>

            </div>
        </div>
    );
};

