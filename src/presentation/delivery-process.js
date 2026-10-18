import { requireElement } from './dom.js';

const previousKeys = new Set(['ArrowLeft', 'ArrowUp']);
const nextKeys = new Set(['ArrowRight', 'ArrowDown']);

export function initializeDeliveryProcess(root, languageService, localizedSteps) {
  const tabs = [...root.querySelectorAll('[data-step]')];
  const panel = requireElement(root, '#process-panel');
  const label = requireElement(root, '.panel-label');
  const title = requireElement(root, '#process-title');
  const body = requireElement(root, '#process-body');
  const deliverables = requireElement(root, '#process-deliverables');
  let selectedIndex = 0;

  function render() {
    const step = localizedSteps[languageService.getLanguage()][selectedIndex];
    label.textContent = step.label;
    title.textContent = step.title;
    body.textContent = step.body;
    deliverables.replaceChildren(
      ...step.tags.map((tag) => {
        const element = root.ownerDocument.createElement('span');
        element.textContent = tag;
        return element;
      }),
    );
    tabs.forEach((tab, index) => {
      const isSelected = index === selectedIndex;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tabs[selectedIndex].id);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      selectedIndex = index;
      render();
    });
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'Home') selectedIndex = 0;
      else if (event.key === 'End') selectedIndex = tabs.length - 1;
      else if (previousKeys.has(event.key))
        selectedIndex = (selectedIndex - 1 + tabs.length) % tabs.length;
      else if (nextKeys.has(event.key)) selectedIndex = (selectedIndex + 1) % tabs.length;
      else return;

      event.preventDefault();
      render();
      tabs[selectedIndex].focus();
    });
  });
  languageService.subscribe(render);
  render();
}
