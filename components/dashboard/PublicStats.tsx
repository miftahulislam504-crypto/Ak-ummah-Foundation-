import { toBn, formatTaka } from '@/lib/utils';

interface Props {
  stats: { totalDonation: number; totalMembers: number; totalLoans: number };
  loading: boolean;
}

export default function PublicStats({ stats, loading }: Props) {
  const items = [
    { label: 'মোট সদস্য',   value: toBn(stats.totalMembers),             color: 'text-primary-700' },
    { label: 'ঋণ আবেদন',    value: toBn(stats.totalLoans),               color: 'text-blue-700'    },
    { label: 'মোট দান',     value: formatTaka(stats.totalDonation),      color: 'text-amber-700'   },
  ];

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-500 mb-4">ফাউন্ডেশনের সামগ্রিক তথ্য</h3>
      <div className="grid grid-cols-3 gap-3">
        {items.map(({ label, value, color }) => (
          <div key={label} className="text-center">
            {loading ? (
              <div className="h-7 bg-gray-100 rounded-lg animate-pulse mb-1" />
            ) : (
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
