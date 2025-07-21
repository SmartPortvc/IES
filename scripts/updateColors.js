import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colorMappings = {
  'blue-50': 'seagreen-50',
  'blue-100': 'seagreen-100',
  'blue-200': 'seagreen-200',
  'blue-300': 'seagreen-300',
  'blue-400': 'seagreen-400',
  'blue-500': 'seagreen-500',
  'blue-600': 'seagreen-600',
  'blue-700': 'seagreen-700',
  'blue-800': 'seagreen-800',
  'blue-900': 'seagreen-900'
};

function updateColors(content) {
  let updatedContent = content;
  Object.entries(colorMappings).forEach(([oldColor, newColor]) => {
    const regex = new RegExp(`\\b${oldColor}\\b`, 'g');
    updatedContent = updatedContent.replace(regex, newColor);
  });
  return updatedContent;
}

function processFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const updatedContent = updateColors(content);
  writeFileSync(filePath, updatedContent);
}

function walkDir(dir) {
  const files = readdirSync(dir);
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.match(/\.(tsx|jsx|ts|js)$/)) {
      processFile(filePath);
    }
  });
}

// Get the project root directory
const projectRoot = join(__dirname, '..');
walkDir(join(projectRoot, 'src'));