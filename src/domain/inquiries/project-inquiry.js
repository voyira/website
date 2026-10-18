import { isServiceId } from '../services/service-catalog.js';

export const inquiryConstraints = Object.freeze({
  name: Object.freeze({ min: 1, max: 100 }),
  email: Object.freeze({ min: 1, max: 200 }),
  message: Object.freeze({ min: 10, max: 5000 }),
});

export class InvalidProjectInquiry extends Error {
  constructor(field) {
    super(`Invalid project inquiry: ${field}`);
    this.name = 'InvalidProjectInquiry';
    this.field = field;
  }
}

function normalizeText(field, value) {
  if (typeof value !== 'string') throw new InvalidProjectInquiry(field);

  const normalized = value.trim();
  const { min, max } = inquiryConstraints[field];
  if (normalized.length < min || normalized.length > max) {
    throw new InvalidProjectInquiry(field);
  }
  return normalized;
}

export function createProjectInquiry({ name, email, message, serviceIds = [] }) {
  const normalizedName = normalizeText('name', name);
  const normalizedEmail = normalizeText('email', email);
  const normalizedMessage = normalizeText('message', message);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new InvalidProjectInquiry('email');
  }
  if (!Array.isArray(serviceIds) || serviceIds.some((id) => !isServiceId(id))) {
    throw new InvalidProjectInquiry('serviceIds');
  }

  return Object.freeze({
    name: normalizedName,
    email: normalizedEmail,
    message: normalizedMessage,
    serviceIds: Object.freeze([...new Set(serviceIds)]),
  });
}
