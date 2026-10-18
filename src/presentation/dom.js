export function requireElement(root, selector) {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`Required page element is missing: ${selector}`);
  return element;
}
