const fs = require('fs');

const employerJs = fs.readFileSync('js/employer.js', 'utf8');
const skillsDataJs = fs.readFileSync('js/skills-data.js', 'utf8');

// Mock DOM
global.window = { location: { href: '' } };
global.localStorage = { getItem: () => null };
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
global.console = { log: () => {}, warn: () => {}, error: () => {} }; // Silence standard logs
global.alert = () => {};

try {
  eval(skillsDataJs);
  eval(employerJs);
  
  // Call the setup function explicitly if it's there
  if (typeof setupJobSkillsGrid === 'function') {
    setupJobSkillsGrid();
    process.stdout.write('Grid innerHTML after setup:\n' + global.mockGrid.innerHTML);
  } else {
    process.stdout.write('setupJobSkillsGrid is not defined!\n');
  }
} catch (e) {
  process.stdout.write('Error during eval: ' + e + '\n');
}
