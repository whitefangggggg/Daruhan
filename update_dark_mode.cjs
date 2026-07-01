const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.jsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'src'));

let replacements = [
  { search: /text-gray-900(?! dark:)/g, replace: 'text-gray-900 dark:text-white' },
  { search: /text-gray-800(?! dark:)/g, replace: 'text-gray-800 dark:text-gray-100' },
  { search: /text-gray-700(?! dark:)/g, replace: 'text-gray-700 dark:text-gray-200' },
  { search: /text-gray-600(?! dark:)/g, replace: 'text-gray-600 dark:text-gray-300' },
  { search: /text-gray-500(?! dark:)/g, replace: 'text-gray-500 dark:text-gray-400' },
  { search: /bg-white(?! dark:|\/)/g, replace: 'bg-white dark:bg-slate-800' },
  { search: /bg-gray-50(?! dark:|\/)/g, replace: 'bg-gray-50 dark:bg-slate-800\/50' },
  { search: /bg-gray-100(?! dark:|\/)/g, replace: 'bg-gray-100 dark:bg-slate-800' },
  { search: /border-gray-100(?! dark:|\/)/g, replace: 'border-gray-100 dark:border-slate-700' },
  { search: /border-gray-200(?! dark:|\/)/g, replace: 'border-gray-200 dark:border-slate-700' },
  { search: /border-emerald-100(?! dark:|\/)/g, replace: 'border-emerald-100 dark:border-emerald-900\/40' },
  { search: /bg-emerald-50(?! dark:|\/)/g, replace: 'bg-emerald-50 dark:bg-emerald-900\/20' },
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  replacements.forEach(({ search, replace }) => {
    newContent = newContent.replace(search, replace);
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});

console.log('Done!');
