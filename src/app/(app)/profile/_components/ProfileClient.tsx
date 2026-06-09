'use client';

import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile, Application } from '@/types';
import type { User as FirebaseUser } from 'firebase/auth';

import { useState, useRef, useMemo } from 'react';
import { useUser } from '@/firebase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { VvButton } from '@/components/vv/VvButton';
import { VvPageHeader } from '@/components/vv/VvPageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Camera, RotateCcw, RotateCw, ZoomIn, ZoomOut, Save, Edit,
  User as UserIcon, Globe, Mail, Calendar, Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfileAction, uploadProfilePictureAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


/* ──────────────────────────────────────────────────────────────────────────
   Google icon SVG (inline)
   ────────────────────────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8a12 12 0 0 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C33.6 6.1 29 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5 0 9.5-1.9 12.9-5l-6-5.1A12 12 0 0 1 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.9l6 5.1C40.9 35.9 44 30.4 44 24c0-1.3-.1-2.4-.4-3.5z"/>
  </svg>
);


/* ──────────────────────────────────────────────────────────────────────────
   PROFILE CLIENT
   ────────────────────────────────────────────────────────────────────────── */
export function ProfileClient({ claims, applications }: {
  user: FirebaseUser | null;
  claims: UserProfile | null;
  applications: Application[];
}) {
  const { user, loading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  /* ── Editing state ───────────────────────────────────────────────────── */
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    displayName: claims?.displayName || '',
    birthDate: claims?.birthDate || '',
    country: claims?.country || '',
  });

  /* ── Photo crop state ────────────────────────────────────────────────── */
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState(user?.photoURL);

  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Date selection ──────────────────────────────────────────────────── */
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = Array.from({ length: 2010 - 1940 + 1 }, (_, i) => 2010 - i);

  const [selectedDay, setSelectedDay] = useState<string>(
    formData.birthDate ? new Date(formData.birthDate).getDate().toString() : ''
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    formData.birthDate ? months[new Date(formData.birthDate).getMonth()] : ''
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    formData.birthDate ? new Date(formData.birthDate).getFullYear().toString() : ''
  );

  const updateBirthDate = (day: string, month: string, year: string) => {
    if (day && month && year) {
      const monthIndex = months.indexOf(month);
      const date = new Date(Date.UTC(parseInt(year), monthIndex, parseInt(day)));
      setFormData(prev => ({ ...prev, birthDate: date.toISOString().split('T')[0] }));
    }
  };

  const handleDayChange = (val: string) => { setSelectedDay(val); updateBirthDate(val, selectedMonth, selectedYear); };
  const handleMonthChange = (val: string) => { setSelectedMonth(val); updateBirthDate(selectedDay, val, selectedYear); };
  const handleYearChange = (val: string) => { setSelectedYear(val); updateBirthDate(selectedDay, selectedMonth, val); };

  const formattedBirthDate = useMemo(() => {
    if (!formData.birthDate) return 'Not set';
    try {
      const [year, month, day] = formData.birthDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  }, [formData.birthDate]);

  /* ── Photo handlers ──────────────────────────────────────────────────── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setIsCropModalOpen(true);
    }
  };

  const handleSaveCrop = async () => {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) return;

    setIsUploading(true);

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const offscreen = new OffscreenCanvas(
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );
    const ctx = offscreen.getContext('2d');
    if (!ctx) { setIsUploading(false); return; }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      offscreen.width,
      offscreen.height
    );

    const blob = await offscreen.convertToBlob({ type: 'image/png' });
    const fd = new FormData();
    fd.append('file', blob, 'profile-picture.png');

    if (!user) { setIsUploading(false); return; }

    try {
      const idToken = await user.getIdToken();
      const { photoURL: newPhotoURL } = await uploadProfilePictureAction(fd, idToken);
      setPhotoURL(newPhotoURL);
      router.refresh();
      toast({ title: "Profile picture updated!" });
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not save your new profile picture." });
    } finally {
      setIsUploading(false);
      setIsCropModalOpen(false);
    }
  };

  /* ── Save profile ────────────────────────────────────────────────────── */
  const handleSave = async () => {
    try {
      const idToken = await user!.getIdToken();
      const { success } = await updateUserProfileAction({
        displayName: formData.displayName,
        birthDate: formData.birthDate,
        country: formData.country,
      }, idToken);

      if (success) {
        router.refresh();
        toast({ title: "Profile updated" });
        setIsEditing(false);
      } else {
        throw new Error("Update failed");
      }
    } catch {
      toast({ variant: 'destructive', title: "Save Failed", description: "Could not update your profile." });
    }
  };

  /* ── Guard ───────────────────────────────────────────────────────────── */
  if (loading || !user) return (
    <div className="rounded-xl border border-[var(--vv-border)] bg-white p-8">
      <div className="mb-8 flex items-center gap-6 border-b border-[var(--vv-border)] pb-8">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );

  const appCount = applications.length;
  const joinedDate = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <>
      <VvPageHeader
        kicker="Account"
        title="Profile"
        sub="This is how you appear to case officers and other pilots on the platform."
      />

      {/* ── Avatar & identity card ─────────────────────────────────────── */}
      <div className="mb-5 rounded-xl border border-[var(--vv-border)] bg-white p-8">
        <div className="flex items-center gap-6">
          <div className="group relative">
            <Avatar className="h-24 w-24 border-4 border-white shadow-[0_4px_16px_rgba(0,45,120,0.08)]">
              <AvatarImage src={photoURL || undefined} alt={user.displayName || ''} />
              <AvatarFallback className="bg-[var(--sky-pale)] font-outfit text-3xl font-semibold text-[var(--sky)]">
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-[var(--navy)]/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5" />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
          <div>
            <div className="font-inter text-[11px] font-semibold uppercase tracking-[3px] text-[var(--sky)]">
              {claims?.role === 'user' ? 'Pilot' : claims?.role || 'Pilot'}
            </div>
            <h2 className="mt-1 font-outfit text-[22px] font-semibold text-[var(--navy)]">
              {user.displayName || 'Unnamed Pilot'}
            </h2>
            <div className="mt-1 text-[13px] text-[var(--text-muted)]">
              Joined {joinedDate} · {appCount} application{appCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal details card ──────────────────────────────────────── */}
      <div className="mb-5 rounded-xl border border-[var(--vv-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--vv-border-soft)] px-8 py-5">
          <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Personal details</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--sky)] transition-opacity hover:opacity-70"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>

        <div className="grid gap-5 px-8 py-6 sm:grid-cols-2">
          {/* Display name */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <UserIcon className="h-3 w-3" /> Display name
            </Label>
            <Input
              value={formData.displayName}
              onChange={e => setFormData(f => ({ ...f, displayName: e.target.value }))}
              readOnly={!isEditing}
              placeholder="Your full name"
              className="rounded-lg border-[var(--vv-border)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--sky)]"
            />
          </div>

          {/* Email — always read-only */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <Mail className="h-3 w-3" /> Email
            </Label>
            <Input
              value={user.email || ''}
              readOnly
              className="rounded-lg border-[var(--vv-border)] bg-[var(--surface)] text-[var(--text-primary)]"
            />
          </div>

          {/* Date of birth */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <Calendar className="h-3 w-3" /> Date of birth
            </Label>
            {isEditing ? (
              <div className="grid grid-cols-3 gap-2">
                <Select value={selectedDay} onValueChange={handleDayChange}>
                  <SelectTrigger className="rounded-lg border-[var(--vv-border)]"><SelectValue placeholder="Day" /></SelectTrigger>
                  <SelectContent>{days.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedMonth} onValueChange={handleMonthChange}>
                  <SelectTrigger className="rounded-lg border-[var(--vv-border)]"><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger className="rounded-lg border-[var(--vv-border)]"><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : (
              <Input value={formattedBirthDate} readOnly className="rounded-lg border-[var(--vv-border)] bg-[var(--surface)] text-[var(--text-primary)]" />
            )}
          </div>

          {/* Country of residence */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <Globe className="h-3 w-3" /> Country of residence
            </Label>
            <Input
              value={isEditing ? formData.country : (formData.country || 'Not set')}
              onChange={e => setFormData(f => ({ ...f, country: e.target.value }))}
              readOnly={!isEditing}
              placeholder="e.g. United Arab Emirates"
              className={`rounded-lg border-[var(--vv-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--sky)] ${isEditing ? 'bg-white' : 'bg-[var(--surface)]'}`}
            />
          </div>
        </div>

        {/* Edit footer */}
        {isEditing && (
          <div className="flex items-center justify-between border-t border-[var(--vv-border-soft)] px-8 py-5">
            <div className="text-xs text-[var(--text-muted)]">
              Email is read-only — managed by your sign-in method.
            </div>
            <div className="flex gap-2.5">
              <VvButton variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</VvButton>
              <VvButton size="sm" onClick={handleSave}><Save className="h-3.5 w-3.5" />Save changes</VvButton>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="border-t border-[var(--vv-border-soft)] px-8 py-4">
            <div className="text-xs text-[var(--text-muted)]">
              Email is read-only — managed by your sign-in method (Google).
            </div>
          </div>
        )}
      </div>

      {/* ── Connected accounts card ────────────────────────────────────── */}
      <div className="mb-5 rounded-xl border border-[var(--vv-border)] bg-white">
        <div className="flex items-center gap-2 border-b border-[var(--vv-border-soft)] px-8 py-5">
          <Shield className="h-4 w-4 text-[var(--sky)]" />
          <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Connected accounts</h3>
        </div>
        <div className="px-8 py-6">
          <div className="flex items-center justify-between rounded-[10px] border border-[var(--vv-border-soft)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--vv-border)] bg-white">
                <GoogleIcon />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--navy)]">Google</div>
                <div className="text-xs text-[var(--text-muted)]">{user.email}</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-medium text-[var(--status-ready)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-ready)]"></span>
              Connected
            </span>
          </div>
        </div>
      </div>

      {/* ── Photo crop modal ───────────────────────────────────────────── */}
      {isCropModalOpen && (
        <Dialog open onOpenChange={setIsCropModalOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-outfit text-xl font-semibold text-[var(--navy)]">
                Crop your photo
              </DialogTitle>
            </DialogHeader>
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              {imgSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imgRef}
                  src={imgSrc}
                  style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                  alt="Profile picture crop preview"
                />
              )}
            </ReactCrop>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <ZoomOut className="h-5 w-5" />
                <Slider value={[scale]} onValueChange={([val]) => setScale(val)} min={0.5} max={2} step={0.1} />
                <ZoomIn className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <RotateCcw className="h-5 w-5" />
                <Slider value={[rotate]} onValueChange={([val]) => setRotate(val)} min={-180} max={180} step={1} />
                <RotateCw className="h-5 w-5" />
              </div>
            </div>
            <DialogFooter>
              <VvButton variant="ghost" onClick={() => setIsCropModalOpen(false)}>Cancel</VvButton>
              <VvButton onClick={handleSaveCrop} disabled={isUploading} loading={isUploading}>
                <Save className="h-3.5 w-3.5" />Save
              </VvButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <canvas ref={previewCanvasRef} className="hidden" />
    </>
  );
}
