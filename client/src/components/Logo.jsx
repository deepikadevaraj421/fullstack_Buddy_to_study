const Logo = ({ size = 'md' }) => {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-md">
        <span className="text-white font-bold text-xl">B</span>
      </div>
      <span className={`font-bold text-gray-800 ${sizes[size]}`}>
        Buddy_to_study
      </span>
    </div>
  );
};

export default Logo;
