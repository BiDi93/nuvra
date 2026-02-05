import React, { useState, useEffect } from 'react';
import { useOutletContext,useSearchParams, useNavigate } from 'react-router-dom';


export default function PlayerPayment() {
    const { profile } = useOutletContext();
    const [history, setHistory] = useState([]);
    
    // --- NEW: MODAL STATE ---
    const [showModal, setShowModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // INITIALIZE HOOKS
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const currentYear = new Date().getFullYear();
    const months = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    useEffect(() => {
        const billId = searchParams.get('billplz[id]');
        const isPaid = searchParams.get('billplz[paid]');

        if (billId) {
            // Optional: Clean URL so it doesn't look messy
            // navigate('/dashboard/payment', { replace: true });

            if (isPaid === 'true') {
                setIsProcessing(true);
                
                // Verify with Backend
                fetch('/api/payment/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    },
                    body: JSON.stringify({ bill_id: billId })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'paid') {
                        alert("🎉 Payment Successful! Database updated.");
                        fetchHistory(); // Refresh the grid
                    } else {
                        alert("⚠️ Payment verification failed. Please contact support.");
                    }
                })
                .catch(err => console.error("Verification Error:", err))
                .finally(() => setIsProcessing(false));
            } else {
                alert("Payment was cancelled or failed.");
            }
        }
    }, [searchParams]);

    useEffect(() => {
        if (profile?.id) fetchHistory();
    }, [profile]);

    const fetchHistory = () => {
        fetch(`/api/player/${profile.id}/payments`)
            .then(res => res.json())
            .then(data => setHistory(data));
    };

    // 1. OPEN THE MODAL (Don't pay yet)
    const initiatePayment = (month) => {
        setSelectedMonth(month);
        setShowModal(true);
    };

    // 2. ACTUAL PAYMENT LOGIC (Triggered by Modal)
    const confirmPayment = () => {
        setIsProcessing(true);

        // 1. Call your new Laravel Route to get the Bill URL
        fetch('/api/payment/create-bill', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}` // Ensure token is sent!
            },
            body: JSON.stringify({
                month: `${selectedMonth} ${currentYear}`, // Sending "February 2026"
                amount: 50.00
            })
        })
        .then(async res => {
            const data = await res.json();
            
            if (res.ok && data.url) {
                // 2. SUCCESS: Redirect to Billplz to pay
                window.location.href = data.url; 
            } else {
                // 3. FAIL: Show error
                setIsProcessing(false);
                alert(`Error: ${data.message || 'Could not create bill'}`);
            }
        })
        .catch(err => {
            setIsProcessing(false);
            console.error(err);
            alert("System Error. Check console for details.");
        });
    };

    const isPaid = (month) => {
        const key = `${month} ${currentYear}`;
        return history.find(h => h.month_year === key && h.status === 'completed');
    };

    return (
        <div className="max-w-5xl mx-auto p-8 relative">
            <h1 className="text-3xl font-black text-gray-900 mb-2">My Fees</h1>
            <p className="text-gray-400 font-medium mb-8">Monthly subscription status for {currentYear}.</p>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {months.map((month, index) => {
                    const paymentRecord = isPaid(month);
                    
                    // Logic to disable future months
                    const isFuture = new Date().getMonth() < index;

                    return (
                        <div key={month} className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${paymentRecord ? 'bg-white border-green-200 shadow-sm' : 'bg-white border-gray-100 shadow-sm hover:border-purple-200'}`}>
                            
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{month}</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{currentYear}</p>
                                </div>
                                {paymentRecord ? (
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">PAID</span>
                                ) : (
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">DUE</span>
                                )}
                            </div>

                            <div className="mb-6">
                                <span className="text-2xl font-black text-gray-900">RM 50.00</span>
                            </div>

                            {paymentRecord ? (
                                <div className="text-xs text-green-600 font-bold flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Paid on {new Date(paymentRecord.created_at).toLocaleDateString()}
                                </div>
                            ) : (
                                <button 
                                    onClick={() => initiatePayment(month)} // <--- Opens Modal
                                    disabled={isFuture}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-transform active:scale-95 ${
                                        isFuture 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : 'bg-black text-white hover:bg-gray-800 shadow-lg'
                                    }`}
                                >
                                    {isFuture ? "Upcoming" : "Pay Now 💳"}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* --- CUSTOM CONFIRMATION MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop Blur */}
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowModal(false)}
                    ></div>

                    {/* Modal Card */}
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in duration-200">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            </div>
                            
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Confirm Payment</h3>
                            <p className="text-gray-500 mb-6">
                                You are about to pay <span className="font-bold text-gray-900">RM 50.00</span> for <span className="font-bold text-purple-600">{selectedMonth} {currentYear}</span>.
                            </p>

                            {/* Payment Summary Box */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left border border-gray-100">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-bold">RM 50.00</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500">Service Fee</span>
                                    <span className="font-bold text-green-600">RM 0.00</span>
                                </div>
                                <div className="border-t border-gray-200 my-2"></div>
                                <div className="flex justify-between text-lg font-black">
                                    <span>Total</span>
                                    <span>RM 50.00</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmPayment}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>Processing...</>
                                    ) : (
                                        <>Confirm & Pay</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}