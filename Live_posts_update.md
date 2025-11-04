# Live Taxi Feature - Admin Panel Integration Guide

## Overview
This document details the new Live Taxi feature added to the Wasselle mobile app, including all Firebase collections, field structures, and transaction flows that need to be integrated into the admin panel.

---

## 📦 New Firebase Collections

### 1. `liveTaxiPosts` Collection
**Purpose:** Stores all live taxi ride requests created by users

**Document Structure:**
```typescript
{
  id: string;                    // Auto-generated document ID
  userId: string;                // Creator's user ID
  userName: string;              // Creator's full name
  userPhone?: string;            // Creator's phone number (optional)
  
  // Location Information
  fromCityId: string;            // Pickup city ID
  fromCityName: string;          // Pickup city name
  fromCountryId: string;         // Pickup country ID
  fromCountryName: string;       // Pickup country name
  
  toCityId: string;              // Destination city ID
  toCityName: string;            // Destination city name
  toCountryId: string;           // Destination country ID (same as fromCountryId)
  toCountryName: string;         // Destination country name (same as fromCountryName)
  
  // Pricing & Contact
  offerPrice: number;            // Price offered in points
  contactPhone?: string;         // Contact phone (optional)
  
  // Status Management
  status: 'waiting' | 'accepted' | 'completed' | 'cancelled';
  
  // Accepted Driver Information (only when status = 'accepted')
  acceptedDriverId?: string;     // Driver's user ID
  acceptedDriverName?: string;   // Driver's full name
  acceptedApplicationId?: string; // Application ID that was accepted
  
  // Timestamps
  createdAt: Timestamp;          // When post was created
  expiresAt: Timestamp;          // Auto-expires after 2 hours
  updatedAt: Timestamp;          // Last update time
  acceptedAt?: Timestamp;        // When driver was accepted (optional)
  completedAt?: Timestamp;       // When ride was completed (optional)
}
```

**Status Flow:**
- `waiting` → Initial state, accepting driver applications
- `accepted` → Driver selected, ride in progress
- `completed` → Ride finished, payment transferred
- `cancelled` → Post cancelled by creator

---

### 2. `liveTaxiApplications` Collection
**Purpose:** Stores driver applications to live taxi posts

**Document Structure:**
```typescript
{
  id: string;                    // Auto-generated document ID
  livePostId: string;            // Reference to liveTaxiPosts document
  
  // Driver Information
  driverId: string;              // Driver's user ID
  driverName: string;            // Driver's full name
  driverPhone?: string;          // Driver's phone (optional)
  driverPhoto?: string;          // Driver's profile photo URL (optional)
  
  // Vehicle Information
  vehicleId?: string;            // Reference to vehicles document (optional)
  vehicleInfo?: {                // Vehicle details (optional)
    type: 'vehicle';
    model: string;               // e.g., "Toyota Corolla 2020"
    color: string;               // e.g., "Black"
    plateNumber: string;         // e.g., "ABC-1234"
  };
  
  // Status
  status: 'pending' | 'accepted' | 'rejected';
  
  // Timestamps
  appliedAt: Timestamp;          // When driver applied
}
```

**Status Flow:**
- `pending` → Driver applied, waiting for post creator's decision
- `accepted` → Post creator accepted this driver (only ONE can be accepted)
- `rejected` → Post creator accepted another driver (all others auto-rejected)

---

## 💰 Transaction Integration

### Transaction Type: Live Taxi Payment
When a ride is completed, a wallet-to-wallet transaction is created in the existing `transactions` collection.

**Transaction Document (existing collection, new type):**
```typescript
{
  id: string;
  userId: string;                // Post creator (receiver) ID
  type: 'live_taxi_payment';     // ⭐ NEW TRANSACTION TYPE
  amount: number;                // Price in points (from liveTaxiPost.offerPrice)
  description: string;           // e.g., "Live Taxi: Beirut → Tripoli"
  status: 'completed';
  
  // Metadata
  metadata: {
    livePostId: string;          // Reference to liveTaxiPosts document
    driverId: string;            // Driver who got paid
    driverName: string;          // Driver's name
    fromUserId: string;          // Post creator (payer) ID
    toUserId: string;            // Driver (receiver) ID
    fromCity: string;            // e.g., "Beirut"
    toCity: string;              // e.g., "Tripoli"
  };
  
  createdAt: Timestamp;
}
```

**⚠️ Important Notes:**
1. **Two transactions are created** when ride completes:
   - Transaction #1: Post creator pays (negative amount)
   - Transaction #2: Driver receives (positive amount)
