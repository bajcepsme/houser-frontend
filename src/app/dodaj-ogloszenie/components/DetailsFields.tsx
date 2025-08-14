'use client';
import React from 'react';

type Props = {
  market: '' | 'primary' | 'secondary';
  setMarket: (v: any) => void;
  rooms: number | '';
  setRooms: (v: any) => void;
  floor: string;
  setFloor: (v: any) => void;
  buildYear: number | '';
  setBuildYear: (v: any) => void;
  condition: string;
  setCondition: (v: any) => void;
};

export default function DetailsFields({
  market, setMarket, rooms, setRooms, floor, setFloor, buildYear, setBuildYear, condition, setCondition,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Rynek</label>
        <select
          className="form-input w-full"
          value={market || ''}
          onChange={(e) => setMarket((e.target.value || '') as any)}
        >
          <option value="">—</option>
          <option value="primary">pierwotny</option>
          <option value="secondary">wtórny</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Liczba pokoi</label>
        <input
          type="number"
          className="form-input w-full"
          min={0}
          value={rooms}
          onChange={(e) => setRooms(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="np. 2"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Piętro</label>
        <input
          className="form-input w-full"
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          placeholder="np. 3/5, parter"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Rok budowy</label>
        <input
          type="number"
          className="form-input w-full"
          value={buildYear}
          onChange={(e) => setBuildYear(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="np. 2012"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm text-gray-600 mb-1">Stan wykończenia</label>
        <select
          className="form-input w-full"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          <option value="">—</option>
          <option value="do_wykonczenia">do wykończenia</option>
          <option value="do_remontu">do remontu</option>
          <option value="dobry">dobry</option>
          <option value="bardzo_dobry">bardzo dobry</option>
          <option value="wysoki_standard">wysoki standard</option>
        </select>
      </div>
    </div>
  );
}
