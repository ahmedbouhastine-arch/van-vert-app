'use client';

import { LoadingScreen } from "@/components/LoadingScreen";
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
import { Camera, RotateCcw, RotateCw, ZoomIn, ZoomOut, Save, Edit, Trash2, User as UserIcon, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfileAction, deleteUserAccountAction, uploadProfilePictureAction } from '@/app/actions';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export function ProfileClient({ claims }: { user: FirebaseUser | null, claims: UserProfile | null, applications: Application[] }) {
  const { user, loading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState({
      personal: false,
      pilot: false,
  });
  
  const [formData, setFormData] = useState({
    displayName: claims?.displayName || '',
    birthDate: claims?.birthDate || '', 
  });

  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [photoURL, setPhotoURL] = useState(user?.photoURL);

  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Date selection logic
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = Array.from({ length: 2010 - 1940 + 1 }, (_, i) => 2010 - i);

  const [selectedDay, setSelectedDay] = useState<string>(formData.birthDate ? new Date(formData.birthDate).getDate().toString() : '');
  const [selectedMonth, setSelectedMonth] = useState<string>(formData.birthDate ? months[new Date(formData.birthDate).getMonth()] : '');
  const [selectedYear, setSelectedYear] = useState<string>(formData.birthDate ? new Date(formData.birthDate).getFullYear().toString() : '');

  const updateBirthDate = (day: string, month: string, year: string) => {
      if (day && month && year) {
          const monthIndex = months.indexOf(month);
          // Create date in UTC to avoid timezone issues shifting the day
          const date = new Date(Date.UTC(parseInt(year), monthIndex, parseInt(day)));
          setFormData(prev => ({ ...prev, birthDate: date.toISOString().split('T')[0] }));
      }
  };

  const handleDayChange = (val: string) => {
      setSelectedDay(val);
      updateBirthDate(val, selectedMonth, selectedYear);
  };
  const handleMonthChange = (val: string) => {
      setSelectedMonth(val);
      updateBirthDate(selectedDay, val, selectedYear);
  };
  const handleYearChange = (val: string) => {
      setSelectedYear(val);
      updateBirthDate(selectedDay, selectedMonth, val);
  };

  const formattedBirthDate = useMemo(() => {
    if (!formData.birthDate) return 'N/A';
    try {
        // Parse the YYYY-MM-DD string directly to avoid timezone offsets
        const [year, month, day] = formData.birthDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
        return 'Invalid Date';
    }
  }, [formData.birthDate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setIsCropModalOpen(true);
    }
  };

  const handleSaveCrop = async () => {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      throw new Error('Crop canvas does not exist');
    }

    setIsUploading(true);
    
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const offscreen = new OffscreenCanvas(completedCrop.width * scaleX, completedCrop.height * scaleY);
    const ctx = offscreen.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

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

    const formData = new FormData();
    formData.append('file', blob, 'profile-picture.png');

    if (!user) { setIsUploading(false); return; }

    try {
        const idToken = await user.getIdToken();
        const { photoURL: newPhotoURL } = await uploadProfilePictureAction(formData, idToken);
        
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

  const handleSaveSection = async (section: 'personal' | 'pilot') => {
      try {
          const idToken = await user!.getIdToken();
          const { success } = await updateUserProfileAction({
              displayName: formData.displayName,
              birthDate: formData.birthDate,
          }, idToken);
          
          if (success) {
            router.refresh();
            toast({ title: `${section.charAt(0).toUpperCase() + section.slice(1)} Information Saved` });
            setIsEditing(prev => ({ ...prev, [section]: false }));
          } else {
              throw new Error("Update failed");
          }
      } catch {
          toast({ variant: 'destructive', title: "Save Failed", description: "Could not update your profile." });
      }
  };

  const handleDeleteAccount = async () => {
      setIsDeleting(true);
      try {
        const idToken = await user!.getIdToken();
        await deleteUserAccountAction(idToken);
        toast({ title: "Account Deleted", description: "Your account has been successfully deleted." });
        
        // Explicitly clear the server session
        await fetch('/api/auth/session/logout', { method: 'POST' });
        await signOut(getAuth());
        
        window.location.href = '/login';
      } catch {
          toast({ variant: 'destructive', title: "Deletion Failed", description: "Could not delete your account." });
      } finally {
          setIsDeleting(false);
      }
  };

  if (loading || !user) {
    return <LoadingScreen />;
  }

  return (
    <>
      <VvPageHeader
        kicker="Account"
        title="Profile"
        sub="This is how you appear to case officers and other pilots on the platform."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
              {/* Profile Picture Card */}
              <div className="flex flex-col items-center rounded-xl border border-[var(--vv-border)] bg-white p-8 text-center">
                  <div className="group relative">
                      <Avatar className="h-32 w-32 border-4 border-white shadow-[0_4px_16px_rgba(0,45,120,0.08)]">
                          <AvatarImage src={photoURL || undefined} alt={user.displayName || ''} />
                          <AvatarFallback className="bg-[var(--sky-pale)] text-4xl text-[var(--sky)]">{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-[var(--navy)]/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <Camera className="h-6 w-6" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                  </div>
                  <h2 className="mt-4 font-outfit text-2xl font-semibold text-[var(--navy)]">{user.displayName}</h2>
                  <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
                  <div className="mt-3">
                      <span className="inline-flex items-center rounded-full border border-[var(--vv-border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium capitalize text-[var(--text-secondary)]">
                          {claims?.role || 'User'}
                      </span>
                  </div>
              </div>

              {/* Security Card */}
              <div className="rounded-xl border border-[var(--vv-border)] bg-white">
                  <div className="flex items-center gap-2 border-b border-[var(--vv-border-soft)] p-6">
                      <Lock className="h-4 w-4 text-[var(--sky)]" />
                      <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Security</h3>
                  </div>
                  <div className="space-y-3 p-6 text-sm">
                      <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Last login</span>
                          <span className="font-medium text-[var(--text-primary)]">{user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Account created</span>
                          <span className="font-medium text-[var(--text-primary)]">{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
                      </div>
                  </div>
                  <div className="border-t border-[var(--vv-border-soft)] p-6">
                      <VvButton variant="outline" className="w-full justify-center">Change password</VvButton>
                  </div>
              </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
              {/* Personal Information Card */}
              <div className="rounded-xl border border-[var(--vv-border)] bg-white">
                  <div className="flex items-center justify-between border-b border-[var(--vv-border-soft)] p-6">
                      <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-[var(--sky)]" />
                          <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Personal information</h3>
                      </div>
                      {!isEditing.personal && (
                          <button onClick={() => setIsEditing(p => ({...p, personal: true}))} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--sky)] hover:underline">
                              <Edit className="h-3.5 w-3.5" />Edit
                          </button>
                      )}
                  </div>
                  <div className="grid gap-4 p-6 sm:grid-cols-2">
                      <div>
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Full name</Label>
                          <Input value={formData.displayName} onChange={e => setFormData(f => ({...f, displayName: e.target.value}))} readOnly={!isEditing.personal} className="mt-1.5 rounded-lg border-[var(--vv-border)] focus-visible:ring-[var(--sky)]" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Birth date</Label>
                          {isEditing.personal ? (
                              <div className="mt-1.5 grid grid-cols-3 gap-2">
                                  <Select value={selectedDay} onValueChange={handleDayChange}>
                                      <SelectTrigger className="rounded-lg border-[var(--vv-border)]">
                                          <SelectValue placeholder="Day" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {days.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                                  <Select value={selectedMonth} onValueChange={handleMonthChange}>
                                      <SelectTrigger className="rounded-lg border-[var(--vv-border)]">
                                          <SelectValue placeholder="Month" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                                  <Select value={selectedYear} onValueChange={handleYearChange}>
                                      <SelectTrigger className="rounded-lg border-[var(--vv-border)]">
                                          <SelectValue placeholder="Year" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              </div>
                          ) : (
                              <Input value={formattedBirthDate} readOnly className="mt-1.5 rounded-lg border-[var(--vv-border)]" />
                          )}
                      </div>
                  </div>
                  {isEditing.personal && (
                      <div className="flex justify-end gap-2 border-t border-[var(--vv-border-soft)] p-6">
                          <VvButton variant="ghost" onClick={() => setIsEditing(p => ({...p, personal: false}))}>Cancel</VvButton>
                          <VvButton onClick={() => handleSaveSection('personal')}><Save className="h-3.5 w-3.5" />Save</VvButton>
                      </div>
                  )}
              </div>

              {/* Danger Zone Card */}
              <div className="rounded-xl border border-[var(--status-missing)]/30 bg-white">
                  <div className="flex items-center gap-2 border-b border-[var(--status-missing)]/15 p-6">
                      <Trash2 className="h-4 w-4 text-[var(--status-missing)]" />
                      <h3 className="font-outfit text-base font-semibold text-[var(--status-missing)]">Danger zone</h3>
                  </div>
                  <div className="p-6">
                      <p className="text-sm text-[var(--text-secondary)]">Deleting your account is a permanent action and cannot be undone. All your applications and data will be removed.</p>
                  </div>
                  <div className="border-t border-[var(--status-missing)]/15 p-6">
                      <VvButton variant="danger" onClick={() => setIsDeleting(true)}>Delete my account</VvButton>
                  </div>
              </div>
          </div>
      </div>

      {isCropModalOpen && (
          <Dialog open onOpenChange={setIsCropModalOpen}>
              <DialogContent className="rounded-2xl">
                  <DialogHeader><DialogTitle className="font-outfit text-xl font-semibold text-[var(--navy)]">Crop your photo</DialogTitle></DialogHeader>
                  <ReactCrop
                      crop={crop}
                      onChange={c => setCrop(c)}
                      onComplete={c => setCompletedCrop(c)}
                      aspect={1}
                      circularCrop
                  >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {imgSrc && <img ref={imgRef} src={imgSrc} style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }} alt="Profile picture crop preview" />}
                  </ReactCrop>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-[var(--text-muted)]"><ZoomOut className="h-5 w-5" /><Slider value={[scale]} onValueChange={([val]) => setScale(val)} min={0.5} max={2} step={0.1} /><ZoomIn className="h-5 w-5" /></div>
                      <div className="flex items-center gap-2 text-[var(--text-muted)]"><RotateCcw className="h-5 w-5" /><Slider value={[rotate]} onValueChange={([val]) => setRotate(val)} min={-180} max={180} step={1} /><RotateCw className="h-5 w-5" /></div>
                  </div>
                  <DialogFooter>
                      <VvButton variant="ghost" onClick={() => setIsCropModalOpen(false)}>Cancel</VvButton>
                      <VvButton onClick={handleSaveCrop} disabled={isUploading} loading={isUploading}><Save className="h-3.5 w-3.5" />Save</VvButton>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}

      {isDeleting && (
          <Dialog open onOpenChange={setIsDeleting}>
              <DialogContent className="rounded-2xl">
                  <DialogHeader><DialogTitle className="font-outfit text-xl font-semibold text-[var(--navy)]">Are you sure?</DialogTitle></DialogHeader>
                  <p className="text-sm text-[var(--text-secondary)]">This action is permanent and cannot be undone. Are you sure you want to delete your account?</p>
                  <DialogFooter>
                      <VvButton variant="ghost" onClick={() => setIsDeleting(false)}>Cancel</VvButton>
                      <VvButton variant="danger" onClick={handleDeleteAccount}>Yes, delete my account</VvButton>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}
      
      <canvas ref={previewCanvasRef} className="hidden" />
    </>
  )
}
