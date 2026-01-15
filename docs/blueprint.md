# **App Name**: PilotPack

## Core Features:

- User Authentication: Secure user authentication using email/password and Google Sign-In.
- Application Creation: Allow applicants to create new applications and select license types.
- Document Checklist: Display a dynamic checklist of required documents based on the selected license type, pulling data from Firestore.
- Document Upload and Storage: Enable uploading documents (PDF, JPG, PNG) to Firebase Storage and save metadata to Firestore.
- Document Validation: Validate uploaded documents for presence, file type, file size, and expiry date (when required).
- Application Status Tracking: Display clear document statuses (missing, uploaded, needs attention) and overall application status (draft, submitted, ready) in real-time. A generative AI tool flags items for closer inspection when an expiry date is near.
- Admin Review and Feedback: Enable admins to view applications, download documents, update statuses, and add feedback visible to users.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to evoke trust and professionalism.
- Background color: Light grey (#F0F4F7) to provide a clean and neutral backdrop.
- Accent color: Orange (#FF9800) for calls to action and important status indicators. The orange will contrast well with both the background and primary colors, signaling alerts, updates, and CTAs.
- Headline font: 'Poppins', sans-serif, for headlines and short amounts of body text. Body Font: 'Inter', sans-serif, for body text. The combination will result in a contemporary, clean look.
- Use simple, clear icons to represent document types and application statuses.
- Mobile-first, responsive design with clear visual hierarchy.
- Subtle animations to indicate progress and status changes.