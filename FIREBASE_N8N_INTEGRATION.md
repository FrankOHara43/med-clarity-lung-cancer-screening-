# Cancer Detection Web Application - Firebase & n8n Integration

## Architecture Overview

This document describes the service-layer architecture for integrating Firebase and n8n workflow automation in the Cancer Detection Web Application.

### Key Principles

1. **Strict Separation of Concerns**
   - Firebase: Authentication, Firestore database, Cloud Storage
   - n8n: Workflow automation via webhooks only
   - UI Pages: Consume services only, no direct Firebase/n8n calls

2. **Service-Layer Pattern**
   - All Firebase/n8n logic isolated in `src/lib/services/`
   - Reusable, strongly-typed service functions
   - Consistent error handling across all services

3. **Non-blocking Webhooks**
   - Firebase writes complete first
   - n8n webhooks are async, fire-and-forget
   - Webhook failures never block application logic

---

## Project Structure

```
src/lib/
├── firebase/                    # Firebase modules
│   ├── config.ts               # Firebase initialization
│   ├── auth.ts                 # Firebase Auth operations
│   ├── firestore.ts            # Firestore database operations
│   └── storage.ts              # Cloud Storage operations
├── services/                    # Business logic services
│   ├── authService.ts           # User authentication & profiles
│   ├── patientService.ts        # Patient CRUD + webhooks
│   ├── predictionService.ts     # ML predictions + webhooks
│   ├── reportService.ts         # Medical reports + webhooks
│   └── workflowService.ts       # n8n webhook triggers
├── types/
│   └── index.ts                 # TypeScript interfaces
├── validators/
│   └── patient.ts               # Zod validators
└── utils.ts
```

---

## Configuration

### Environment Variables

Set these in `.env` file:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# n8n Configuration
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/cancer-detection
```

---

## Firebase Modules

### `src/lib/firebase/config.ts`

Initializes Firebase app with modular SDK.

```typescript
import { auth, db, storage } from '@/lib/firebase/config';
```

**Exports:**
- `auth` - Firebase Auth instance
- `db` - Firestore instance
- `storage` - Cloud Storage instance

### `src/lib/firebase/auth.ts`

Low-level Firebase Authentication operations.

```typescript
import * as authModule from '@/lib/firebase/auth';

// Registration
const user = await authModule.registerUser(email, password);

// Sign in
const user = await authModule.loginUser(email, password);

// Sign out
await authModule.signOut();

// Subscribe to auth changes
const unsubscribe = authModule.subscribeToAuthChanges((user) => {
  console.log('Auth state changed:', user);
});

// Get current user
const user = authModule.getCurrentUser();

// Get token
const token = await authModule.getAuthToken();
```

### `src/lib/firebase/firestore.ts`

Firestore database operations with full type support.

```typescript
import * as firestore from '@/lib/firebase/firestore';

// Add document
const id = await firestore.addDocument('patients', patientData);

// Get single document
const patient = await firestore.getDocument<Patient>('patients', id);

// Get all documents
const patients = await firestore.getDocuments<Patient>('patients');

// Query with constraints
const results = await firestore.queryDocuments<Patient>('patients', [
  firestore.whereConstraint('age', '>', 30),
  firestore.orderByConstraint('createdAt', 'desc'),
  firestore.limitConstraint(10),
]);

// Update document
await firestore.updateDocument('patients', id, { age: 35 });

// Delete document
await firestore.deleteDocument('patients', id);

// Batch operations
await firestore.performBatchWrite([
  { type: 'set', collection: 'patients', id: 'p1', data: {...} },
  { type: 'update', collection: 'patients', id: 'p2', data: {...} },
  { type: 'delete', collection: 'patients', id: 'p3' },
]);
```

### `src/lib/firebase/storage.ts`

Cloud Storage file operations for patient documents and scans.

```typescript
import * as storage from '@/lib/firebase/storage';

// Upload file
const url = await storage.uploadFile('patients/p1/documents/report.pdf', file);

