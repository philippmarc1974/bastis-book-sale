const XLSX = require('xlsx');
const Database = require('better-sqlite3');
const path = require('path');

const USD_TO_SGD = 1.29;

// Amazon prices in USD - individual book prices by series/title
const SERIES_PRICES_USD = {
  // Rick Riordan
  'Percy Jackson': { individual: 9.99, boxSet: 44.95, boxBooks: 5 },
  'Heroes of Olympus': { individual: 10.99, boxSet: 35.96, boxBooks: 5 },
  'Kane Chronicles': { individual: 10.99, boxSet: 29.95, boxBooks: 3 },
  'Magnus Chase': { individual: 10.99, boxSet: 29.97, boxBooks: 3 },
  'Trials of Apollo': { individual: 10.99, boxSet: 49.95, boxBooks: 5 },

  // Erin Hunter Warriors
  'Warriors (Original)': { individual: 9.99, boxSet: 59.94, boxBooks: 6 },
  'Warriors: New Prophecy': { individual: 9.99, boxSet: 59.94, boxBooks: 6 },
  'Warriors: Power of Three': { individual: 9.99, boxSet: 59.94, boxBooks: 6 },
  'Warriors: Omen of the Stars': { individual: 9.99, boxSet: 59.94, boxBooks: 6 },
  'Warriors: Dawn of the Clans': { individual: 9.99, boxSet: 59.94, boxBooks: 6 },
  'Warriors: Super Editions': { individual: 11.49, boxSet: null, boxBooks: 0 },
  'Warriors': { individual: 9.99, boxSet: null, boxBooks: 0 }, // generic Warriors

  // Brandon Mull
  'Fablehaven': { individual: 9.99, boxSet: 49.99, boxBooks: 5 },
  'Five Kingdoms': { individual: 9.99, boxSet: 44.99, boxBooks: 5 },
  'Dragonwatch': { individual: 9.99, boxSet: 49.99, boxBooks: 5 },
  'Beyonders': { individual: 9.49, boxSet: 26.99, boxBooks: 3 },

  // Christopher Paolini
  'Inheritance Cycle': { individual: 15.99, boxSet: 63.96, boxBooks: 4 },
  'Inheritance': { individual: 15.99, boxSet: 63.96, boxBooks: 4 },

  // Derek Landy
  'Skulduggery Pleasant': { individual: 8.99, boxSet: 80.91, boxBooks: 9 },

  // Philip Pullman
  'His Dark Materials': { individual: 8.99, boxSet: 26.97, boxBooks: 3 },

  // William Joyce
  'Guardians of Childhood': { individual: 8.99, boxSet: 44.99, boxBooks: 5 },
  'The Guardians': { individual: 8.99, boxSet: 44.99, boxBooks: 5 },

  // Lisa McMann
  'The Unwanteds': { individual: 9.99, boxSet: 67.99, boxBooks: 7 },
  'Unwanteds Quests': { individual: 9.99, boxSet: 69.99, boxBooks: 7 },
  'Unwanteds': { individual: 9.99, boxSet: 67.99, boxBooks: 7 },

  // Eoin Colfer
  'Artemis Fowl': { individual: 8.99, boxSet: 35.00, boxBooks: 8 },

  // Stuart Gibbs
  'Spy School': { individual: 8.99, boxSet: 43.99, boxBooks: 7 },
  'FunJungle': { individual: 8.99, boxSet: 26.97, boxBooks: 3 },
  'Moon Base Alpha': { individual: 8.99, boxSet: 26.99, boxBooks: 3 },
  'Charlie Thorne': { individual: 9.99, boxSet: 36.99, boxBooks: 4 },
  'Last Musketeer': { individual: 7.99, boxSet: null, boxBooks: 0 },
  'The Last Musketeer': { individual: 7.99, boxSet: null, boxBooks: 0 },

  // Chris Rylander
  'The Fourth Stall': { individual: 7.99, boxSet: null, boxBooks: 0 },
  'Fourth Stall': { individual: 7.99, boxSet: null, boxBooks: 0 },
  'Codename Zero': { individual: 7.99, boxSet: null, boxBooks: 0 },

  // Shannon Messenger
  'Keeper of the Lost Cities': { individual: 10.99, boxSet: 54.99, boxBooks: 5 },
  'KOTLC': { individual: 10.99, boxSet: 54.99, boxBooks: 5 },

  // Peter Lerangis
  'Seven Wonders': { individual: 8.49, boxSet: null, boxBooks: 0 },
  '39 Clues': { individual: 8.49, boxSet: null, boxBooks: 0 },

  // Andrew Peterson
  'Wingfeather Saga': { individual: 12.49, boxSet: 49.99, boxBooks: 4 },

  // Kazu Kibuishi
  'Amulet': { individual: 12.99, boxSet: 92.99, boxBooks: 8 },

  // Ransom Riggs
  "Miss Peregrine's": { individual: 14.99, boxSet: 44.97, boxBooks: 3 },

  // Franklin W. Dixon
  'Hardy Boys Adventures': { individual: 7.49, boxSet: 69.99, boxBooks: 10 },
  'Hardy Boys': { individual: 7.49, boxSet: 69.99, boxBooks: 10 },

  // Max Brallier
  'Last Kids on Earth': { individual: 8.99, boxSet: null, boxBooks: 0 },

  // Chris Columbus
  'House of Secrets': { individual: 8.99, boxSet: null, boxBooks: 0 },

  // Kevin Sands
  'Blackthorn Key': { individual: 8.99, boxSet: null, boxBooks: 0 },

  // Michelle Paver
  'Chronicles of Ancient Darkness': { individual: 8.99, boxSet: null, boxBooks: 0 },

  // Enid Blyton
  'Faraway Tree': { individual: 5.99, boxSet: null, boxBooks: 0 },
  'Famous Five': { individual: 10.00, boxSet: null, boxBooks: 0 },

  // Suzanne Collins
  'Underland Chronicles': { individual: 8.49, boxSet: 34.99, boxBooks: 5 },

  // Lisa Fiedler
  'Mouseheart': { individual: 8.99, boxSet: null, boxBooks: 0 },

  // Cornelia Funke
  'Inkworld': { individual: 10.94, boxSet: 21.66, boxBooks: 3 },

  // Madeleine L'Engle
  'Time Quintet': { individual: 8.99, boxSet: null, boxBooks: 0 },
  'Time Series': { individual: 8.99, boxSet: null, boxBooks: 0 },

  // Chris Colfer
  'Land of Stories': { individual: 9.99, boxSet: 25.46, boxBooks: 6 },
  'Tale of Magic': { individual: 9.00, boxSet: 30.00, boxBooks: 3 },

  // James Riley
  'Story Thieves': { individual: 8.79, boxSet: 43.99, boxBooks: 5 },
  'Half Upon a Time': { individual: 9.49, boxSet: 26.99, boxBooks: 3 },

  // Kevin Kwan
  'Crazy Rich Asians': { individual: 9.90, boxSet: null, boxBooks: 0 },

  // Susan Cooper
  'The Dark Is Rising': { individual: 8.99, boxSet: 44.95, boxBooks: 5 },
  'Dark Is Rising': { individual: 8.99, boxSet: 44.95, boxBooks: 5 },

  // J.K. Rowling
  'Harry Potter': { individual: 10.99, boxSet: 65.99, boxBooks: 7 },

  // T.A. Barron
  'Atlantis': { individual: 9.49, boxSet: null, boxBooks: 0 },

  // Minecraft
  'Minecraft': { individual: 10.99, boxSet: null, boxBooks: 0 },

  // R.L. Ullman
  'Epic Zero': { individual: 11.99, boxSet: 16.91, boxBooks: 3 },

  // Jake Atlas
  'Jake Atlas': { individual: 10.08, boxSet: 27.50, boxBooks: 3 },

  // Antboy
  'Antboy': { individual: 35.00, boxSet: null, boxBooks: 0 },

  // Klawde
  'Klawde': { individual: 7.99, boxSet: null, boxBooks: 0 },
};

