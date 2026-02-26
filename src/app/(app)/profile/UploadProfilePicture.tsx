
'use client';

import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/firebase'; // Assuming you have a firebase app instance initialized

export function UploadProfilePicture() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, `profile-pictures/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setPhotoURL(downloadURL);
    } catch (err) {
      console.error('Upload failed:', err);
      if (err instanceof Error) {
        if (err.message.includes('storage/unauthorized')) {
          setError('Permission denied. Please ensure you are logged in and have the correct permissions.');
        } else if (err.message.includes('storage/invalid-argument')) {
          setError('Invalid argument. Please check the file and try again.');
        } else {
          setError(`Upload failed: ${err.message}`);
        }
      } else {
        setError('An unknown error occurred during upload.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={uploading} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Profile Picture'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {photoURL && (
        <div>
          <p>Upload successful!</p>
          <img src={photoURL} alt="Profile" style={{ width: '150px', height: '150px' }} />
        </div>
      )}
    </div>
  );
}