// Download file
const buffer = await storage.downloadFile('patients/p1/documents/report.pdf');

// Get download URL
const url = await storage.getFileUrl('patients/p1/documents/report.pdf');

// Delete file
await storage.deleteFile('patients/p1/documents/report.pdf');

// List files
const files = await storage.listFiles('patients/p1/documents');

// Patient-specific helpers
const url = await storage.uploadPatientDocument(patientId, 'report', file);
const url = await storage.uploadPatientScan(patientId, 'ct-scan', file);
const docs = await storage.getPatientDocuments(patientId);
const scans = await storage.getPatientScans(patientId);
```

---

## Service Layer

### `src/lib/services/authService.ts`

User authentication and profile management.

```typescript
import * as authService from '@/lib/services/authService';

// Register new user
const user = await authService.registerUser(
  email,
  password,
  displayName,
  'doctor' // role: 'doctor' | 'admin' | 'patient'
);

// Login user
const user = await authService.loginUser(email, password);

// Logout
await authService.signOutUser();

// Get current user
const user = await authService.getCurrentUser();

// Get user by ID
const user = await authService.getUserById(userId);

// Update user profile
await authService.updateUserProfile(userId, {
  displayName: 'Dr. John Doe',
  role: 'doctor',
});

// Subscribe to auth changes
const unsubscribe = authService.subscribeToAuth((user) => {
  // Update UI based on auth state
});
```

### `src/lib/services/patientService.ts`

Patient CRUD operations + file uploads.

```typescript
import * as patientService from '@/lib/services/patientService';
import { PatientRegistrationInput } from '@/lib/validators/patient';

// Create patient (triggers webhook)
const patientId = await patientService.createPatient({
  fullName: 'John Doe',
  age: 45,
  gender: 'male',
  symptoms: ['cough', 'chest pain'],
  medicalHistory: 'Smoking history 20 years',
});

// Get patient
const patient = await patientService.getPatient(patientId);

// Get all patients
const patients = await patientService.getAllPatients();

// Update patient
await patientService.updatePatient(patientId, {
  symptoms: ['persistent cough'],
});

// Update diagnosis status
await patientService.updatePatientStatus(patientId, 'in-progress');

// Get by status
const pending = await patientService.getPatientsByStatus('pending');

// Search by name
const results = await patientService.searchPatientsByName('John');

// Upload files
const url = await patientService.uploadPatientFile(patientId, 'scan', file);

// Get files
const docs = await patientService.getPatientDocuments(patientId);
const scans = await patientService.getPatientScans(patientId);

// Delete patient (admin)
await patientService.deletePatient(patientId);
```

### `src/lib/services/predictionService.ts`

ML prediction management + risk evaluation.

```typescript
import * as predictionService from '@/lib/services/predictionService';

// Save prediction (triggers webhooks)
const predictionId = await predictionService.savePrediction(
  patientId,
  'high', // riskLevel
  85,     // score (0-100)
  92,     // confidence (0-100)
  'v2.1',
  'CT-scan',
  'Multiple nodules detected'
);

// Get prediction
const prediction = await predictionService.getPrediction(predictionId);

// Get all predictions for patient
const predictions = await predictionService.getPatientPredictions(patientId);

// Get latest prediction
const latest = await predictionService.getLatestPatientPrediction(patientId);

// Get all high-risk
const highRisk = await predictionService.getHighRiskPredictions();

// Evaluate risk (utility function)
const risk = predictionService.evaluateRisk(75); // returns 'high'

// Get statistics
const stats = await predictionService.getPatientPredictionStats(patientId);
// {
//   totalPredictions: 3,
//   avgScore: 62.33,
//   highRiskCount: 1,
//   mediumRiskCount: 1,
//   lowRiskCount: 1
// }
```

### `src/lib/services/reportService.ts`

Medical report management + review workflow.

```typescript
import * as reportService from '@/lib/services/reportService';

