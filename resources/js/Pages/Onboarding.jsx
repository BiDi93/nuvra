import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Onboarding = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Grab data from URL
    const token = searchParams.get('token');
    const userId = searchParams.get('user_id');

    // Form State
    const [teams, setTeams] = useState([]);
    const [formData, setFormData] = useState({
        coach_id: '',
        position: 'Forward',
        age: '',
        address: '',
        phone: ''
    });

    // Fetch Teams on Load
    useEffect(() => {
        if (!token) {
            alert("No token found! Please login again.");
            navigate('/login');
            return;
        }

        // Save token to LocalStorage so we stay logged in
        localStorage.setItem('auth_token', token);

        // Get the list of coaches/teams
        axios.get('/api/teams')
            .then(res => setTeams(res.data))
            .catch(err => console.error("Failed to load teams", err));
    }, [token, navigate]);

    // 4. Handle Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await axios.post('/api/player/onboarding', {
                user_id: userId,
                coach_id: formData.coach_id,
                position: formData.position,
                details: { // Passing extra details
                    age: formData.age,
                    address: formData.address,
                    phone: formData.phone
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Application Submitted! Waiting for Coach Approval.");
            navigate('/waiting-room'); // Or wherever you want them to go
        } catch (error) {
            console.error(error);
            alert("Submission failed. You might already have a pending application.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
            <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Select Team */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Team</label>
                        <select 
                            className="w-full bg-gray-700 rounded p-2 text-white"
                            onChange={(e) => setFormData({...formData, coach_id: e.target.value})}
                            required
                        >
                            <option value="">-- Choose a Team --</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>
                                    {team.team_name} (Coach {team.name})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Position */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Position</label>
                        <select 
                            className="w-full bg-gray-700 rounded p-2 text-white"
                            onChange={(e) => setFormData({...formData, position: e.target.value})}
                        >
                            <option>Forward</option>
                            <option>Midfielder</option>
                            <option>Defender</option>
                            <option>Goalkeeper</option>
                        </select>
                    </div>

                    {/* Extra Details */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Age</label>
                        <input 
                            type="number" 
                            className="w-full bg-gray-700 rounded p-2"
                            onChange={(e) => setFormData({...formData, age: e.target.value})}
                        />
                    </div>
                    
                     <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-700 rounded p-2"
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                        />
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold mt-4">
                        Submit Application
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Onboarding;