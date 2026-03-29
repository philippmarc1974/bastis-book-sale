'use client';

import { useState } from 'react';
import type { BookResponse } from '@/lib/db';

export function CartPanel({
  cartBooks,
  onRemove,
  onClear,
  onSend,
  onClose,
  sending,
}: {
  cartBooks: BookResponse[];
  onRemove: (id: number) => void;
  onClear: () => void;
  onSend: (name: string, number: string) => void;
  onClose: () => void;
  sending: boolean;
}) {
  const total = cartBooks.reduce((s, b) => s + b.price, 0);
  const [buyerName, setBuyerName] = useState('');
  const [buyerNumber, setBuyerNumber] = useState('');
  const canSend = cartBooks.length > 0 && buyerName.trim().length > 0 && buyerNumber.trim().length > 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between bg-amber-700 text-white px-4 py-4">
          <span className="font-semibold text-base">Your Cart ({cartBooks.length})</span>
          <button onClick={onClose} className="text-2xl leading-none text-amber-200 hover:text-white transition-colors">×</button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-amber-100">
          {cartBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-sm">Your cart is empty</p>
              <button onClick={onClose} className="mt-3 text-amber-600 text-sm underline">Browse books</button>
            </div>
          ) : (
            cartBooks.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                {b.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.cover_url} alt="" className="w-8 h-12 object-cover rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-tight truncate">{b.title}</p>
                  <p className="text-xs text-gray-500 truncate">{b.author}</p>
                  {b.series && (
                    <p className="text-xs text-amber-600 truncate">
                      {b.series}{b.series_number != null ? ` #${b.series_number}` : ''}
                    </p>
                  )}
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">${(b.price / 100).toFixed(2)}</span>
                <button onClick={() => onRemove(b.id)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0 text-lg leading-none">×</button>
              </div>
            ))
          )}
        </div>
        {cartBooks.length > 0 && (
          <div className="border-t border-amber-200 bg-amber-50 p-4 space-y-3">
            <div className="space-y-2">
              <input type="text" placeholder="Your name" value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                className="w-full text-sm bg-white border border-amber-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
              <input type="tel" placeholder="WhatsApp number (e.g. +65...)" value={buyerNumber} onChange={(e) => setBuyerNumber(e.target.value)}
                className="w-full text-sm bg-white border border-amber-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium text-sm">Total</span>
              <span className="text-xl font-bold text-gray-900">${(total / 100).toFixed(2)} <span className="text-sm text-gray-400">SGD</span></span>
            </div>
            <button onClick={() => onSend(buyerName.trim(), buyerNumber.trim())} disabled={sending || !canSend}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-base">
              {sending ? 'Reserving…' : '💬 Send Order via WhatsApp'}
            </button>
            <button onClick={onClear} className="w-full text-xs text-gray-400 hover:text-gray-600 underline">Clear cart</button>
          </div>
        )}
      </div>
    </>
  );
}