// Create report
const reportId = await reportService.createReport(
  patientId,
  doctorId,
  'Patient presented with persistent cough...',
  'Initial assessment completed',
  'CT scan shows suspicious lesions',
  ['Further imaging recommended', 'Oncology consult']
);

// Get report
const report = await reportService.getReport(reportId);

// Get all patient reports
const reports = await reportService.getPatientReports(patientId);

// Get latest report
const latest = await reportService.getLatestPatientReport(patientId);

// Get doctor's reports
const doctorReports = await reportService.getDoctorReports(doctorId);

// Update status (triggers webhook if finalized)
await reportService.updateReportStatus(reportId, 'pending-review');
await reportService.updateReportStatus(reportId, 'reviewed');
await reportService.updateReportStatus(reportId, 'finalized');

// Get pending reviews
const pending = await reportService.getPendingReviews();

// Get finalized reports
const finalized = await reportService.getFinalizedReports();

// Get statistics
const stats = await reportService.getReportStats();
// {
//   totalReports: 10,
//   draftCount: 2,
//   pendingReviewCount: 3,
//   reviewedCount: 4,
//   finalizedCount: 1
// }
```

### `src/lib/services/workflowService.ts`

n8n webhook triggers - **Used internally by other services**.

```typescript
import {
  triggerPatientCreated,
  triggerPredictionCompleted,
  triggerHighRiskAlert,
  triggerReportFinalized,
  triggerCustomEvent,
} from '@/lib/services/workflowService';

// These are called automatically by other services:
// - patientService.createPatient() calls triggerPatientCreated()
// - predictionService.savePrediction() calls triggerPredictionCompleted()
// - predictionService.savePrediction() calls triggerHighRiskAlert() if high-risk
// - reportService.updateReportStatus() calls triggerReportFinalized()

// Custom webhook trigger (if needed)
await triggerCustomEvent('patient.imported', {
  patientId,
  importSource: 'legacy-system',
});
```

---

## Type Definitions

All types are in `src/lib/types/index.ts`:

```typescript
import {
  Patient,
  Prediction,
  Report,
  User,
  FirestorePatient,
  FirestorePrediction,
  FirestoreReport,
  PatientCreatedPayload,
  PredictionCompletedPayload,
  HighRiskAlertPayload,
  ReportFinalizedPayload,
  ServiceResponse,
  PaginatedResponse,
} from '@/lib/types';
```

---

## Validators

Patient registration form validation with Zod:

```typescript
import {
  patientRegistrationSchema,
  patientUpdateSchema,
  validatePatientRegistration,
  validatePatientUpdate,
  PatientRegistrationInput,
  PatientUpdateInput,
} from '@/lib/validators/patient';

// In a React component with react-hook-form:
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<PatientRegistrationInput>({
  resolver: zodResolver(patientRegistrationSchema),
});

