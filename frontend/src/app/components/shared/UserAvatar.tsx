import { getInitials } from '../../../lib/profile-avatar';

type UserAvatarSize = 'xs' | 'sm' | 'lg';

const SIZE_CLASSES: Record<UserAvatarSize, { container: string; text: string }> = {
  xs: { container: 'h-8 w-8', text: '11px' },
  sm: { container: 'h-9 w-9', text: '12px' },
  lg: { container: 'w-24 h-24', text: '28px' },
};

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  fallback?: string;
  size?: UserAvatarSize;
  className?: string;
}

export function UserAvatar({
  name,
  avatarUrl,
  fallback = 'U',
  size = 'sm',
  className = '',
}: UserAvatarProps) {
  const initials = getInitials(name, fallback);
  const sizeClass = SIZE_CLASSES[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClass.container} rounded-full object-cover flex-shrink-0 bg-slate-200 dark:bg-slate-800 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass.container} rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 flex-shrink-0 ${className}`}
      style={{ fontSize: sizeClass.text, fontWeight: 700 }}
    >
      {initials}
    </div>
  );
}
