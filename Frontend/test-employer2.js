const fs = require('fs');

const employerJs = fs.readFileSync('js/employer.js', 'utf8');
const skillsDataJs = fs.readFileSync('js/skills-data.js', 'utf8');

// Mock DOM
global.window = {};
global.document = {
  getElementById: (id) => {
    if (id === 'jobSkillsGrid') return global.mockGrid;
    if (id === 'jobSkillsPills') return global.mockPills;
    return null;
  },
  addEventListener: () => {},
  querySelectorAll: () => []
};
global.mockGrid = { innerHTML: '', addEventListener: () => {} };
global.mockPills = { innerHTML: '' };
global.console = console;

try {
  eval(skillsDataJs);
  eval(employerJs);
  
  // Call the setup function explicitly if it's there
  if (typeof setupJobSkillsGrid === 'function') {
    setupJobSkillsGrid();
    console.log('Grid innerHTML after setup:\n', global.mockGrid.innerHTML);
  } else {
    console.log('setupJobSkillsGrid is not defined!');
  }
} catch (e) {
  console.error('Error during eval:', e);
}
