import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      maxWidth="max-w-sm"
      footer={
        <>
          <Button onClick={onCancel}>{cancelLabel}</Button>
          {variant === 'danger' ? (
            <Button
              className="!bg-status-red-bg !text-status-red hover:!bg-status-red/20"
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          ) : (
            <Button variant="primary" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          )}
        </>
      }
    >
      <p className="text-[13px] text-text-secondary leading-relaxed">{message}</p>
    </Modal>
  );
}
