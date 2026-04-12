import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>가입 탈퇴</DialogTitle>
          <DialogDescription>
            정말로 가입을 탈퇴하실 건가요?
            <br />
            이메일 정보와 모든 가입자의 정보가 사라집니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? '처리 중...' : '탈퇴'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
