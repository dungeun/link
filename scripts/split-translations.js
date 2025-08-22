#!/usr/bin/env node

/**
 * Script to split large translation files into smaller category-based chunks
 * This reduces memory usage during build and runtime
 */

const fs = require('fs');
const path = require('path');

// Input file paths
const UI_TEXTS_PATH = path.join(__dirname, '../src/lib/translations/all-ui-texts.ts');
const TRANSLATIONS_PATH = path.join(__dirname, '../src/lib/translations/all-translations.ts');

// Output directory
const CHUNKS_DIR = path.join(__dirname, '../src/lib/translations/chunks');

// Create chunks directory if it doesn't exist
if (!fs.existsSync(CHUNKS_DIR)) {
  fs.mkdirSync(CHUNKS_DIR, { recursive: true });
}

/**
 * Parse the translation file and extract the array
 */
function parseTranslationFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract the array content between export const ALL_TRANSLATIONS = [ and the final ];
    const match = content.match(/export const ALL_TRANSLATIONS = \[([\s\S]*?)\];/);
    if (!match) {
      console.error(`Could not parse translation array from ${filePath}`);
      return [];
    }

    // Parse the JSON array
    const jsonString = '[' + match[1] + ']';
    // Fix any trailing commas before parsing
    const cleanedJson = jsonString.replace(/,(\s*[}\]])/g, '$1');
    
    try {
      return JSON.parse(cleanedJson);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      // Try eval as fallback (less safe but handles more cases)
      return eval('(' + cleanedJson + ')');
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

/**
 * Group translations by category
 */
function groupByCategory(translations) {
  const grouped = {};
  
  translations.forEach(item => {
    const category = item.category || 'common';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });
  
  return grouped;
}

/**
 * Write chunk files
 */
function writeChunkFiles(groupedTranslations, sourceFile) {
  const stats = [];
  
  Object.entries(groupedTranslations).forEach(([category, items]) => {
    const fileName = `${category}-translations.js`;
    const filePath = path.join(CHUNKS_DIR, fileName);
    
    // Create ES module export
    const content = `// Auto-generated translation chunk: ${category}
// Source: ${sourceFile}
// Items: ${items.length}
// Generated: ${new Date().toISOString()}

export default ${JSON.stringify(items, null, 2)};
`;
    
    fs.writeFileSync(filePath, content);
    
    const size = Buffer.byteLength(content, 'utf8');
    stats.push({
      category,
      items: items.length,
      size: (size / 1024).toFixed(2) + ' KB',
      file: fileName
    });
    
    console.log(`✓ Created ${fileName} (${items.length} items, ${(size / 1024).toFixed(2)} KB)`);
  });
  
  return stats;
}

/**
 * Create index file for chunks
 */
function createIndexFile(categories) {
  const indexContent = `// Auto-generated index for translation chunks
// Generated: ${new Date().toISOString()}

export const AVAILABLE_CHUNKS = ${JSON.stringify(categories, null, 2)};

// Export type for available categories
export type TranslationCategory = ${categories.map(c => `'${c}'`).join(' | ')};

// Chunk metadata
export const CHUNK_METADATA = {
${categories.map(c => `  '${c}': () => import('./${c}-translations.js')`).join(',\n')}
};
`;

  fs.writeFileSync(path.join(CHUNKS_DIR, 'index.js'), indexContent);
  console.log('✓ Created chunk index file');
}

/**
 * Main function
 */
function main() {
  console.log('Starting translation file splitting...\n');
  
  let allStats = [];
  
  // Process all-ui-texts.ts
  if (fs.existsSync(UI_TEXTS_PATH)) {
    console.log('Processing all-ui-texts.ts...');
    const translations = parseTranslationFile(UI_TEXTS_PATH);
    console.log(`Found ${translations.length} translations`);
    
    if (translations.length > 0) {
      const grouped = groupByCategory(translations);
      const stats = writeChunkFiles(grouped, 'all-ui-texts.ts');
      allStats = allStats.concat(stats);
      console.log('');
    }
  }
  
  // Process all-translations.ts if different
  if (fs.existsSync(TRANSLATIONS_PATH) && TRANSLATIONS_PATH !== UI_TEXTS_PATH) {
    console.log('Processing all-translations.ts...');
    const translations = parseTranslationFile(TRANSLATIONS_PATH);
    console.log(`Found ${translations.length} translations`);
    
    if (translations.length > 0) {
      const grouped = groupByCategory(translations);
      const stats = writeChunkFiles(grouped, 'all-translations.ts');
      // Merge stats if categories overlap
      stats.forEach(stat => {
        const existing = allStats.find(s => s.category === stat.category);
        if (!existing) {
          allStats.push(stat);
        }
      });
      console.log('');
    }
  }
  
  // Create index file
  const categories = [...new Set(allStats.map(s => s.category))].sort();
  createIndexFile(categories);
  
  // Print summary
  console.log('\n=== Summary ===');
  console.log(`Total chunks created: ${allStats.length}`);
  
  const totalSize = allStats.reduce((sum, s) => {
    const size = parseFloat(s.size);
    return sum + size;
  }, 0);
  
  console.log(`Total size: ${totalSize.toFixed(2)} KB`);
  console.log(`Average chunk size: ${(totalSize / allStats.length).toFixed(2)} KB`);
  
  // Find largest chunks
  const sorted = [...allStats].sort((a, b) => parseFloat(b.size) - parseFloat(a.size));
  console.log('\nLargest chunks:');
  sorted.slice(0, 5).forEach(s => {
    console.log(`  - ${s.category}: ${s.size} (${s.items} items)`);
  });
  
  console.log('\n✅ Translation splitting complete!');
}

// Run the script
main();