// Individual book overrides (title -> USD price)
const TITLE_PRICES_USD = {
  'Wonder': 8.99,
  'Black Ships Before Troy': 8.99,
  'The King Arthur Trilogy': 12.99,
  'The Butterfly Lion': 7.99,
  'Running Wild': 9.34,
  'War Horse': 8.99,
  'Chess Tactics for Kids': 13.49,
  'How to Beat Your Dad at Chess': 12.29,
  'Tintenherz (Inkheart)': 17.67,
  'A Wrinkle in Time': 8.99,
  'In the Shadow of Heroes': 9.00,
  'His Royal Whiskers': 9.99,
  'Drama': 7.99,
  'The Christmasaurus': 8.99,
  'Head Kid': 11.50,
  'Call Me By Your Name': 9.42,
  'Rich People Problems': 9.90,
  'Raising Boys': 10.99,
  'The Dark Side of the Light Chasers': 17.00,
  'You Are a Badass': 9.35,
  'Timmy Failure: Mistakes Were Made': 8.99,
  'The Culture Map': 19.00,
  "D'Aulaires' Book of Greek Myths": 15.99,
  'Pokémon Deluxe Essential Handbook': 9.98,
  "Giraffe's Can't Dance": 7.99,
  "Giraffes Can't Dance": 7.99,
  'The Shakespeare Stealer': 8.99,
  'Flying Furballs': 12.00,
  'Dogfighty': 12.10,
  'Not So Normal Norbert': 7.99,
  'Minecraft: The Island': 10.99,
  'Minecraft: The Crash': 12.00,
  'Antboy': 35.00,
  'Klawde: Evil Alien Warlord Cat': 7.99,
  'The Last Musketeer': 7.99,
  'Atlantis Rising': 9.49,
  'A Tale of Magic': 9.00,
  'Codename Zero': 7.99,
  'Skulduggery Pleasant Essential Handbook': 11.78,
  'Nicholas St. North and the Battle of the Nightmare King': 8.99,
  'E. Aster Bunnymund and the Warrior Eggs': 8.99,
  'Toothiana, Queen of the Tooth Fairy Armies': 8.99,
  'The Sandman and the War of Dreams': 8.99,
  'Jack Frost': 8.99,
  'Squirrelflight\'s Hope': 11.99,
  'Moth Flight\'s Vision': 11.99,
  'Crowfeather\'s Trial': 10.99,
  'The Elenium (Trilogy Omnibus)': 22.00,
  'The Tamuli (Trilogy Omnibus)': 22.00,
  'Famous Five Collection 1 (Books 1-5)': 24.99,
  'Famous Five Collection 2 (Books 6-10)': 24.99,
  'Epic Zero: Books 1-3 Collection': 16.91,
  'Singapore Colonial Style': 15.00, // estimate
  'Crazy Rich Asians': 9.90,
  'China Rich Girlfriend': 9.90,
  'A World Without Heroes': 9.49,
  'Seeds of Rebellion': 9.49,
  'Chasing the Prophecy': 9.49,
  'The Sun Trail': 9.99,
  'The Sight': 9.99,
  'Dark River': 9.99,
  'Eclipse': 9.99,
  'Long Shadows': 9.99,
  'Sunrise': 9.99,
  'The Fourth Apprentice': 9.99,
  'Fading Echoes': 9.99,
  'Sign of the Moon': 9.99,
  'The Forgotten Warrior': 9.99,
};

