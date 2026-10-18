export async function copyText(text) {
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable');
  await navigator.clipboard.writeText(text);
}
