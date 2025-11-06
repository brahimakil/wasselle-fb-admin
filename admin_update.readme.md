# Admin Panel Integration Guide - Live Taxi System

## 🚨 CRITICAL CHANGES - READ CAREFULLY

The mobile app has been **completely redesigned** to focus exclusively on the **Live Taxi** system. The old "Posts" feature has been **removed** and replaced with a real-time ride/delivery matching system.

---

## 📋 What Changed?

### ❌ REMOVED: Old Posts System
- **Collection**: `posts` (still exists but **NO LONGER USED** in mobile app)
- The old posts system with taxi/delivery/airplane travel types is **DEPRECATED**
- Users can no longer create or view old-style posts from the mobile app

### ✅ NEW: Live Taxi System
- **Collection**: `liveTaxiPosts` (NEW - this is what you need to manage)
- **Collection**: `liveTaxiApplications` (NEW - driver applications to live posts)
- Real-time matching between passengers and drivers
- 2-hour expiration on all live requests
- Location-based with map coordinates

---

## 🗄️ Firestore Collections

### Collection 1: `liveTaxiPosts`

This is the **MAIN collection** you need to add to your admin panel.

#### Document Structure:
```javascript
{
  // Document ID (auto-generated)
  id: string,
  
  // User Information
  userId: string,              // Creator's Firebase Auth UID
  userName: string,            // Creator's full name
  userPhone: string,           // Creator's phone number (optional)
  
  // Location Information
  fromCountryId: string,       // Origin country document ID
  fromCountryName: string,     // Origin country name (e.g., "Lebanon")
  fromCityId: string,          // Origin city document ID
  fromCityName: string,        // Origin city name (e.g., "Beirut")
  toCountryId: string,         // Destination country document ID
  toCountryName: string,       // Destination country name
  toCityId: string,            // Destination city document ID
  toCityName: string,          // Destination city name
  
  // 🆕 Service Type (NEW FIELD - IMPORTANT!)
  serviceType: string,         // "taxi" OR "delivery" (REQUIRED)
  
  // Pricing
  offerPrice: number,          // Price in points (e.g., 50)
  
  // Contact
  contactPhone: string,        // Contact phone number (optional)
  
  // 🆕 Map Coordinates (NEW FIELDS - IMPORTANT!)
  pickupLocation: {            // OPTIONAL but recommended
    latitude: number,          // e.g., 33.8886
    longitude: number,         // e.g., 35.4955
    address: string            // Human-readable address (optional)
  },
  destinationLocation: {       // OPTIONAL but recommended
    latitude: number,
    longitude: number,
    address: string
  },
  
  // Status Management
  status: string,              // "waiting" | "accepted" | "completed" | "cancelled"
  acceptedDriverId: string,    // Firebase UID of accepted driver (null if waiting)
  acceptedDriverName: string,  // Name of accepted driver (optional)
  
  // Timestamps
  createdAt: Timestamp,        // Firebase serverTimestamp()
  expiresAt: Timestamp,        // createdAt + 2 hours (AUTO-EXPIRE)
  updatedAt: Timestamp         // Firebase serverTimestamp()
}
```

#### Field Details:

**serviceType** (NEW - CRITICAL):
- **Type**: String
- **Values**: `"taxi"` OR `"delivery"`
- **Required**: YES
- **Description**: Determines if this is a taxi ride or delivery service
- **Display**: Show icon (🚕 for taxi, 📦 for delivery)

**pickupLocation** (NEW):
- **Type**: Object with latitude, longitude, address
- **Required**: NO (but recommended)
- **Description**: Exact GPS coordinates of pickup point
- **Usage**: Display on map in admin panel

**destinationLocation** (NEW):
- **Type**: Object with latitude, longitude, address
- **Required**: NO (but recommended)
- **Description**: Exact GPS coordinates of destination
- **Usage**: Display on map in admin panel

**status**:
- `"waiting"` - Newly created, waiting for drivers
- `"accepted"` - Driver accepted, trip in progress
- `"completed"` - Trip finished successfully
- `"cancelled"` - Cancelled by user or expired

**expiresAt**:
- **IMPORTANT**: All posts expire after 2 hours
- Your admin panel should filter out expired posts
- Show time remaining (e.g., "Expires in 1h 23m")

---

### Collection 2: `liveTaxiApplications`

This collection stores driver applications to live posts.

