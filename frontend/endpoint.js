import express from 'express';
import path from 'path';

// Crea un'istanza dell'applicazione Express
const app = express();

// Imposta il percorso alla cartella delle views
const __dirname = path.resolve();
app.set('views', path.join(__dirname, '/views'));

// Imposta la cartella per gli script
app.use(express.static(path.join(__dirname, '/public')));

// Imposta il motore di template EJS
app.set('view engine', 'ejs');

// Definisce una porta dove il server ascolterà le richieste
const port = 8001;

// Definisce l'endpoint per la pagina principale
app.get('/', (req, res) => {
  res.render('homepage');
});

// Avvia il server
app.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});
