const pg = require("pg");

// Læser .env lokalt. På Vercel findes filen ikke, så fejlen ignoreres.
try {
  process.loadEnvFile();
} catch (error) {
  console.log("No .env file found");
}

// Tidspunkter sendes som tekst fra databasen.
// Så passer datoen uanset computerens tidszone.
pg.types.setTypeParser(1114, function (tekst) {
  return tekst;
});

// Forbindelse til Neon-databasen.
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Gør forbindelsen tilgængelig for de andre filer.
module.exports = db;
