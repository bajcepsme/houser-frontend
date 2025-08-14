'use client';
import React from 'react';

type Props = {
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
};

export default function ContactFields({ email, setEmail, phone, setPhone }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Adres e-mail</label>
        <input
          className="form-input w-full"
          placeholder="np. jan.kowalski@twojmail.pl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Telefon</label>
        <input
          className="form-input w-full"
          placeholder="np. 600 700 800"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
    </div>
  );
}