// Or manual validation:
const result = validatePatientRegistration(data);
if (!result.success) {
  console.error(result.error.flatten());
}
```

---

## Firestore Collections Schema

### `patients/`

```typescript
{
  id: string;              // Firestore doc ID
  fullName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  symptoms: string[];
  diagnosisStatus: 'pending' | 'in-progress' | 'completed' | 'reviewed';
  medicalHistory?: string;
  allergies?: string[];
  currentMedications?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `predictions/`

```typescript
{
  id: string;              // Firestore doc ID
  patientId: string;       // Reference to patients/
  riskLevel: 'low' | 'medium' | 'high';
  score: number;           // 0-100
  confidence: number;      // 0-100
  modelVersion: string;
  scanType?: string;
  findings?: string;
  recommendations?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `reports/`

```typescript
{
  id: string;              // Firestore doc ID
  patientId: string;       // Reference to patients/
  doctorId: string;        // Reference to users/
  status: 'draft' | 'pending-review' | 'reviewed' | 'finalized';
  doctorNote: string;
  summary?: string;
  findings?: string;
  recommendations?: string[];
  attachments?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  reviewedAt?: Timestamp;
}
```

### `users/`

```typescript
{
  id: string;              // Firebase Auth UID
  email: string;
  displayName?: string;
  role: 'doctor' | 'admin' | 'patient';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## n8n Webhooks

### Webhook Events & Payloads

#### 1. Patient Created

**Event:** `patient.created`

**Trigger:** When `patientService.createPatient()` completes

**Payload:**
```json
{
  "event": "patient.created",
  "data": {
    "patientId": "abc123",
    "fullName": "John Doe",
    "createdAt": "2024-03-17T10:30:00Z"
  },
  "timestamp": "2024-03-17T10:30:00Z"
}
```

#### 2. Prediction Completed

**Event:** `prediction.completed`

**Trigger:** When `predictionService.savePrediction()` completes (any risk level)

**Payload:**
```json
{
  "event": "prediction.completed",
  "data": {
    "patientId": "abc123",
    "riskLevel": "high",
    "score": 85
  },
  "timestamp": "2024-03-17T11:45:00Z"
}
```

#### 3. High-Risk Alert

**Event:** `case.high_risk_alert`

**Trigger:** When `predictionService.savePrediction()` completes with `riskLevel: 'high'`

**Payload:**
```json
{
  "event": "case.high_risk_alert",
  "data": {
    "patientId": "abc123",
    "riskLevel": "high",
    "score": 85,
    "timestamp": "2024-03-17T11:45:00Z"
  },
  "timestamp": "2024-03-17T11:45:00Z",
  "priority": "urgent"
}
```

#### 4. Report Finalized

**Event:** `report.finalized`

**Trigger:** When `reportService.updateReportStatus(reportId, 'finalized')` completes

**Payload:**
```json
{
  "event": "report.finalized",
  "data": {
    "reportId": "report123",
    "patientId": "abc123",
    "status": "finalized",
    "doctorNote": "Patient presented with persistent cough..."
  },
  "timestamp": "2024-03-17T12:00:00Z"
}
```

---

## Example: Patient Registration Flow

### 1. Component

```typescript
// src/pages/PatientsPage.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientRegistrationSchema } from '@/lib/validators/patient';
import * as patientService from '@/lib/services/patientService';

export function PatientRegistrationForm() {
  const form = useForm({
    resolver: zodResolver(patientRegistrationSchema),
  });

  const onSubmit = async (data) => {
    try {
      // Call service - handles Firebase + webhook
      const patientId = await patientService.createPatient(data);

      // Firebase patient created ✓
      // Webhook triggered asynchronously ✓
      // UI updates
      toast.success(`Patient ${data.fullName} registered`);
    } catch (error) {
      toast.error('Failed to register patient');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### 2. Service Layer Flow

```
patientService.createPatient(data)
  ↓
1. Validate with Zod
  ↓
2. Create patient in Firestore ✓ (blocking)
  ↓
3. Trigger webhook: patient.created (non-blocking)
  ↓
Return patientId
```

### 3. n8n Workflow

n8n receives POST to webhook URL with patient data.
Workflow can send emails, SMS, store in external DB, etc.

---

## Error Handling Pattern

All services follow consistent error handling:

```typescript
try {
  // Firebase operation
  const result = await firestore.getDocument('patients', id);
  
  // If webhook fails, it's caught but doesn't throw
  await triggerWebhook(...);
  
  return result;
} catch (error) {
  console.error('Service error:', error);
  throw error; // Let caller handle
}
```

**Key principle:** Firebase writes complete before webhooks fire.

---

## Usage in React Components

### Example 1: List Patients

```typescript
import { useEffect, useState } from 'react';
import * as patientService from '@/lib/services/patientService';
import { FirestorePatient } from '@/lib/types';

export function PatientList() {
  const [patients, setPatients] = useState<FirestorePatient[]>([]);

  useEffect(() => {
    const loadPatients = async () => {
      const data = await patientService.getAllPatients();
      setPatients(data);
    };

    loadPatients();
  }, []);

  return (
    <div>
      {patients.map((patient) => (
        <div key={patient.id}>
          <h3>{patient.fullName}</h3>
          <p>Age: {patient.age}</p>
          <p>Status: {patient.diagnosisStatus}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Show Latest Prediction

```typescript
import { useEffect, useState } from 'react';
import * as predictionService from '@/lib/services/predictionService';
import { FirestorePrediction } from '@/lib/types';

export function LatestPrediction({ patientId }: { patientId: string }) {
  const [prediction, setPrediction] = useState<FirestorePrediction | null>(null);

  useEffect(() => {
    const loadPrediction = async () => {
      const data = await predictionService.getLatestPatientPrediction(patientId);
      setPrediction(data);
    };

    loadPrediction();
  }, [patientId]);

  if (!prediction) return <p>No predictions yet</p>;

  return (
    <div className={`risk-${prediction.riskLevel}`}>
      <p>Risk Level: {prediction.riskLevel.toUpperCase()}</p>
      <p>Score: {prediction.score}/100</p>
      <p>Confidence: {prediction.confidence}%</p>
    </div>
  );
}
```

---

## Best Practices

### ✅ Do

- Import services in components: `import * as patientService from '@/lib/services/patientService'`
- Use TypeScript interfaces from `@/lib/types`
- Validate user input with Zod schemas before service calls
- Catch errors in components and show user feedback
- Let webhooks fail silently (they're non-blocking)

### ❌ Don't

- Call Firebase directly in components
- Call n8n webhooks from components
- Use `any` types - leverage typing system
- Block UI waiting for webhook responses
- Create new service functions outside `src/lib/services/`

---

## Testing

Example unit test for prediction service:

```typescript
import { describe, it, expect, vi } from 'vitest';
import * as predictionService from '@/lib/services/predictionService';
import * as firestore from '@/lib/firebase/firestore';

vi.mock('@/lib/firebase/firestore');
vi.mock('@/lib/services/workflowService');

describe('predictionService', () => {
  it('should save prediction and trigger webhooks', async () => {
    vi.mocked(firestore.addDocument).mockResolvedValue('pred123');

    const id = await predictionService.savePrediction(
      'pat123',
      'high',
      85,
      92,
      'v2.1'
    );

    expect(id).toBe('pred123');
    expect(firestore.addDocument).toHaveBeenCalled();
  });
});
```

---

## Common Patterns

### Pattern 1: Create and Return ID

```typescript
const id = await patientService.createPatient(data);
console.log('Created:', id);
```

### Pattern 2: Get and Transform

```typescript
const patient = await patientService.getPatient(patientId);
const age = patient?.age ?? 0;
```

### Pattern 3: List with Filter

```typescript
const pending = await patientService.getPatientsByStatus('pending');
pending.forEach(p => console.log(p.fullName));
```

### Pattern 4: Batch Update

```typescript
await Promise.all([
  patientService.updatePatientStatus(p1, 'in-progress'),
  patientService.updatePatientStatus(p2, 'in-progress'),
]);
```

---

## Troubleshooting

### Webhook not firing

1. Check `VITE_N8N_WEBHOOK_URL` is set in `.env`
2. Check n8n instance is running
3. Check browser console for webhook errors
4. Webhook failures are logged but don't block operations

### Firestore queries return empty

1. Verify collection name matches exactly
2. Check where constraints match actual field names
3. Ensure documents exist in collection
4. Check Firestore security rules allow reads

### Firebase auth not working

1. Verify credentials in `.env` are correct
2. Check Firebase project has Auth enabled
3. Check Auth providers are configured in Firebase Console
4. Verify app domain is authorized

---

## Next Steps

1. **Update Firebase rules** in Firebase Console security section
2. **Configure n8n workflows** to handle incoming webhooks
3. **Create tests** for all service functions
4. **Add error boundaries** in React components
5. **Implement audit logging** for sensitive operations

---

**Last Updated:** March 17, 2026
