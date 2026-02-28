
'use client';

import { useState, useRef } from 'react';
import { useUser } from '@/firebase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera, RotateCcw, RotateCw, ZoomIn, ZoomOut, Save, Edit, Trash2, ShieldCheck, User as UserIcon, Plane, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfileAction, deleteUserAccountAction, uploadProfilePictureAction } from '@/app/actions';
import { getAuth, signOut } from 'firebase/auth';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

const canvasPreview = (image, canvas, crop) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0, 0,
        crop.width,
        crop.height
    );
};


export function ProfileClient({ user: initialUser, claims, applications }) {
  const { user, mutate } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState({
      personal: false,
      pilot: false,
  });
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    phoneNumber: user?.phoneNumber || '',
    // ... add other pilot info fields if needed
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

  const totalFlightHours = applications?.reduce((sum, app) => 
    sum + (app.flightLogs?.reduce((logSum, log) => logSum + log.duration, 0) || 0), 0) || 0;

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
    
    // This will be fun to implement...
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

    try {
        const idToken = await user.getIdToken();
        const { photoURL: newPhotoURL } = await uploadProfilePictureAction(formData, idToken);
        
        setPhotoURL(newPhotoURL);
        router.refresh(); // Re-fetches user data
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
          const idToken = await user.getIdToken();
          await updateUserProfileAction({
              displayName: formData.displayName,
              phoneNumber: formData.phoneNumber,
          }, idToken);
          
          router.refresh();
          toast({ title: `${section.charAt(0).toUpperCase() + section.slice(1)} Information Saved` });
          setIsEditing(prev => ({ ...prev, [section]: false }));
      } catch (error) {
          toast({ variant: 'destructive', title: "Save Failed", description: "Could not update your profile." });
      }
  };

  const handleDeleteAccount = async () => {
      setIsDeleting(true);
      try {
        const idToken = await user.getIdToken();
        await deleteUserAccountAction(idToken);
        toast({ title: "Account Deleted", description: "Your account has been successfully deleted." });
        signOut(getAuth());
      } catch (error) {
          toast({ variant: 'destructive', title: "Deletion Failed", description: "Could not delete your account." });
      } finally {
          setIsDeleting(false);
      }
  };

  if (!user) {
    return <LoadingScreen />;
  }

  return (
    <>
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">View and manage your profile information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
              {/* Profile Picture Card */}
              <Card className="text-center flex flex-col items-center p-8">
                  <div className="relative group">
                      <Avatar className="h-32 w-32 border-4 border-background shadow-md">
                          <AvatarImage src={photoURL} alt={user.displayName || ''} />
                          <AvatarFallback className="text-4xl bg-primary/10 text-primary">{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="h-6 w-6" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                  </div>
                  <h2 className="text-2xl font-semibold mt-4">{user.displayName}</h2>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="mt-2 capitalize text-sm font-medium">
                      <Badge variant="outline">{claims?.role || 'User'}</Badge>
                  </div>
              </Card>

              {/* Security Card */}
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Security</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3">
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Login</span>
                          <span className="font-medium">{new Date(user.metadata.lastSignInTime).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Created</span>
                          <span className="font-medium">{new Date(user.metadata.creationTime).toLocaleDateString()}</span>
                      </div>
                  </CardContent>
                  <CardFooter>
                      <Button variant="outline" className="w-full">Change Password</Button>
                  </CardFooter>
              </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
              {/* Personal Information Card */}
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2"><UserIcon className="h-5 w-5" /> <CardTitle>Personal Information</CardTitle></div>
                      {!isEditing.personal && <Button variant="ghost" size="sm" onClick={() => setIsEditing(p => ({...p, personal: true}))}><Edit className="h-4 w-4 mr-2" />Edit</Button>}
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-4">
                      <div>
                          <Label>Full Name</Label>
                          <Input value={formData.displayName} onChange={e => setFormData(f => ({...f, displayName: e.target.value}))} readOnly={!isEditing.personal} />
                      </div>
                      <div>
                          <Label>Phone Number</Label>
                          <Input value={formData.phoneNumber} onChange={e => setFormData(f => ({...f, phoneNumber: e.target.value}))} readOnly={!isEditing.personal} />
                      </div>
                      {/* ... other personal fields */}
                  </CardContent>
                  {isEditing.personal && (
                      <CardFooter className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => setIsEditing(p => ({...p, personal: false}))}>Cancel</Button>
                          <Button onClick={() => handleSaveSection('personal')}><Save className="h-4 w-4 mr-2" />Save</Button>
                      </CardFooter>
                  )}
              </Card>

              {/* Danger Zone Card */}
              <Card className="border-red-500/50">
                  <CardHeader>
                      <CardTitle className="text-red-500 flex items-center gap-2"><Trash2 className="h-5 w-5" />Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-sm text-muted-foreground">Deleting your account is a permanent action and cannot be undone. All your applications and data will be removed.</p>
                  </CardContent>
                  <CardFooter>
                      <Button variant="destructive" onClick={() => setIsDeleting(true)}>Delete My Account</Button>
                  </CardFooter>
              </Card>
          </div>
      </div>
      
      {isCropModalOpen && (
          <Dialog open onOpenChange={setIsCropModalOpen}>
              <DialogContent>
                  <DialogHeader><DialogTitle>Crop Your Photo</DialogTitle></DialogHeader>
                  <ReactCrop
                      crop={crop}
                      onChange={c => setCrop(c)}
                      onComplete={c => setCompletedCrop(c)}
                      aspect={1}
                      circularCrop
                  >
                      {imgSrc && <img ref={imgRef} src={imgSrc} style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }} alt="Crop me" />}
                  </ReactCrop>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2"><ZoomOut className="h-5 w-5" /><Slider value={[scale]} onValueChange={([val]) => setScale(val)} min={0.5} max={2} step={0.1} /><ZoomIn className="h-5 w-5" /></div>
                      <div className="flex items-center gap-2"><RotateCcw className="h-5 w-5" /><Slider value={[rotate]} onValueChange={([val]) => setRotate(val)} min={-180} max={180} step={1} /><RotateCw className="h-5 w-5" /></div>
                  </div>
                  <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsCropModalOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveCrop} disabled={isUploading}>{isUploading && <Loader2 className="animate-spin mr-2 h-4 w-4"/>}Save</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}

      {isDeleting && (
          <Dialog open onOpenChange={setIsDeleting}>
              <DialogContent>
                  <DialogHeader><DialogTitle>Are you sure?</DialogTitle></DialogHeader>
                  <p>This action is permanent and cannot be undone. Are you sure you want to delete your account?</p>
                  <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsDeleting(false)}>Cancel</Button>
                      <Button variant="destructive" onClick={handleDeleteAccount}>Yes, Delete My Account</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}
      
      <canvas ref={previewCanvasRef} className="hidden" />
    </>
  )
}
