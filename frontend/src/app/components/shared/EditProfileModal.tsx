import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../../i18n/LanguageContext';
import { resizeProfileImage } from '../../../lib/profile-avatar';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { UserAvatar } from './UserAvatar';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

function FloatingField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-700 px-3 pt-5 pb-2.5 transition-colors ${
      disabled
        ? 'bg-slate-100/80 dark:bg-slate-900/60'
        : 'bg-slate-50 dark:bg-slate-900 focus-within:border-slate-400 dark:focus-within:border-slate-600'
    }`}>
      <label htmlFor={id} className="block text-slate-500 dark:text-slate-400 mb-1" style={{ fontSize: '11px' }}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        className={`w-full bg-transparent outline-none placeholder-slate-400 ${
          disabled
            ? 'text-slate-500 dark:text-slate-400 cursor-not-allowed'
            : 'text-slate-900 dark:text-slate-100'
        }`}
        style={{ fontSize: '15px' }}
      />
    </div>
  );
}

export function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const { currentUser, role, updateProfile } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const displayName = nome.trim() || currentUser?.nome || t('common.user');

  useEffect(() => {
    if (!open) return;
    setNome(currentUser?.nome || '');
    setAvatarPreview(currentUser?.avatar_url ?? null);
  }, [open, currentUser?.nome, currentUser?.avatar_url]);

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const dataUrl = await resizeProfileImage(file);
      setAvatarPreview(dataUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('profile.photoError'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    const trimmedNome = nome.trim();

    if (!trimmedNome) {
      toast.error(t('profile.nameRequired'));
      return;
    }

    const avatarChanged = avatarPreview !== (currentUser?.avatar_url ?? null);

    setSaving(true);
    try {
      await updateProfile({
        nome: trimmedNome,
        email: currentUser?.email || '',
        ...(avatarChanged ? { avatar_url: avatarPreview } : {}),
      });
      toast.success(t('profile.updated'));
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="sm:max-w-md rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-0 gap-0 overflow-hidden [&>button]:hidden">
        <div className="px-6 pt-6 pb-2">
          <DialogTitle className="text-slate-900 dark:text-slate-100 text-left" style={{ fontSize: '16px', fontWeight: 600 }}>
            {t('profile.editTitle')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('profile.editDescription')}
          </DialogDescription>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div className="flex justify-center pt-2">
            <div className="relative">
              <UserAvatar
                name={displayName}
                avatarUrl={avatarPreview}
                fallback={role.slice(0, 2).toUpperCase()}
                size="lg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving || uploadingPhoto}
                className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-100 border-2 border-white dark:border-slate-950 flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-60"
                title={t('profile.changePhoto')}
                aria-label={t('profile.changePhotoAria')}
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-3.5 h-3.5 text-white dark:text-slate-900 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-white dark:text-slate-900" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handlePhotoChange(event)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <FloatingField id="profile-display-name" label={t('profile.displayName')} value={nome} onChange={setNome} />
            <FloatingField
              id="profile-email"
              label={t('profile.userEmail')}
              value={currentUser?.email || ''}
              type="email"
              disabled
            />
          </div>

          <p className="text-center text-slate-500 dark:text-slate-400 px-2" style={{ fontSize: '12px', lineHeight: 1.5 }}>
            {t('profile.helpText')}
          </p>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors disabled:opacity-60"
              style={{ fontSize: '14px', fontWeight: 500 }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || uploadingPhoto}
              className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 shadow-sm transition-colors disabled:opacity-60 flex items-center gap-2"
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('common.save')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
