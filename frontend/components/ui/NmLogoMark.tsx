import Image from 'next/image';
import clsx from 'clsx';
import logo from '@/logo.jpg';

type Props = {
  className?: string;
  monoClassName?: string;
  textClassName?: string;
  stacked?: boolean;
};

export default function NmLogoMark({
  className,
  monoClassName,
  stacked = false
}: Props) {
  return (
    <div className={clsx('inline-flex items-center', stacked && 'flex-col gap-4', className)}>
      <div
        className={clsx(
          'relative h-14 w-[4.6rem] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_12px_40px_rgba(0,0,0,0.45)]',
          monoClassName
        )}
      >
        <Image
          src={logo}
          alt="Night Mode logo"
          fill
          sizes="160px"
          unoptimized
          className="object-contain p-1.5"
          priority={false}
        />
      </div>
    </div>
  );
}
