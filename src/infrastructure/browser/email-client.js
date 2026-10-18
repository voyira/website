export function openEmailDraft(href) {
  const link = document.createElement('a');
  link.href = href;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
}