#### Document Structure:
```javascript
{
  // Document ID (auto-generated)
  id: string,
  
  // Reference to the live post
  livePostId: string,          // Document ID from liveTaxiPosts collection
  
  // Driver Information
  driverId: string,            // Driver's Firebase Auth UID
  driverName: string,          // Driver's full name
  driverPhone: string,         // Driver's phone number (optional)
  driverPhoto: string,         // Driver's profile photo URL (optional)
  
  // Vehicle Information (optional)
  vehicleId: string,           // Vehicle document ID (optional)
  vehicleInfo: {               // Vehicle details (optional)
    type: string,              // e.g., "sedan", "suv", "van"
    model: string,             // e.g., "Toyota Camry 2020"
    color: string,             // e.g., "Black"
    plateNumber: string        // e.g., "ABC-123"
  },
  
  // Application Status
  status: string,              // "pending" | "accepted" | "rejected"
  
  // Timestamp
  appliedAt: Timestamp         // When driver applied
}
```

---

## 🎯 Admin Panel Requirements

### 1. Update Sidebar Navigation
**CHANGE THIS:**
```
📋 Posts Management
```

**TO THIS:**
```
🚕 Live Posts (Taxi/Delivery)
```

### 2. Create New Admin Page: "Live Posts Management"

#### Page Features:
1. **List All Live Posts** from `liveTaxiPosts` collection
2. **Filter Options**:
   - Service Type: All / Taxi / Delivery
   - Status: All / Waiting / Accepted / Completed / Cancelled
   - Date Range
   - Country/City
   - Show Expired: Yes / No (default: No)

3. **Display Table Columns**:
   - 🆕 Service Type (🚕 Taxi or 📦 Delivery badge)
   - User Name
   - From City → To City
   - Price (points)
   - Status (with color badges)
   - Created At
   - Expires At (with countdown if active)
   - Applications Count
   - Actions

4. **Detail View** (when clicking a row):
   - All post information
   - 🆕 Map view showing pickup and destination locations
   - List of driver applications
   - Accept/Reject applications
   - Cancel post
   - Mark as completed

5. **Statistics Dashboard**:
   - Total active live posts
   - Taxi vs Delivery breakdown
   - Posts by status
   - Average response time
   - Most active cities

---

## 🔍 Important Queries

### Get All Active Live Posts (Not Expired)
```javascript
const now = new Date();
const activePosts = await db.collection('liveTaxiPosts')
  .where('expiresAt', '>', now)
  .where('status', '!=', 'cancelled')
  .orderBy('expiresAt')
  .orderBy('createdAt', 'desc')
  .get();
```

### Get Posts by Service Type
```javascript
// Taxi posts only
const taxiPosts = await db.collection('liveTaxiPosts')
  .where('serviceType', '==', 'taxi')
  .get();

// Delivery posts only
const deliveryPosts = await db.collection('liveTaxiPosts')
  .where('serviceType', '==', 'delivery')
  .get();
```

### Get Applications for a Post
```javascript
const applications = await db.collection('liveTaxiApplications')
  .where('livePostId', '==', postId)
  .orderBy('appliedAt', 'desc')
  .get();
```

### Get Waiting Posts (Need Drivers)
```javascript
const waitingPosts = await db.collection('liveTaxiPosts')
  .where('status', '==', 'waiting')
  .where('expiresAt', '>', new Date())
  .get();
```

---

## 📊 Display Examples

### Service Type Badges
```html
<!-- Taxi -->
<span class="badge badge-blue">
  🚕 Taxi
</span>

<!-- Delivery -->
<span class="badge badge-orange">
  📦 Delivery
</span>
```

### Status Badges
```javascript
const statusColors = {
  'waiting': 'warning',    // Yellow
  'accepted': 'success',   // Green
  'completed': 'info',     // Blue
  'cancelled': 'danger'    // Red
};
```

### Expiration Countdown
```javascript
function getTimeRemaining(expiresAt) {
  const now = new Date();
  const diff = expiresAt.toDate() - now;
  
  if (diff <= 0) return 'EXPIRED';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}
```

### Map Integration (Optional but Recommended)
```javascript
// If pickupLocation and destinationLocation exist, show on map
if (post.pickupLocation && post.destinationLocation) {
  // Use Google Maps API or Leaflet.js
  showMapWithMarkers([
    { lat: post.pickupLocation.latitude, lng: post.pickupLocation.longitude, icon: 'green' },
    { lat: post.destinationLocation.latitude, lng: post.destinationLocation.longitude, icon: 'red' }
  ]);
}
```

---

## ⚠️ Critical Validations

### 1. Expiration Check (IMPORTANT!)
Always check if a post has expired before allowing actions:
```javascript
function isPostExpired(expiresAt) {
  return new Date() > expiresAt.toDate();
}

// Before accepting application
if (isPostExpired(post.expiresAt)) {
  alert('This post has expired!');
  return;
}
```

