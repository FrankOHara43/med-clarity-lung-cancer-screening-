# Quick Start Guide - Using the Service Layer

## For New Developers: Start Here

This guide shows you how to use the Firebase & n8n integration in your React components.

---

## 1. Import Services

```typescript
// Import specific service
import * as patientService from '@/lib/services/patientService';

// Or import all services at once
import { patientService, predictionService, reportService } from '@/lib/services';

// Or use individual functions
import { createPatient, getPatient, getAllPatients } from '@/lib/services/patientService';
```

---

## 2. Use In Components

### List All Patients
```typescript
import { useEffect, useState } from 'react';
import * as patientService from '@/lib/services/patientService';
import { FirestorePatient } from '@/lib/types';

export function PatientsPage() {
  const [patients, setPatients] = useState<FirestorePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        const data = await patientService.getAllPatients();
        setPatients(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patients');
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

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

### Register New Patient (With Form Validation)
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientRegistrationSchema } from '@/lib/validators/patient';
import * as patientService from '@/lib/services/patientService';
import { toast } from 'sonner';

export function RegisterPatientForm() {
  const form = useForm({
    resolver: zodResolver(patientRegistrationSchema),
    defaultValues: {
      fullName: '',
      age: 0,
      gender: 'male',
      symptoms: [],
    },
  });

  const onSubmit = async (data) => {
    try {
      // Service automatically:
      // 1. Creates patient in Firestore ✓
      // 2. Triggers webhook (patient.created) ✓
      const patientId = await patientService.createPatient(data);

      toast.success(`Patient ${data.fullName} registered (ID: ${patientId})`);
      form.reset();
    } catch (error) {
      toast.error('Failed to register patient');
      console.error(error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('fullName')} placeholder="Full Name" />
      <input {...form.register('age', { valueAsNumber: true })} type="number" />
      <select {...form.register('gender')}>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      {/* More fields */}
      <button type="submit">Register Patient</button>
    </form>
  );
}
```

### Show Patient Details
```typescript
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as patientService from '@/lib/services/patientService';
import * as predictionService from '@/lib/services/predictionService';
import * as reportService from '@/lib/services/reportService';
import { FirestorePatient, FirestorePrediction, FirestoreReport } from '@/lib/types';

export function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<FirestorePatient | null>(null);
  const [prediction, setPrediction] = useState<FirestorePrediction | null>(null);
  const [report, setReport] = useState<FirestoreReport | null>(null);

  useEffect(() => {
    if (!patientId) return;

    const loadData = async () => {
      try {
        const [p, pred, rep] = await Promise.all([
          patientService.getPatient(patientId),
          predictionService.getLatestPatientPrediction(patientId),
          reportService.getLatestPatientReport(patientId),
        ]);

        setPatient(p);
        setPrediction(pred);
        setReport(rep);
      } catch (error) {
        console.error('Failed to load patient data:', error);
      }
    };

    loadData();
  }, [patientId]);

  if (!patient) return <div>Loading...</div>;

  return (
    <div>
      <h1>{patient.fullName}</h1>
      <p>Age: {patient.age} | Gender: {patient.gender}</p>
      <p>Status: {patient.diagnosisStatus}</p>

      {prediction && (
        <div className={`risk-${prediction.riskLevel}`}>
          <h3>Latest Prediction</h3>
          <p>Risk: {prediction.riskLevel.toUpperCase()}</p>
          <p>Score: {prediction.score}/100</p>
        </div>
      )}

      {report && (
        <div>
          <h3>Latest Report</h3>
          <p>Status: {report.status}</p>
          <p>{report.doctorNote}</p>
        </div>
      )}
    </div>
  );
}
```

### Save ML Prediction
```typescript
import * as predictionService from '@/lib/services/predictionService';
import { toast } from 'sonner';

export function RunPredictionButton({ patientId }: { patientId: string }) {
  const handleRunPrediction = async () => {
    try {
      // In real app, this would call your ML model API first
      const mlScore = await callMLModel(patientId);

      // Evaluate risk based on score
      const riskLevel = predictionService.evaluateRisk(mlScore);

      // Save prediction - automatically triggers webhooks:
      // - prediction.completed webhook
      // - if high-risk: case.high_risk_alert webhook (URGENT)
      const predictionId = await predictionService.savePrediction(
        patientId,
        riskLevel,
        mlScore,
        95, // confidence
        'model-v2.1',
        'CT-scan',
        'Multiple nodules detected in upper lobe'
      );

      if (riskLevel === 'high') {
        toast.error('⚠️ High-risk case detected! Alert sent.', { duration: 5000 });
      } else if (riskLevel === 'medium') {
        toast.warning('⚠️ Medium risk detected.');
      } else {
        toast.success('✓ Low risk.');
      }
    } catch (error) {
      toast.error('Prediction failed');
    }
  };

  return <button onClick={handleRunPrediction}>Run Prediction</button>;
}

async function callMLModel(patientId: string): Promise<number> {
  // TODO: Call your ML model API
  return Math.random() * 100;
}
```

