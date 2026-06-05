'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { formatTaka, toBn } from '@/lib/utils';

function PaymentResultContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const status  = params.get('status')  || 'error';
  const amount  = parseFloat(params.get('amount') || '0');
  const tranId  = params.get('tran_id') || '';
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      setConfetti(true);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  }, [status]);

  const states = {
    success: {
      icon:    <CheckCircle size={64} className="text-green-500" />,
      bg:      'from-green-50 to-white',
      title:   'আলহামদুলিল্লাহ!',
      arabic:  'جَزَاكَ اللَّهُ خَيْرًا',
      sub:     'আপনার দান সফলভাবে গ্রহণ হয়েছে।',
      btnText: 'ড্যাশবোর্ডে যান',
      btnCls:  'btn-primary',
    },
    fail: {
      icon:    <XCircle size={64} className="text-red-500" />,
      bg:      'from-red-50 to-white',
      title:   'পেমেন্ট ব্যর্থ হয়েছে',
      arabic:  'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
      sub:     'পেমেন্ট সম্পন্ন হয়নি। আবার চেষ্টা করুন।',
      btnText: 'আবার চেষ্টা করুন',
      btnCls:  'btn-outline',
    },
    cancel: {
      icon:    <AlertCircle size={64} className="text-amber-500" />,
      bg:      'from-amber-50 to-white',
      title:   'পেমেন্ট বাতিল হয়েছে',
      arabic:  'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
      sub:     'আপনি পেমেন্ট বাতিল করেছেন।',
      btnText: 'ফিরে যান',
      btnCls:  'btn-outline',
    },
    error: {
      icon:    <AlertCircle size={64} className="text-gray-400" />,
      bg:      'from-gray-50 to-white',
      title:   'কিছু একটা হয়েছে',
      arabic:  'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
      sub:     'একটি সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।',
      btnText: 'হোমে যান',
      btnCls:  'btn-outline',
    },
  };

  const s = states[status as keyof typeof states] || states.error;

  function handleBtn() {
    if (status === 'success') router.replace('/dashboard');
    else                      router.replace('/donations/new');
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${s.bg} flex flex-col items-center justify-center p-6`}>

      {/* Confetti dots for success */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left:            `${Math.random() * 100}%`,
                top:             `${Math.random() * 100}%`,
                backgroundColor: ['#22c55e','#f59e0b','#3b82f6','#ec4899'][i % 4],
                animationDelay:  `${Math.random() * 1}s`,
                animationDuration:`${0.5 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-sm text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-28 h-28 bg-white rounded-full shadow-lg flex items-center justify-center">
            {s.icon}
          </div>
        </div>

        {/* Text */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{s.title}</h1>
          <p className="font-arabic text-xl text-primary-700 mb-3">{s.arabic}</p>
          <p className="text-gray-500 text-sm">{s.sub}</p>
        </div>

        {/* Amount + Transaction */}
        {status === 'success' && amount > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">পরিমাণ</span>
              <span className="font-bold text-green-700">{formatTaka(amount)}</span>
            </div>
            {tranId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ট্রানজেকশন</span>
                <span className="font-mono text-gray-700 text-xs">{tranId}</span>
              </div>
            )}
          </div>
        )}

        {/* Button */}
        <button onClick={handleBtn} className={`${s.btnCls} w-full`}>
          {s.btnText}
        </button>

        {status !== 'success' && (
          <button onClick={() => router.replace('/donations')} className="text-sm text-gray-400 hover:underline flex items-center justify-center gap-1 mx-auto">
            <RefreshCw size={14} /> দানের ইতিহাস দেখুন
          </button>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <PaymentResultContent />
    </Suspense>
  );
}