2. Both transactions reference the same `livePostId` in metadata
3. Transaction type is exactly: `'live_taxi_payment'`

---

## 🔄 Notification System

### New Notification Types
Live taxi feature creates notifications in the existing `notifications` collection:

#### 1. Country-Wide New Post Notification
```typescript
{
  userId: string;                // Recipient user ID
  type: 'live_taxi_available';   // ⭐ NEW NOTIFICATION TYPE
  title: '🚕 New Live Taxi Request!';
  message: 'Ride available: Beirut → Tripoli for 50 points';
  // OR for same-city users:
  message: '🚕 Live Taxi in Your City! Ride from Beirut → Tripoli for 50 points';
  
  data: {
    livePostId: string;          // Reference to liveTaxiPosts document
  };
  
  isRead: boolean;
  createdAt: Timestamp;
}
```

#### 2. Driver Application Notification
```typescript
{
  userId: string;                // Post creator ID
  type: 'live_taxi_application'; // ⭐ NEW NOTIFICATION TYPE
  title: '🚗 New Driver Application';
  message: 'Ahmad applied for your ride: Beirut → Tripoli';
  
  data: {
    livePostId: string;          // Reference to liveTaxiPosts document
    applicationId: string;       // Reference to liveTaxiApplications document
    driverId: string;            // Driver's user ID
  };
  
  isRead: boolean;
  createdAt: Timestamp;
}
```

---

## 📊 Admin Panel Required Changes

### 1. Posts Dashboard
**Add new tab/section: "Live Taxi Posts"**

**Display Fields:**
- Post ID
- Creator Name (from `userName`)
- Route: `fromCityName` → `toCityName`
- Price: `offerPrice` points
- Status badge (waiting/accepted/completed/cancelled)
- Created At
- Expires At (2 hours from creation)
- Driver Name (if accepted/completed: `acceptedDriverName`)
- Applications Count (count from `liveTaxiApplications` where `livePostId` matches)

**Filters:**
- By Status (waiting, accepted, completed, cancelled)
- By Country (`fromCountryId`)
- By City (`fromCityId` or `toCityId`)
- By Date Range
- By User

**Actions:**
- View Applications (list all `liveTaxiApplications` for this post)
- View Post Details
- Cancel Post (admin override)

---

### 2. Transactions Dashboard
**Add new transaction type filter: "Live Taxi Payment"**

**Display Fields for `live_taxi_payment` type:**
- Transaction ID
- Post Creator: `metadata.fromUserId` → User Name
- Driver: `metadata.driverId` → Driver Name (`metadata.driverName`)
- Route: `metadata.fromCity` → `metadata.toCity`
- Amount (points)
- Status (always "completed" for live taxi)
- Created At
- Related Post ID: `metadata.livePostId` (clickable link to post)

**Query Example:**
```javascript
// Get all live taxi transactions
const transactions = await db.collection('transactions')
  .where('type', '==', 'live_taxi_payment')
  .orderBy('createdAt', 'desc')
  .get();
```

---

### 3. New Statistics to Track

**Live Taxi Metrics:**
1. Total Live Posts Created
2. Total Live Posts Completed
3. Active Live Posts (status = 'waiting')
4. Total Revenue from Live Taxi (sum of completed `live_taxi_payment` transactions)
5. Average Response Time (time between post creation and first application)
6. Most Active Cities (by post count)
7. Top Drivers (by completed rides)

**Query Examples:**
```javascript
// Active posts
const activePosts = await db.collection('liveTaxiPosts')
  .where('status', '==', 'waiting')
  .get();

// Completed posts
const completedPosts = await db.collection('liveTaxiPosts')
  .where('status', '==', 'completed')
  .get();

// Total revenue
const revenue = await db.collection('transactions')
  .where('type', '==', 'live_taxi_payment')
  .where('amount', '>', 0) // Only positive amounts (drivers receiving)
  .get();
// Sum revenue.docs.map(doc => doc.data().amount)

// Applications per post
const applications = await db.collection('liveTaxiApplications')
  .where('livePostId', '==', postId)
  .get();
```

---

## 🔍 Important Field Names (Double-Checked)

### Collection Names (Exact):
- ✅ `liveTaxiPosts`
- ✅ `liveTaxiApplications`
- ✅ `transactions` (existing)
- ✅ `notifications` (existing)

### Status Values (Exact):
**liveTaxiPosts.status:**
- ✅ `'waiting'`
- ✅ `'accepted'`
- ✅ `'completed'`
- ✅ `'cancelled'`

