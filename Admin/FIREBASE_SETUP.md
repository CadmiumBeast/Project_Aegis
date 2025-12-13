# Firebase Integration Setup Guide

## Overview
The Admin Dashboard has been integrated with Firebase Firestore to display real-time incident data. The design remains unchanged - only the data source has been updated.

## Setup Instructions

### 1. Create a Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com/)
- Click "Create Project"
- Name it (e.g., "Project-Aegis")
- Accept the terms and create the project

### 2. Create a Firestore Database
- In Firebase Console, go to **Build** > **Firestore Database**
- Click **Create database**
- Choose a location and start in **production mode** (or test mode for development)
- Create the database

### 3. Configure Environment Variables
- Copy `.env.example` to `.env.local`
- Fill in your Firebase credentials from the Firebase Console:
  - Go to **Project Settings** (gear icon)
  - Copy credentials from the "Your apps" section or "Service accounts" tab
  - Paste them into `.env.local`

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Create Firestore Collection Structure
Create a collection called `incidents` with documents following this structure:

```json
{
  "id": "INC-0100",
  "type": "FLOOD",
  "severity": 1,
  "status": "NEW",
  "timestamp": "Firestore Timestamp",
  "location": {
    "lat": 6.7656,
    "lng": 80.3515
  },
  "responder": "RSP-0001",
  "locationName": "Area Name",
  "description": "Incident description",
  "photo_url": "https://example.com/photo.jpg",
  "acknowledgedAt": "Firestore Timestamp (optional)"
}
```

### 5. Set Firestore Security Rules
For development, you can use these rules (update for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /incidents/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Data Mapping
The component automatically converts Firebase documents to the expected format:
- `timestamp`: Firestore Timestamp objects are converted to JavaScript Date objects
- `location`: Expected as an object with `lat` and `lng` properties
- `status`: "NEW" or "ACK" (Acknowledged)
- `severity`: 1-5 (where 1-2 are critical, 3 is moderate, 4-5 are low)

## Fallback Behavior
If Firebase is not properly configured or connection fails:
- The app falls back to mock data automatically
- A console error is logged for debugging
- The UI remains fully functional

## Real-time Updates
The dashboard uses Firebase's `onSnapshot` listener for real-time updates:
- New incidents appear automatically
- Status changes update in real-time
- No polling needed - data updates instantly

## Acknowledging Incidents
When an incident is acknowledged:
1. Status changes from "NEW" to "ACK" in the database
2. An `acknowledgedAt` timestamp is recorded
3. Changes sync across all connected clients in real-time

## Troubleshooting
- Check browser console for Firebase errors
- Verify `.env.local` has correct credentials
- Ensure Firestore database is created and accessible
- Check Firestore security rules allow your domain
- For development, consider using test mode with permissive rules
