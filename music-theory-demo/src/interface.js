(() => {
  const curriculum = document.querySelector('.grade-five-page .curriculum');
  if (!curriculum) return;
  const sections = [...curriculum.querySelectorAll('.curriculum-section')];
  if (sections.length < 2) return;

  const navigation = document.createElement('nav');
  navigation.className = 'curriculum-tabs';
  navigation.setAttribute('aria-label', 'Grade 5 subject areas');

  const select = index => {
    [...navigation.children].forEach((button, buttonIndex) => {
      const selected = buttonIndex === index;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
  };

  sections.forEach((section, index) => {
    section.hidden = false;
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.textContent = section.querySelector('h2')?.textContent || `Section ${index + 1}`;
    button.addEventListener('click', () => {
      section.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      select(index);
    });
    navigation.append(button);
  });

  curriculum.before(navigation);
  select(0);
})();
