import { Donation, Loan } from '@/lib/types';
import { getRelativeTime, formatTaka } from '@/lib/utils';
import { Heart, CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Props {
  donations: Donation[];
  loans:     Loan[];
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'অপেক্ষারত', cls: 'badge-pending'  },
  confirmed: { label: 'নিশ্চিত',   cls: 'badge-active'   },
  approved:  { label: 'অনুমোদিত',  cls: 'badge-active'   },
  rejected:  { label: 'বাতিল',     cls: 'badge-rejected' },
  repaid:    { label: 'পরিশোধিত',  cls: 'badge-active'   },
};

export default function RecentActivity({ donations, loans }: Props) {
  const hasData = donations.length > 0 || loans.length > 0;

  if (!hasData) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-400 text-sm">এখনো কোনো কার্যক্রম নেই</p>
        <p className="text-gray-300 text-xs mt-1">দান বা ঋণ আবেদন করুন</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-4">সাম্প্রতিক কার্যক্রম</h3>

      <div className="space-y-3">

        {/* Recent donations */}
        {donations.slice(0, 3).map((d) => (
          <div key={d.id} className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <Heart size={16} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{d.type}</p>
              <p className="text-xs text-gray-400">{getRelativeTime(d.createdAt)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-gray-800">{formatTaka(d.amount)}</p>
              <span className={cn('text-xs', statusLabel[d.status]?.cls)}>
                {statusLabel[d.status]?.label}
              </span>
            </div>
          </div>
        ))}

        {/* Recent loans */}
        {loans.slice(0, 2).map((l) => (
          <div key={l.id} className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={16} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">ঋণ আবেদন — {l.purpose}</p>
              <p className="text-xs text-gray-400">{getRelativeTime(l.createdAt)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-gray-800">{formatTaka(l.amount)}</p>
              <span className={cn('text-xs', statusLabel[l.status]?.cls)}>
                {statusLabel[l.status]?.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* View all */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <Link href="/donations" className="flex-1 flex items-center justify-center gap-1 text-xs text-primary-600 hover:underline">
          সব দান <ArrowRight size={12} />
        </Link>
        <div className="w-px bg-gray-100" />
        <Link href="/loans" className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:underline">
          সব ঋণ <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
