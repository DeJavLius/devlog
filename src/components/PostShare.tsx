import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  title: string;
  url: string;
}

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.213 5.567 5.95-5.567zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export default function PostShare({ title, url }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs">공유</span>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        aria-label="링크 복사"
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-green-500" />
            <span className="text-xs text-green-500">복사됨</span>
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            <span className="text-xs">링크</span>
          </>
        )}
      </button>
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        aria-label="X에 공유"
      >
        <XIcon />
      </a>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        aria-label="Facebook에 공유"
      >
        <FacebookIcon />
      </a>
    </div>
  );
}
