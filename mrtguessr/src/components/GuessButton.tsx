import { guessButtonPartsUrl } from '@/lib/api';

interface GuessButtonProps {
  onClick: () => void;
  className?: string;
}

const GuessButton = ({ onClick, className = '' }: GuessButtonProps) => (
  <button
    onClick={onClick}
    className={`flex h-[60px] border-0 bg-transparent cursor-pointer p-0 w-full ${className}`}
  >
    <img src={guessButtonPartsUrl.LCorner} alt="" className="h-full w-auto flex-shrink-0" />
    <div
      className="flex-1 relative h-full min-w-0"
      style={{
        backgroundImage: `url(${guessButtonPartsUrl.Width})`,
        backgroundRepeat: 'repeat-x',
        backgroundSize: 'auto 100%',
        backgroundPosition: 'left center',
      }}
    >
      <img
        src={guessButtonPartsUrl.Text}
        alt="GUESS"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[60%] w-auto"
      />
    </div>
    <img src={guessButtonPartsUrl.RCorner} alt="" className="h-full w-auto flex-shrink-0" />
  </button>
);

export default GuessButton;