### 2. Status Transitions
Valid status transitions:
- `waiting` → `accepted` ✅
- `waiting` → `cancelled` ✅
- `accepted` → `completed` ✅
- `accepted` → `cancelled` ✅
- Any status → `completed` or `cancelled` ✅

Invalid transitions:
- `completed` → anything ❌ (final state)
- `cancelled` → anything ❌ (final state)

### 3. Single Accepted Driver
When accepting a driver:
```javascript
// 1. Update the liveTaxiPost
await db.collection('liveTaxiPosts').doc(postId).update({
  status: 'accepted',
  acceptedDriverId: driverId,
  acceptedDriverName: driverName,
  updatedAt: serverTimestamp()
});

// 2. Update the accepted application
await db.collection('liveTaxiApplications').doc(applicationId).update({
  status: 'accepted'
});

// 3. Reject all other applications
const otherApplications = await db.collection('liveTaxiApplications')
  .where('livePostId', '==', postId)
  .where('status', '==', 'pending')
  .get();

const batch = db.batch();
otherApplications.forEach(doc => {
  if (doc.id !== applicationId) {
    batch.update(doc.ref, { status: 'rejected' });
  }
});
await batch.commit();
```

---

## 🚫 What NOT to Do

1. ❌ **DO NOT** try to manage the old `posts` collection for mobile users
   - It's deprecated and no longer used by the app
   
2. ❌ **DO NOT** allow status changes on expired posts
   - Check `expiresAt` before any update
   
3. ❌ **DO NOT** forget to include `serviceType` when creating test data
   - It's a required field now
   
4. ❌ **DO NOT** allow multiple accepted drivers on one post
   - Enforce single acceptance logic

---

## ✅ Migration Checklist

- [ ] Add new sidebar menu: "Live Posts (Taxi/Delivery)"
- [ ] Create live posts management page
- [ ] Add service type filter (Taxi/Delivery)
- [ ] Display service type badges (🚕/📦)
- [ ] Show expiration countdown
- [ ] Add map view for pickup/destination (if coordinates exist)
- [ ] Implement applications management
- [ ] Add expired posts filter
- [ ] Create statistics dashboard
- [ ] Test status transitions
- [ ] Test expiration logic
- [ ] Add search by user/phone/city

---

## 📞 Support

If you need clarification on any field or functionality, check:
1. Mobile app TypeScript types: `types/LiveTaxi.ts`
2. Service layer: `services/liveTaxiService.ts`
3. This README file

---

## 🎨 UI/UX Recommendations

### Service Type Display
```html
<!-- In list view -->
<div class="service-badge">
  <span class="emoji">🚕</span>
  <span class="label">Taxi</span>
</div>

<!-- Color coding -->
Taxi: Blue theme (#3b82f6)
Delivery: Orange theme (#ea580c)
```

### Priority Indicators
- **Expiring Soon** (< 30 min): Red pulse animation
- **New** (< 5 min old): "NEW" badge
- **Multiple Applications**: Show count badge (e.g., "5 drivers")

### Status Color Coding
- Waiting: Yellow/Amber (#fbbf24)
- Accepted: Green (#22c55e)
- Completed: Blue (#3b82f6)
- Cancelled: Red (#ef4444)
- Expired: Gray (#6b7280)

---

## 🔄 Real-time Updates (Optional)

For better UX, implement real-time listeners:
```javascript
db.collection('liveTaxiPosts')
  .where('status', 'in', ['waiting', 'accepted'])
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        // Add new post to UI
      }
      if (change.type === 'modified') {
        // Update post in UI
      }
      if (change.type === 'removed') {
        // Remove post from UI
      }
    });
  });
```

---

## 📝 Summary

**Key Changes:**
1. ✅ New collection: `liveTaxiPosts` (replaces old posts)
2. ✅ New field: `serviceType` (taxi/delivery)
3. ✅ New fields: `pickupLocation`, `destinationLocation` (GPS coordinates)
4. ✅ Auto-expiration: 2 hours from creation
5. ✅ New collection: `liveTaxiApplications` (driver applications)

**Action Required:**
- Rename "Posts Management" to "Live Posts (Taxi/Delivery)" in sidebar
- Build new admin page for `liveTaxiPosts` collection
- Support both Taxi and Delivery service types
- Display map coordinates when available
- Handle expiration logic
- Manage driver applications

**Collection Name (EXACT):**
- ✅ `liveTaxiPosts` (lowercase 'l', camelCase, plural)
- ✅ `liveTaxiApplications` (lowercase 'l', camelCase, plural)

---

*Last Updated: November 6, 2025*
*Mobile App Version: 1.0.0*
