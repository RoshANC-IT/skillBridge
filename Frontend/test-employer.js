const fs = require('fs');
const { JSDOM } = require('jsdom');

const employerJs = fs.readFileSync('js/employer.js', 'utf8');
const skillsDataJs = fs.readFileSync('js/skills-data.js', 'utf8');

const html = '<!DOCTYPE html><html><body><div id="jobSkillsGrid"></div><div id="jobSkillsPills"></div></body></html>';
const dom = new JSDOM(html, { runScripts: 'dangerously' });

try {
  dom.window.eval(skillsDataJs);
  dom.window.eval(employerJs);
  console.log('Grid innerHTML length:', dom.window.document.getElementById('jobSkillsGrid').innerHTML.length);
} catch (e) {
  console.error('Error during eval:', e);
}
