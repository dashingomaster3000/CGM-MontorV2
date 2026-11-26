const pg = require("pg");

// Læser .env lokalt (filen findes ikke på Vercel)
try {
  process.loadEnvFile();
} catch (error) {
  console.log("No .env file found");
}

// TIMESTAMP (type 1114) returneres som tekst, så tidszonen ikke flytter tiden
pg.types.setTypeParser(1114, function (tekst) {
  return tekst;
});

// Forbindelse til Neon-databasen
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Undgår nedbrud, når Neon lukker en ledig forbindelse
pool.on("error", (err) => {
  console.error("Databasen lukkede forbindelsen:", err.message);
});

module.exports = pool;
