import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);

    // Login State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Sign Up State
    const [teams, setTeams] = useState([]);
    // New State for the Image File
    const [photo, setPhoto] = useState(null);
    const [formData, setFormData] = useState({
        name: '', age: '', address: '', position: 'Forward',
        email: '', password: '', coach_id: ''
    });

    useEffect(() => {
        if (!isLogin) {
            fetch('/api/teams').then(res => res.json()).then(data => setTeams(data));
        }
    }, [isLogin]);

    const handleLogin = (e) => {
        e.preventDefault();
        setError("");
        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
            .then(async res => {
                if (!res.ok) throw new Error("Invalid credentials");
                return res.json();
            })
            .then(data => {
                localStorage.setItem("currentUser", data.player_id);
                navigate("/dashboard");
            })
            .catch(err => setError(err.message));
    };

    const handleSignUp = (e) => {
        e.preventDefault();

        // Create FormData object (Required for sending files)
        const data = new FormData();
        data.append('name', formData.name);
        data.append('age', formData.age);
        data.append('address', formData.address);
        data.append('position', formData.position);
        data.append('coach_id', formData.coach_id);
        data.append('email', formData.email);
        data.append('password', formData.password);

        // Only append if user selected a file
        if (photo) {
            data.append('profile_image', photo);
        }

        fetch('/api/register', {
            method: 'POST',
            body: data // <--- Browser automatically sets headers for file upload
        })
            .then(async res => {
                if (!res.ok) throw new Error("Registration failed");
                return res.json();
            })
            .then(data => {
                alert(data.message);
                setIsLogin(true);
            })
            .catch(err => alert(err.message));
    };

    // Shared Styles
    const inputStyle = "w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-black/40 transition-all font-medium";
    const labelStyle = "text-xs font-bold text-gray-300 uppercase pl-1 block mb-1";
    const buttonStyle = "w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-lg rounded-xl shadow-lg shadow-purple-900/30 transform transition hover:-translate-y-1 mt-4";

    return (
        <div className="relative min-h-screen w-full font-sans overflow-x-hidden overflow-y-auto flex items-center justify-center py-10 bg-gray-900">
            <div className="fixed inset-0 z-0">
                <img src="/images/landingPage/image_landing_page.jpeg" alt="Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/80 to-purple-900/50 backdrop-blur-[2px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md px-4 animate-fade-in-up my-auto">
                <div className="text-center mb-8 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-4 mb-4">
                        <img src="/images/logoImage/NUVRA_LOGO.png" alt="NUVRA" className="h-24 w-24 object-cover object-left" />
                        <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 tracking-tighter drop-shadow-2xl">
                            NUVRA
                        </span>
                    </div>
                    <p className="text-gray-300 font-medium tracking-widest text-sm uppercase">{isLogin ? "Player Intelligence System" : "Join the Elite Squad"}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
                    <div className="flex bg-black/20 p-1 rounded-xl mb-8">
                        <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${isLogin ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}>Login</button>
                        <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${!isLogin ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}>Sign Up</button>
                    </div>

                    {isLogin ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div><label className={labelStyle}>Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputStyle} placeholder="player@nuvra.com" required /></div>
                            <div><label className={labelStyle}>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputStyle} placeholder="••••••••" required /></div>
                            {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2"><span className="text-red-200 text-sm font-bold">⚠ {error}</span></div>}
                            <button className={buttonStyle}>ENTER ARENA</button>
                        </form>
                    ) : (
                        <form onSubmit={handleSignUp} className="space-y-4">


                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2"><label className={labelStyle}>Full Name</label><input className={inputStyle} placeholder="Neymar Jr" required onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div><label className={labelStyle}>Age</label><input className={inputStyle} placeholder="15" type="number" required onChange={e => setFormData({ ...formData, age: e.target.value })} /></div>
                            </div>
                            <div><label className={labelStyle}>Current Address</label><input className={inputStyle} placeholder="City, Country" required onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className={labelStyle}>Select Team</label><select className={`${inputStyle} appearance-none cursor-pointer`} required onChange={e => setFormData({ ...formData, coach_id: e.target.value })}><option value="" className="text-gray-900">Choose...</option>{teams.map(t => <option key={t.id} value={t.id} className="text-gray-900">{t.team_name}</option>)}</select></div>
                                <div><label className={labelStyle}>Position</label><select className={`${inputStyle} appearance-none cursor-pointer`} onChange={e => setFormData({ ...formData, position: e.target.value })}><option className="text-gray-900">Forward</option><option className="text-gray-900">Midfielder</option><option className="text-gray-900">Defender</option><option className="text-gray-900">Goalkeeper</option></select></div>
                            </div>
                            {/* NEW: Profile Photo Input */}
                            <div>
                                <label className={labelStyle}>Profile Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setPhoto(e.target.files[0])}
                                    className="w-full px-5 py-3 bg-black/20 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:text-black cursor-pointer"
                                />
                            </div>
                            <div><label className={labelStyle}>Email</label><input className={inputStyle} type="email" placeholder="you@email.com" required onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                            <div><label className={labelStyle}>Create Password</label><input className={inputStyle} type="password" placeholder="••••••••" required onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
                            <button className={buttonStyle}>SUBMIT APPLICATION</button>
                        </form>
                    )}
                </div>
                <div className="mt-8 text-center"><button onClick={() => navigate("/coach")} className="text-white/50 text-sm font-bold hover:text-white transition-colors">Coach Login Portal →</button></div>
            </div>
        </div>
    );
}