function usdToSgdCents(usd) {
  return Math.round(usd * USD_TO_SGD * 100);
}

function usdToSgdDisplay(usd) {
  return (usd * USD_TO_SGD).toFixed(2);
}

// Extract series from series_author_group
function extractSeries(group) {
  const idx = group.indexOf(' — ');
  if (idx === -1) return null;
  return group.slice(idx + 3).trim();
}

function findAmazonPrice(title, seriesAuthorGroup) {
  // First check title overrides
  if (TITLE_PRICES_USD[title]) {
    return TITLE_PRICES_USD[title];
  }

  // Then check series
  const series = extractSeries(seriesAuthorGroup || '');
  if (series) {
    // Try exact series match
    if (SERIES_PRICES_USD[series]) {
      return SERIES_PRICES_USD[series].individual;
    }
    // Try partial match
    for (const [key, val] of Object.entries(SERIES_PRICES_USD)) {
      if (series.includes(key) || key.includes(series)) {
        return val.individual;
      }
    }
    // Try matching just the series name without numbers
    const seriesBase = series.replace(/#\d+/, '').trim();
    if (SERIES_PRICES_USD[seriesBase]) {
      return SERIES_PRICES_USD[seriesBase].individual;
    }
  }

  // Fallback - try matching by author group prefix
  const group = seriesAuthorGroup || '';
  for (const [key, val] of Object.entries(SERIES_PRICES_USD)) {
    if (group.includes(key)) {
      return val.individual;
    }
  }

  return null;
}

function findBoxSetPrice(seriesAuthorGroup) {
  const series = extractSeries(seriesAuthorGroup || '');
  if (!series) return null;

  if (SERIES_PRICES_USD[series] && SERIES_PRICES_USD[series].boxSet) {
    return SERIES_PRICES_USD[series];
  }

  // Try partial match
  for (const [key, val] of Object.entries(SERIES_PRICES_USD)) {
    if ((series.includes(key) || key.includes(series)) && val.boxSet) {
      return val;
    }
  }

  const seriesBase = series.replace(/#\d+/, '').trim();
  if (SERIES_PRICES_USD[seriesBase] && SERIES_PRICES_USD[seriesBase].boxSet) {
    return SERIES_PRICES_USD[seriesBase];
  }

  return null;
}

// ===== UPDATE DATABASE =====
console.log('=== Updating Database ===');
const dbPath = path.resolve(__dirname, '..', 'data', 'books.db');
const fs = require('fs');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    row_number          INTEGER NOT NULL DEFAULT 0,
    series_author_group TEXT    NOT NULL DEFAULT '',
    title               TEXT    NOT NULL,
    author              TEXT    NOT NULL DEFAULT '',
    series_number       INTEGER,
    language            TEXT    NOT NULL DEFAULT 'English',
    format              TEXT    NOT NULL DEFAULT 'Paperback',
    notes               TEXT,
    cover_url           TEXT,
    description         TEXT,
    price               INTEGER NOT NULL DEFAULT 0,
    condition           TEXT    NOT NULL DEFAULT 'Good',
    status              TEXT    NOT NULL DEFAULT 'available',
    reserved_at         TEXT,
    pages               INTEGER
  )
`);

// Seed if empty
const { n } = db.prepare('SELECT COUNT(*) as n FROM books').get();
if (n === 0) {
  const seedPath = path.resolve(__dirname, '..', 'data', 'seed.json');
  const rows = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  const insert = db.prepare(`
    INSERT INTO books (row_number, series_author_group, title, author, series_number,
      language, format, notes, cover_url, description, price, condition, status, pages)
    VALUES (@row_number, @series_author_group, @title, @author, @series_number,
      @language, @format, @notes, @cover_url, @description, @price, @condition, @status, @pages)
  `);
  db.transaction(() => {
    for (const r of rows) {
      insert.run({
        row_number: r.row_number ?? 0,
        series_author_group: r.series_author_group ?? '',
        title: r.title,
        author: r.author ?? '',
        series_number: r.series_number ?? null,
        language: r.language ?? 'English',
        format: r.format ?? 'Paperback',
        notes: r.notes ?? null,
        cover_url: r.cover_url ?? null,
        description: r.description ?? null,
        price: r.price ?? 500,
        condition: r.condition ?? 'Good',
        status: r.status ?? 'available',
        pages: r.pages ?? null,
      });
    }
  })();
  console.log(`Seeded ${rows.length} books`);
}

// Add amazon_price column if not exists
try {
  db.exec('ALTER TABLE books ADD COLUMN amazon_price INTEGER DEFAULT 0');
  console.log('Added amazon_price column to database');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('amazon_price column already exists');
  } else {
    console.error('Error adding column:', e.message);
  }
}

// Update all books
const books = db.prepare('SELECT * FROM books').all();
const updateStmt = db.prepare('UPDATE books SET amazon_price = ? WHERE id = ?');
let updated = 0;
let notFound = [];

const updateMany = db.transaction(() => {
  for (const book of books) {
    const priceUsd = findAmazonPrice(book.title, book.series_author_group);
    if (priceUsd) {
      const priceSgdCents = usdToSgdCents(priceUsd);
      updateStmt.run(priceSgdCents, book.id);
      updated++;
    } else {
      notFound.push(book.title);
    }
  }
});
updateMany();

console.log(`Updated ${updated}/${books.length} books with Amazon prices`);
if (notFound.length > 0) {
  console.log('Could not find Amazon price for:', notFound.join(', '));
}

// ===== UPDATE EXCEL =====
console.log('\n=== Updating Excel ===');
const wb = XLSX.readFile('/Users/marcphilip/Downloads/basti_books_final_v8.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Add new columns to header
data[0].push('Amazon Price (SGD)');
data[0].push('Box Set Price (SGD)');

// Also sync statuses from DB
const dbBooksByTitle = {};
for (const book of books) {
  dbBooksByTitle[book.title] = book;
}

let excelUpdated = 0;
let boxSetsAdded = new Set();

for (let i = 1; i < data.length; i++) {
  const row = data[i];
  const title = row[2] || '';
  const seriesAuthorGroup = row[1] || '';

  if (!title) {
    // Header row - check if this series has a box set
    const boxInfo = findBoxSetPrice(seriesAuthorGroup);
    if (boxInfo && boxInfo.boxSet) {
      const seriesKey = seriesAuthorGroup;
      if (!boxSetsAdded.has(seriesKey)) {
        const boxPriceSgd = usdToSgdDisplay(boxInfo.boxSet);
        row[14] = ''; // amazon price
        row[15] = `$${boxPriceSgd} (${boxInfo.boxBooks} books)`;
        boxSetsAdded.add(seriesKey);
      }
    }
    continue;
  }

  // Regular book row
  const priceUsd = findAmazonPrice(title, seriesAuthorGroup);
  if (priceUsd) {
    row[14] = `$${usdToSgdDisplay(priceUsd)}`;
    excelUpdated++;
  } else {
    row[14] = '';
  }

  // Box set price on individual rows (leave empty - it's on the header)
  row[15] = '';

  // Sync status with DB
  const dbBook = dbBooksByTitle[title];
  if (dbBook) {
    // Map DB status to Excel status
    const statusMap = {
      'available': 'FOR SALE',
      'reserved': 'RESERVED',
      'sold': 'SOLD',
      'not_in_collection': 'NOT IN COLLECTION'
    };
    row[7] = statusMap[dbBook.status] || row[7];
    // Sync condition
    row[11] = dbBook.condition || row[11];
    // Sync price
    if (dbBook.price > 0) {
      row[12] = `$${(dbBook.price / 100).toFixed(0)}`;
    }
  }
}

console.log(`Updated ${excelUpdated} books with Amazon prices in Excel`);
console.log(`Added box set prices for ${boxSetsAdded.size} series`);

// Write new Excel
const newWs = XLSX.utils.aoa_to_sheet(data);

// Set column widths
newWs['!cols'] = [
  { wch: 4 },   // #
  { wch: 40 },  // Series / Author Group
  { wch: 50 },  // Title
  { wch: 25 },  // Author
  { wch: 8 },   // Series #
  { wch: 10 },  // Language
  { wch: 12 },  // Format
  { wch: 12 },  // Status
  { wch: 50 },  // Cover URL
  { wch: 60 },  // Description
  { wch: 12 },  // Format (Photo)
  { wch: 14 },  // Condition (Photo)
  { wch: 12 },  // Price (SGD)
  { wch: 15 },  // Bundle Note
  { wch: 18 },  // Amazon Price (SGD)
  { wch: 25 },  // Box Set Price (SGD)
];

const newWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWb, newWs, 'Book Catalogue');
const outputPath = '/Users/marcphilip/Downloads/basti_books_final_v9.xlsx';
XLSX.writeFile(newWb, outputPath);
console.log(`\nExcel saved to: ${outputPath}`);

// Summary stats
const allBooks = db.prepare('SELECT * FROM books').all();
const withAmazon = allBooks.filter(b => b.amazon_price > 0);
const totalAmazon = withAmazon.reduce((sum, b) => sum + b.amazon_price, 0);
const totalSelling = allBooks.reduce((sum, b) => sum + b.price, 0);
console.log(`\n=== Summary ===`);
console.log(`Total books: ${allBooks.length}`);
console.log(`Books with Amazon price: ${withAmazon.length}`);
console.log(`Total Amazon value: $${(totalAmazon / 100).toFixed(2)} SGD`);
console.log(`Total selling value: $${(totalSelling / 100).toFixed(2)} SGD`);
console.log(`Savings for buyers: $${((totalAmazon - totalSelling) / 100).toFixed(2)} SGD`);

db.close();
