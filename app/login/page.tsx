'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        const res = await fetch('/api/admin-login', {
            method: 'POST',
            body: JSON.stringify({ password }),
            headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
            router.push('/admin');
        } else {
            setError('Invalid password');
        }
    };

    return (
        <div className="max-w-sm mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full p-2 border rounded mb-2"
            />
            {error && <p className="text-red-500">{error}</p>}
            <button onClick={handleLogin} className="w-full bg-black text-white p-2 rounded">
                Login
            </button>
        </div>
    );
}
