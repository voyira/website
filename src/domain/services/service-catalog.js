export const serviceIds = Object.freeze(['web', 'custom', 'mobile', 'ecommerce', 'other']);

export function isServiceId(value) {
  return serviceIds.includes(value);
}
