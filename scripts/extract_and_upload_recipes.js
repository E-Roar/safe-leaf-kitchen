const xlsx = require('xlsx');
const fs = require('fs');

async function extractRecipes() {
  console.log('Extracting recipes from Excel file...');
  try {
    const workbook = xlsx.readFile('/home/glitcher/Codebases/safe-leaf-kitchen/les recettes 222.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Read the rows as JSON
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(`Found ${data.length} rows in the excel file.`);
    console.log('Sample data (first row):', JSON.stringify(data[0], null, 2));

    // Map rows to our Recipe structure
    // This mapping depends on the columns in the Excel file
    // We will inspect the sample output first before finalizing the mapping
    
    // Write raw extracted data to a JSON file for inspection
    fs.writeFileSync('/home/glitcher/Codebases/safe-leaf-kitchen/scripts/extracted_recipes.json', JSON.stringify(data, null, 2));
    console.log('Extracted data saved to scripts/extracted_recipes.json');
  } catch (err) {
    console.error('Error reading excel file:', err);
  }
}

extractRecipes();