**liveTaxiApplications.status:**
- ✅ `'pending'`
- ✅ `'accepted'`
- ✅ `'rejected'`

### Transaction Type (Exact):
- ✅ `'live_taxi_payment'`

### Notification Types (Exact):
- ✅ `'live_taxi_available'`
- ✅ `'live_taxi_application'`

### Key Field Names (Exact):
**liveTaxiPosts:**
- ✅ `userId` (creator)
- ✅ `userName` (creator name)
- ✅ `fromCityId`, `fromCityName`, `fromCountryId`, `fromCountryName`
- ✅ `toCityId`, `toCityName`, `toCountryId`, `toCountryName`
- ✅ `offerPrice` (number)
- ✅ `contactPhone` (optional)
- ✅ `acceptedDriverId`, `acceptedDriverName`, `acceptedApplicationId` (optional)
- ✅ `createdAt`, `expiresAt`, `updatedAt`, `acceptedAt`, `completedAt`

**liveTaxiApplications:**
- ✅ `livePostId` (reference to post)
- ✅ `driverId`, `driverName`, `driverPhone`, `driverPhoto`
- ✅ `vehicleId`, `vehicleInfo`
- ✅ `appliedAt`

**transactions (live taxi payments):**
- ✅ `type: 'live_taxi_payment'`
- ✅ `metadata.livePostId`
- ✅ `metadata.driverId`
- ✅ `metadata.driverName`
- ✅ `metadata.fromUserId`
- ✅ `metadata.toUserId`
- ✅ `metadata.fromCity`
- ✅ `metadata.toCity`

---

## 🚀 Feature Flow Summary

1. **User Creates Post:**
   - Document created in `liveTaxiPosts` with status `'waiting'`
   - Expires automatically after 2 hours (`expiresAt`)
   - Notifications sent to all users in country (`type: 'live_taxi_available'`)

2. **Driver Applies:**
   - Document created in `liveTaxiApplications` with status `'pending'`
   - Notification sent to post creator (`type: 'live_taxi_application'`)

3. **Creator Accepts Driver:**
   - `liveTaxiPosts.status` → `'accepted'`
   - `liveTaxiPosts.acceptedDriverId`, `acceptedDriverName`, `acceptedApplicationId` set
   - Accepted application status → `'accepted'`
   - All other applications status → `'rejected'`

4. **Creator Completes Ride:**
   - `liveTaxiPosts.status` → `'completed'`
   - Two transactions created in `transactions` collection:
     - Creator pays (negative amount)
     - Driver receives (positive amount)
   - Both have `type: 'live_taxi_payment'`

5. **Alternative: Creator Cancels:**
   - `liveTaxiPosts.status` → `'cancelled'`
   - No payment occurs
   - Applications remain as-is

---

## 📝 Admin Panel UI Recommendations

### Live Taxi Posts Table Columns:
1. Post ID (short)
2. Creator
3. Route (From → To)
4. Price
5. Status (badge with color)
6. Applications Count
7. Driver (if accepted)
8. Created
9. Actions (View/Cancel)

### Transaction Filter Addition:
```
[All Types ▼]
- Wallet Top-Up
- Post Subscription
- Live Taxi Payment  ⭐ NEW
- ...
```

### Dashboard Stats Widget:
```
📊 Live Taxi Overview
├─ Active Requests: 12
├─ Completed Today: 45
├─ Revenue Today: 2,340 points
└─ Total Applications: 156
```

---

## ✅ Testing Checklist for Admin Panel

- [ ] Can view all live taxi posts
- [ ] Can filter posts by status
- [ ] Can see application count per post
- [ ] Can view applications list for each post
- [ ] Can see live taxi transactions separately
- [ ] Transaction shows correct post creator and driver names
- [ ] Can click transaction to view related post
- [ ] Dashboard stats show correct live taxi metrics
- [ ] Can export live taxi data (CSV/Excel)
- [ ] Notifications show correct types

---

## 🔗 Related Files (for reference)

**Mobile App:**
- `types/LiveTaxi.ts` - TypeScript interfaces
- `services/liveTaxiService.ts` - Firebase service functions
- `components/dashboard/posts/LiveTaxiPostsList.tsx` - UI component
- `components/dashboard/posts/modals/CreateLiveTaxiModal.tsx` - Create form
- `components/dashboard/posts/modals/ApplicationsModal.tsx` - Applications view

---

**Created:** November 4, 2025  
**Version:** 1.0  
**Feature:** Live Taxi (Real-time Ride Matching)
