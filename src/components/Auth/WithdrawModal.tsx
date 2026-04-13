import React from 'react';
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function WithdrawModal({
  open,
  onClose,
  onConfirm,
}: WithdrawModalProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="
            fixed top-1/2 left-1/2 z-50
            w-[22rem] -translate-x-1/2 -translate-y-1/2
            rounded-[1.75rem] border-2 border-foreground/20
            bg-background px-7 py-6 shadow-lg
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
            duration-200
          "
        >
          {/* 닫기 X */}
          <DialogPrimitive.Close
            onClick={onClose}
            className="absolute top-4 right-4 text-foreground/50 hover:text-foreground transition-colors"
            aria-label="닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </DialogPrimitive.Close>

          {/* 본문 */}
          <DialogPrimitive.Description className="text-foreground text-[0.95rem] leading-relaxed pr-4">
            정말로 가입을 탈퇴하실 건가요? 이메일 정보와
            <br />
            모든 가입자의 정보가 사라집니다.
          </DialogPrimitive.Description>

          {/* N / Y 버튼 */}
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="
                w-9 h-9 rounded-lg
                bg-blue-100 text-blue-700 border border-blue-200
                text-sm font-semibold
                hover:bg-blue-200 transition-colors
                disabled:opacity-50
              "
            >
              N
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="
                w-9 h-9 rounded-lg
                bg-rose-100 text-rose-600 border border-rose-200
                text-sm font-semibold
                hover:bg-rose-200 transition-colors
                disabled:opacity-50
              "
            >
              {loading ? '…' : 'Y'}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
