# Admin Panel - User Verification Photos Guide

## Overview
This guide explains how to view and verify user verification photos in the admin panel. Users are now required to submit **4 verification photos** during profile completion.

## Required Verification Photos

### 1. **Driver License** (`driverLicenseUrl`)
- Clear photo of the user's driver license
- Both sides should be visible and readable
- Check for expiration date validity

### 2. **Face Photo** (`facePhotoUrl`)
- Clear frontal photo of user's face
- Good lighting, no sunglasses or face coverings
- Use for facial comparison with ID selfie

### 3. **Passport** (`passportUrl`)
- Clear photo of passport information page
- Photo page with user's details visible
- Check for expiration date validity

### 4. **ID Selfie Verification** (`idSelfieUrl`) - **NEW**
- **Liveness check photo**: User holding their passport next to their face
- Must show both:
  - User's face clearly visible
  - Passport information page clearly visible
- This verifies the user physically possesses the passport
- Compare face in selfie with passport photo and face photo

## Firebase Database Structure

All photos are stored in the `users` collection under each user document:

```json
{
  "uid": "user123",
  "email": "user@example.com",
  "fullName": "John Doe",
  "driverLicenseUrl": "https://storage.googleapis.com/...",
  "facePhotoUrl": "https://storage.googleapis.com/...",
  "passportUrl": "https://storage.googleapis.com/...",
  "idSelfieUrl": "https://storage.googleapis.com/...",
  "isVerified": false,
  "isActive": false
}
```

## Admin Panel Implementation

### Step 1: Update User Interface (TypeScript/JavaScript)

```typescript
interface User {
  uid: string;
  email: string;
  fullName: string;
  driverLicenseUrl?: string;
  facePhotoUrl?: string;
  passportUrl?: string;
  idSelfieUrl?: string;  // NEW FIELD
  isVerified: boolean;
  isActive: boolean;
}
```

### Step 2: Display Verification Photos in Admin UI

```html
<!-- User Verification Section -->
<div class="verification-section">
  <h3>User Verification Documents</h3>
  
  <div class="verification-photos">
    <!-- Driver License -->
    <div class="photo-card">
      <h4>Driver License</h4>
      <img src="{{ user.driverLicenseUrl }}" alt="Driver License" />
      <button onclick="viewFullSize('driverLicense')">View Full Size</button>
    </div>
    
    <!-- Face Photo -->
    <div class="photo-card">
      <h4>Face Photo</h4>
      <img src="{{ user.facePhotoUrl }}" alt="Face Photo" />
      <button onclick="viewFullSize('facePhoto')">View Full Size</button>
    </div>
    
    <!-- Passport -->
    <div class="photo-card">
      <h4>Passport</h4>
      <img src="{{ user.passportUrl }}" alt="Passport" />
      <button onclick="viewFullSize('passport')">View Full Size</button>
    </div>
    
    <!-- ID Selfie (NEW) -->
    <div class="photo-card highlight">
      <h4>ID Selfie Verification 🆕</h4>
      <p class="helper-text">User holding passport next to face</p>
      <img src="{{ user.idSelfieUrl }}" alt="ID Selfie" />
      <button onclick="viewFullSize('idSelfie')">View Full Size</button>
    </div>
  </div>
  
  <!-- Verification Actions -->
  <div class="verification-actions">
    <button class="btn-approve" onclick="approveUser('{{ user.uid }}')">
      ✅ Approve User
    </button>
    <button class="btn-reject" onclick="rejectUser('{{ user.uid }}')">
      ❌ Reject User
    </button>
    <button class="btn-request-resubmit" onclick="requestResubmit('{{ user.uid }}')">
      🔄 Request Resubmission
    </button>
  </div>
</div>
```

### Step 3: Firestore Query to Get Pending Users

```javascript
// Get users pending verification
async function getPendingUsers() {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef, 
    where('isVerified', '==', false),
    where('driverLicenseUrl', '!=', null),
    where('facePhotoUrl', '!=', null),
    where('passportUrl', '!=', null),
    where('idSelfieUrl', '!=', null)  // NEW: Check for ID selfie
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
}
```

### Step 4: User Verification Logic

```javascript
async function approveUser(userId) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isVerified: true,
      isActive: true,
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Send notification to user
    await sendVerificationNotification(userId, 'approved');
    
    alert('User approved successfully!');
    loadPendingUsers(); // Refresh list
  } catch (error) {
    console.error('Error approving user:', error);
    alert('Failed to approve user');
  }
}

async function rejectUser(userId) {
  const reason = prompt('Enter rejection reason:');
  if (!reason) return;
  
  try {
    await updateDoc(doc(db, 'users', userId), {
      isVerified: false,
      isActive: false,
      rejectionReason: reason,
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Send notification to user
    await sendVerificationNotification(userId, 'rejected', reason);
    
    alert('User rejected');
    loadPendingUsers(); // Refresh list
  } catch (error) {
    console.error('Error rejecting user:', error);
    alert('Failed to reject user');
  }
}
```

## Verification Checklist

When reviewing user documents, check:

- [ ] **Driver License**
  - Valid and not expired
  - Clear and readable
  - Matches user's name

- [ ] **Face Photo**
  - Clear frontal view
  - Face clearly visible
  - No obstructions

- [ ] **Passport**
  - Valid and not expired
  - Information page visible
  - Matches user's name

- [ ] **ID Selfie (Liveness Check)** ⭐ **NEW**
  - User's face clearly visible
  - Passport held next to face
  - Passport details readable
  - Face matches passport photo
  - Face matches face photo
  - Recent photo (not screenshot)

## Security Considerations

1. **Storage Rules**: Ensure Firebase Storage rules protect photo access
   ```javascript
   // storage.rules
   match /users/{userId}/{allPaths=**} {
     allow read: if request.auth != null && 
                    (request.auth.uid == userId || 
                     get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true);
     allow write: if request.auth.uid == userId;
   }
   ```

2. **Admin Authentication**: Only verified admins should access verification photos

3. **Photo Retention**: Consider GDPR compliance for photo storage duration

4. **Audit Trail**: Log all verification decisions with timestamps and admin IDs

## Notification Templates

### Approval Notification
```javascript
{
  title: "Account Verified ✅",
  body: "Congratulations! Your account has been verified. You can now access all features.",
  type: "verification_approved"
}
```

### Rejection Notification
```javascript
{
  title: "Account Verification Failed ❌",
  body: "Your verification documents were rejected. Reason: {reason}. Please resubmit.",
  type: "verification_rejected"
}
```

## Common Issues

1. **Missing ID Selfie**: Existing users won't have `idSelfieUrl`
   - Handle gracefully in admin UI
   - Consider migration to request resubmission

2. **Poor Photo Quality**: Request resubmission with specific instructions

3. **Mismatched Information**: If names don't match across documents, request clarification

## Mobile App Changes

The mobile app now requires users to:
1. Upload driver license
2. Upload face photo
3. Upload passport
4. **Take ID selfie** (holding passport next to face)

All 4 photos are mandatory for profile completion.

## Questions?

For technical support or questions about the verification process, contact the development team.

---

**Last Updated**: November 14, 2025  
**Version**: 2.0 (Added ID Selfie Verification)
