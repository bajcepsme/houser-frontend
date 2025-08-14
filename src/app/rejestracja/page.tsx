'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<any>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    const res = await fetch (`${process.env.NEXT_PUBLIC_API_URL}/api/v1/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage('Wystąpiły błędy walidacji.');
      setErrors(data.errors);
    } else {
      setMessage(data.message);
    }
  };

  return (
    <main className="container mx-auto p-4 max-w-md">
      <h1 className="text-3xl font-bold mb-4">Rejestracja</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name">Nazwa użytkownika</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border rounded" />
          {errors.name && <p className="text-red-500 text-sm">{errors.name[0]}</p>}
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-2 border rounded" />
          {errors.email && <p className="text-red-500 text-sm">{errors.email[0]}</p>}
        </div>
        <div>
          <label htmlFor="password">Hasło</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-2 border rounded" />
          {errors.password && <p className="text-red-500 text-sm">{errors.password[0]}</p>}
        </div>
        <div>
          <label htmlFor="passwordConfirmation">Potwierdź hasło</label>
          <input type="password" id="passwordConfirmation" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Zarejestruj</button>
      </form>
      {message && <p className="mt-4 p-2 bg-gray-100 rounded">{message}</p>}
    </main>
  );
}