### Create & Finalize Report
```typescript
import * as reportService from '@/lib/services/reportService';
import { toast } from 'sonner';

export function FinalizeReportButton({
  reportId,
  doctorId,
}: {
  reportId: string;
  doctorId: string;
}) {
  const handleFinalize = async () => {
    try {
      // Update status to finalized
      // This automatically triggers report.finalized webhook
      await reportService.updateReportStatus(reportId, 'finalized');

      toast.success('Report finalized and webhook sent to n8n');
    } catch (error) {
      toast.error('Failed to finalize report');
    }
  };

  return <button onClick={handleFinalize}>Finalize Report</button>;
}
```

### Get Statistics
```typescript
import { useEffect, useState } from 'react';
import * as predictionService from '@/lib/services/predictionService';
import * as reportService from '@/lib/services/reportService';

export function StatisticsPanel() {
  const [predictionStats, setPredictionStats] = useState(null);
  const [reportStats, setReportStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const [pStats, rStats] = await Promise.all([
        // Get stats for specific patient
        predictionService.getPatientPredictionStats('patient-123'),
        // Get overall report stats
        reportService.getReportStats(),
      ]);

      setPredictionStats(pStats);
      setReportStats(rStats);
    };

    loadStats();
  }, []);

  return (
    <div>
      {predictionStats && (
        <div>
          <h3>Predictions</h3>
          <p>Total: {predictionStats.totalPredictions}</p>
          <p>High Risk: {predictionStats.highRiskCount}</p>
          <p>Avg Score: {predictionStats.avgScore}</p>
        </div>
      )}

      {reportStats && (
        <div>
          <h3>Reports</h3>
          <p>Total: {reportStats.totalReports}</p>
          <p>Pending: {reportStats.pendingReviewCount}</p>
          <p>Finalized: {reportStats.finalizedCount}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 3. Common Patterns

### Loading State
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const load = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await someService.getData();
    // use data
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    setLoading(false);
  }
};
```

### Error Handling
```typescript
const handleAction = async () => {
  try {
    await someService.doSomething();
    toast.success('Success!');
  } catch (error) {
    console.error('Error:', error);
    toast.error(
      error instanceof Error ? error.message : 'An error occurred'
    );
  }
};
```

### Multiple Data Fetch
```typescript
const [patient, setPat] = useState(null);
const [predictions, setPreds] = useState([]);

useEffect(() => {
  const load = async () => {
    // Fetch in parallel
    const [p, preds] = await Promise.all([
      patientService.getPatient(id),
      predictionService.getPatientPredictions(id),
    ]);

    setPat(p);
    setPreds(preds);
  };

  load();
}, [id]);
```

---

## 4. Type Safety

Always use types from `@/lib/types`:

```typescript
import {
  Patient,
  FirestorePatient,
  Prediction,
  FirestorePrediction,
  Report,
  FirestoreReport,
} from '@/lib/types';

// Component using types
interface PatientListProps {
  patients: FirestorePatient[]; // ← typed
  onSelect: (patient: FirestorePatient) => void;
}

export function PatientList({ patients, onSelect }: PatientListProps) {
  return (
    <ul>
      {patients.map((p) => (
        // p is fully typed - autocomplete works
        <li key={p.id} onClick={() => onSelect(p)}>
          {p.fullName}
        </li>
      ))}
    </ul>
  );
}
```

---

## 5. Validation

Always validate form input:

```typescript
import { patientRegistrationSchema } from '@/lib/validators/patient';

const form = useForm({
  resolver: zodResolver(patientRegistrationSchema),
});

// Invalid data is rejected by the schema
// form.errors will show validation messages
```

---

## 6. What Happens Automatically

When you use these services:

### `patientService.createPatient()`
1. ✓ Patient document created in Firestore
2. ✓ `patient.created` webhook sent to n8n
3. ✓ Returns patient ID

### `predictionService.savePrediction()`
1. ✓ Prediction document saved to Firestore
2. ✓ `prediction.completed` webhook sent to n8n
3. ✓ If riskLevel='high': `case.high_risk_alert` webhook sent (URGENT)
4. ✓ Returns prediction ID

### `reportService.updateReportStatus(reportId, 'finalized')`
1. ✓ Report status updated in Firestore
2. ✓ `report.finalized` webhook sent to n8n
3. ✓ No return value

---

## 7. Don't Do This ❌

```typescript
// ❌ WRONG: Never call Firebase directly
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const data = await getDoc(doc(db, 'patients', id));

// ❌ WRONG: Never trigger webhooks from components
fetch('https://n8n.example.com/webhook/...');

// ❌ WRONG: Never skip validation
const patient = await patientService.createPatient(userInput); // No validation!

// ❌ WRONG: Never use 'as any'
const data: any = await someFunction();
```

---

## 8. Do This Instead ✅

```typescript
// ✅ RIGHT: Use the service
const patient = await patientService.getPatient(id);

// ✅ RIGHT: Webhooks are automatic
await patientService.createPatient(validatedData); // Triggers webhook automatically

// ✅ RIGHT: Always validate
const result = validatePatientRegistration(userInput);
if (!result.success) {
  console.error(result.error);
} else {
  await patientService.createPatient(result.data);
}

// ✅ RIGHT: Use TypeScript types
const patient: FirestorePatient = await patientService.getPatient(id);
```

---

## Ready to Code?

1. Check [FIREBASE_N8N_INTEGRATION.md](FIREBASE_N8N_INTEGRATION.md) for complete API docs
2. Look at the examples above
3. Start building your pages using the services
4. Never call Firebase/n8n directly
5. Always validate user input
6. Always handle errors

---

**Happy coding!** 🚀
