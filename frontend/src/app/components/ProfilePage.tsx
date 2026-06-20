import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { EditProfileModal } from './shared/EditProfileModal';

export function ProfilePage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      navigate('/', { replace: true });
    }
  }, [open, navigate]);

  return <EditProfileModal open={open} onClose={() => setOpen(false)} />;
}
