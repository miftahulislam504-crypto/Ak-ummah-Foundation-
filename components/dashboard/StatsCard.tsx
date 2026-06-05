import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  color: 'green' | 'blue' | 'gold';
}

const colorMap = {
  green: 'bg-primary-50 text-primary-700 border-primary-100',
  blue:  'bg-blue-50  text-blue-700  border-blue-100',
  gold:  'bg-amber-50 text-amber-700 border-amber-100',
};

const valueColorMap = {
  green: 'text-primary-800',
  blue:  'text-blue-800',
  gold:  'text-amber-800',
};

export default function StatsCard({ label, value, color }: Props) {
  return (
    <div className={cn('rounded-2xl border p-3 flex flex-col items-center gap-1', colorMap[color])}>
      <span className={cn('text-xl font-bold', valueColorMap[color])}>{value}</span>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
    </div>
  );
}
