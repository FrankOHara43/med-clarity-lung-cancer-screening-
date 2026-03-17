/**
 * Service Layer Exports
 * 
 * This barrel file exports all services for clean imports in React components.
 * 
 * Usage in components:
 * import * as patientService from '@/lib/services/patientService';
 * import * as predictionService from '@/lib/services/predictionService';
 * 
 * Or for multiple services:
 * import * as services from '@/lib/services';
 * services.patientService.getPatient(id);
 */

export * as authService from './authService';
export * as patientService from './patientService';
export * as predictionService from './predictionService';
export * as reportService from './reportService';
export * as workflowService from './workflowService';
