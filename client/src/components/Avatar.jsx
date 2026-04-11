const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-16 h-16 text-2xl',
    '2xl': 'w-28 h-28 text-4xl',
  };

  const sizeClass = sizes[size] || sizes.md;
  const name = user?.name || user?.userId?.name || '';
  const picture = user?.profilePicture || user?.userId?.profilePicture || '';

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center ${className}`}>
      {picture ? (
        <img src={picture} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-bold">{name?.charAt(0)?.toUpperCase() || '?'}</span>
      )}
    </div>
  );
};

export default Avatar;
