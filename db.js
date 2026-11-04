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

// Forbindelse til Neon-databasen. Projektets eneste Pool.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Neon kan lukke en ledig forbindelse. Uden denne linje går serveren ned.
pool.on("error", (err) => {
  console.error("Databasen lukkede forbindelsen:", err.message);
});

// Gør forbindelsen tilgængelig for de andre filer.
module.exports = pool;
