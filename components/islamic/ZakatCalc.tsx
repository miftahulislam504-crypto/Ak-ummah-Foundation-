'use client';

import { useState } from 'react';
import { formatTaka, toBn } from '@/lib/utils';

const NISAB_GOLD_GRAM  = 87.48;
const NISAB_SILVER_GRAM = 612.36;
const GOLD_PRICE_PER_GRAM   = 9500;  // approximate BDT
const SILVER_PRICE_PER_GRAM = 120;   // approximate BDT
const ZAKAT_RATE = 0.025;

export default function ZakatCalc() {
  const [cash,       setCash]       = useState('');
  const [gold,       setGold]       = useState('');
  const [silver,     setSilver]     = useState('');
  const [business,   setBusiness]   = useState('');
  const [receivable, setReceivable] = useState('');
  const [debt,       setDebt]       = useState('');
  const [result,     setResult]     = useState<{ zakatAmount: number; totalAssets: number; nisabValue: number; eligible: boolean } | null>(null);

  function calculate() {
    const totalAssets =
      (parseFloat(cash)       || 0) +
      (parseFloat(gold)       || 0) * GOLD_PRICE_PER_GRAM +
      (parseFloat(silver)     || 0) * SILVER_PRICE_PER_GRAM +
      (parseFloat(business)   || 0) +
      (parseFloat(receivable) || 0);

    const totalDebt    = parseFloat(debt) || 0;
    const netAssets    = totalAssets - totalDebt;
    const nisabValue   = NISAB_SILVER_GRAM * SILVER_PRICE_PER_GRAM;
    const eligible     = netAssets >= nisabValue;
    const zakatAmount  = eligible ? netAssets * ZAKAT_RATE : 0;

    setResult({ zakatAmount, totalAssets: netAssets, nisabValue, eligible });
  }

  function reset() {
    setCash(''); setGold(''); setSilver('');
    setBusiness(''); setReceivable(''); setDebt('');
    setResult(null);
  }

  const fields = [
    { label: 'নগদ অর্থ ও ব্যাংক ব্যালেন্স (৳)',  value: cash,       set: setCash,       placeholder: '০' },
    { label: 'স্বর্ণ (গ্রাম)',                      value: gold,       set: setGold,       placeholder: '০ গ্রাম' },
    { label: 'রূপা (গ্রাম)',                         value: silver,     set: setSilver,     placeholder: '০ গ্রাম' },
    { label: 'ব্যবসায়িক পণ্যের মূল্য (৳)',         value: business,   set: setBusiness,   placeholder: '০' },
    { label: 'পাওনা অর্থ (৳)',                      value: receivable, set: setReceivable, placeholder: '০' },
    { label: 'ঋণ / দেনা (৳) — বাদ দেওয়া হবে',    value: debt,       set: setDebt,       placeholder: '০' },
  ];

  return (
    <div className="space-y-4">

      {/* Info */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
        <p className="text-sm font-semibold text-amber-800 mb-1">যাকাতের নিসাব</p>
        <p className="text-xs text-amber-600">রূপার নিসাব: {toBn(NISAB_SILVER_GRAM)} গ্রাম ≈ {formatTaka(NISAB_SILVER_GRAM * SILVER_PRICE_PER_GRAM)}</p>
        <p className="text-xs text-amber-600 mt-0.5">স্বর্ণের নিসাব: {toBn(NISAB_GOLD_GRAM)} গ্রাম ≈ {formatTaka(NISAB_GOLD_GRAM * GOLD_PRICE_PER_GRAM)}</p>
        <p className="text-xs text-amber-500 mt-1">* মূল্য আনুমানিক। সঠিক হিসাবের জন্য বর্তমান বাজার মূল্য ব্যবহার করুন।</p>
      </div>

      {/* Input fields */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-800">আপনার সম্পদের হিসাব</h3>
        {fields.map(({ label, value, set, placeholder }) => (
          <div key={label}>
            <label className="block text-sm text-gray-600 mb-1.5">{label}</label>
            <input
              type="number"
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              min="0"
              className="input-field"
            />
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={reset}     className="btn-outline flex-1 py-3">রিসেট</button>
        <button onClick={calculate} className="btn-primary flex-1 py-3">হিসাব করুন</button>
      </div>

      {/* Result */}
      {result && (
        <div className={`card border-2 ${result.eligible ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
          <h3 className="font-semibold text-gray-800 mb-4">হিসাবের ফলাফল</h3>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">মোট সম্পদ (ঋণ বাদে)</span>
              <span className="text-sm font-semibold">{formatTaka(result.totalAssets)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">নিসাবের পরিমাণ</span>
              <span className="text-sm font-semibold">{formatTaka(result.nisabValue)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">যাকাত প্রযোজ্য?</span>
              <span className={`text-sm font-bold ${result.eligible ? 'text-green-600' : 'text-red-500'}`}>
                {result.eligible ? '✅ হ্যাঁ' : '❌ না'}
              </span>
            </div>
            {result.eligible && (
              <div className="bg-green-100 rounded-xl p-4 text-center mt-2">
                <p className="text-sm text-green-700 mb-1">প্রদেয় যাকাতের পরিমাণ (২.৫%)</p>
                <p className="text-3xl font-bold text-green-800">{formatTaka(Math.ceil(result.zakatAmount))}</p>
              </div>
            )}
            {!result.eligible && (
              <p className="text-sm text-gray-500 text-center pt-2">
                আপনার সম্পদ নিসাবের নিচে, তাই যাকাত ফরজ নয়।
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
