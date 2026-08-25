(() => {
  const curriculum = document.querySelector('.grade-five-page .curriculum');
  if (!curriculum) return;
  const sections = [...curriculum.querySelectorAll('.curriculum-section')];
  if (sections.length < 2) return;

  const navigation = document.createElement('nav');
  navigation.className = 'curriculum-tabs';
  const activeGrade = document.body?.dataset?.grade;
  navigation.setAttribute('aria-label', activeGrade ? `Grade ${activeGrade} subject areas` : 'Grade subject areas');
  const rail = document.createElement('div');
  rail.className = 'curriculum-tabs-rail';

  const select = index => {
    [...navigation.children].forEach((button, buttonIndex) => {
      const selected = buttonIndex === index;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    navigation.children[index]?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  };

  const activate = index => {
    const boundedIndex = (index + sections.length) % sections.length;
    sections[boundedIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    select(boundedIndex);
    navigation.children[boundedIndex]?.focus({ preventScroll: true });
  };

  sections.forEach((section, index) => {
    section.hidden = false;
    section.id ||= `grade-subject-${index + 1}`;
    section.setAttribute('role', 'tabpanel');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.id = `grade-subject-tab-${index + 1}`;
    button.setAttribute('aria-controls', section.id);
    section.setAttribute('aria-labelledby', button.id);
    button.textContent = section.querySelector('h2')?.textContent || `Section ${index + 1}`;
    button.addEventListener('click', () => {
      section.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      select(index);
    });
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const targetIndex = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? sections.length - 1
          : index + (event.key === 'ArrowRight' ? 1 : -1);
      activate(targetIndex);
    });
    navigation.append(button);
  });

  rail.append(navigation);
  curriculum.before(rail);
  select(0);
})();
