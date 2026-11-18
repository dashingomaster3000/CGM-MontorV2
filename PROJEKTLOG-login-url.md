# Projektlog – Login på den live URL

## Formål

Login virker på den live URL https://cgm-montorv2.vercel.app.

- Sessionerne ligger i tabellen `session` i gruppens Neon-database, så de
  overlever genstart og Vercels skift mellem serverinstanser.
- `SESSION_SECRET` og `DATABASE_URL` står som miljøvariabler i Vercel og ikke
  i koden.
- Session-cookien `connect.sid` har HttpOnly, Secure og SameSite=Lax.

## Routes

Alle routes med data er lukkede. Kun `POST /api/login` er åben. `GET /api/me`
og `POST /api/logout` kræver en session.

| Route | User story | Ansvarlig | Åben eller lukket | Middleware |
|-------|------------|-----------|-------------------|------------|
| `GET /` (login-siden) og statiske filer | | | Åben | `express.static` |
| `POST /api/login` | Fælles | Alle | Åben | – |
| `GET /api/me` | | | Lukket | `kraevLogin` |
| `POST /api/logout` | | | Lukket | `kraevLogin` |
| `GET /api/patients` | | | Lukket | `kraevSundhedsprofessionel` |
| `GET /api/patients/:id/maalinger` | | | Lukket | `kraevPatientAdgang` |
| `GET /api/patients/:id/symptomer` | | | Lukket | `kraevPatientAdgang` |
| `GET /api/patients/:cpr` | | | Lukket | `kraevSundhedsprofessionel` |
| `POST /api/patients` | | | Lukket | `kraevSundhedsprofessionel` |
| `GET /api/symptomer` | | | Lukket | `kraevSundhedsprofessionel` |
| `POST /api/symptomer` | | | Lukket | `kraevLogin` |

## Testskema

Testene køres på https://cgm-montorv2.vercel.app i et privat vindue.

| # | Handling | Forventet | Fik |
|---|----------|-----------|-----|
| 1 | Åbn en side der kræver login | Ender på login-siden | |
| 2 | Skriv `/api/patients` i adresselinjen | 401 | |
| 3 | Log ind med en testbruger | Siden med handlingen vises | |
| 4 | Udfør den centrale handling og genindlæs | Data er der stadig | |
| 5 | DevTools → Application → Cookies | `connect.sid` med HttpOnly og Secure | |
| 6 | Log ud og gentag 2 | 401 | |

## User stories

### Bardy

Som … vil jeg …, så …

Acceptkriterier:

1. Normalt forløb:
2. Fejlforløb:
3. Uden login: serveren svarer 401, og brugeren sendes til login-siden.

### David

Som … vil jeg …, så …

Acceptkriterier:

1. Normalt forløb:
2. Fejlforløb:
3. Uden login: serveren svarer 401, og brugeren sendes til login-siden.

### Matti

Som … vil jeg …, så …

Acceptkriterier:

1. Normalt forløb:
2. Fejlforløb:
3. Uden login: serveren svarer 401, og brugeren sendes til login-siden.

### Nilas

Som … vil jeg …, så …

Acceptkriterier:

1. Normalt forløb:
2. Fejlforløb:
3. Uden login: serveren svarer 401, og brugeren sendes til login-siden.
