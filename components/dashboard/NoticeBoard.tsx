import { Notice } from '@/lib/types';
import { getRelativeTime } from '@/lib/utils';
import { Bell } from 'lucide-react';
import Link from 'next/link';

interface Props { notices: Notice[]; }

export default function NoticeBoard({ notices }: Props) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
            <Bell size={14} className="text-amber-600" />
          </div>
          <h3 className="font-semibold text-gray-800">নোটিশ বোর্ড</h3>
        </div>
        <Link href="/notices" className="text-xs text-primary-600 hover:underline">সব দেখুন</Link>
      </div>

      <div className="space-y-3">
        {notices.map((notice) => (
          <div key={notice.id} className="flex gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 line-clamp-1">{notice.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notice.content}</p>
              <p className="text-xs text-gray-400 mt-1">{getRelativeTime(notice.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
