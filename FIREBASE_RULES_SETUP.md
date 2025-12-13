# 🔥 Firebase Security Rules Setup

## Error: "Missing or insufficient permissions"

This means your Firestore database needs security rules configured.

## Quick Fix (For Development/Hackathon)

### Option 1: Firebase Console (Recommended for Hackathon)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `aegis-49b49`
3. **Click "Firestore Database"** in the left menu
4. **Click the "Rules" tab**
5. **Replace the rules with this**:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to responderReports collection
    match /responderReports/{document=**} {
      allow read, write: if true;
    }
    
    // Allow all other collections (for hackathon purposes)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. **Click "Publish"**

### Option 2: Production-Ready Rules (After Hackathon)

For a production app, use these more secure rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Responder reports - authenticated users can write, anyone can read
    match /responderReports/{reportId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Admin-only collections
    match /admins/{adminId} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## Firebase Storage Rules

Also set up Storage rules for photo uploads:

1. **Click "Storage"** in Firebase Console
2. **Click "Rules" tab**
3. **Replace with**:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /reports/{allPaths=**} {
      // Allow anyone to read
      allow read: if true;
      // Allow authenticated users to write
      allow write: if request.auth != null;
    }
  }
}
```

4. **Click "Publish"**

## Verify It's Working

1. Refresh your Responder app (http://localhost:5173/)
2. Submit a test report
3. Check the browser console - you should see:
   - `✅ Report saved! Syncing to server...`
   - `✅ 1 report(s) synced to server!`
4. Open Admin HQ (http://localhost:5174/hq/login)
5. You should see the report appear in real-time!

## Troubleshooting

### Still seeing permission errors?
- Make sure you clicked "Publish" in Firebase Console
- Wait 10-20 seconds for rules to propagate
- Hard refresh your browser (Ctrl + Shift + R)

### Can't access Firebase Console?
- Make sure you're logged in with the correct Google account
- Check that you have owner/editor permissions on the project

---

**For Hackathon**: Use Option 1 (open rules) to get things working quickly!
**After Hackathon**: Switch to Option 2 (secure rules) before deploying to production.
