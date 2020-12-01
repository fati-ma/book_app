'use strict';

const express = require('express');
require('dotenv').config();
const app = express();
const superagent = require('superagent');
const methodoverride = require('method-override');
const PORT = process.env.PORT;

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.use(methodoverride('_method'));
app.set('view engine', 'ejs');

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);

app.get('/', (request, response) => {
    let SQL = `SELECT * FROM books;`;
    client.query(SQL)
        .then(results => {
            console.log(results.rows);
            response.render('pages/index', { books: results.rows });
            console.log('there is data');

        })
        .catch((error) => {
            response.render('pages/error', { errors: error });
        })
});

app.post('/books', (request, response) => {
    let SQL = `INSERT INTO books (title, author, isbn, image_url, description) VALUES ($1,$2,$3,$4,$5) RETURNING *;`;
    let { title, author, isbn, image_url, description } = request.body;
    let safeValues = [title, author, isbn, image_url, description];
    console.log(request.body.title);
    console.log('hello')
    client.query(SQL, safeValues)
        .then(result => {
            response.redirect(`/books/${result.rows[0].id}`);
        })
})

app.put("/books/:id", (req, res) => {
    const { title, author, isbn, description, image_url } = req.body;
    const SQL = `UPDATE books SET title=$1,author=$2,isbn=$3,image_url=$4 , description=$5  where id = $6;`;
    const safeValues = [title, author, isbn, image_url, description, req.params.id,];
    client.query(SQL, safeValues).then(() => {
        res.redirect(`/books/${req.params.id}`);
    });
});


app.delete("/books/:id", (req, res) => {
    const SQL = `DELETE FROM books WHERE id=$1`;
    const value = [req.params.id];
    client.query(SQL, value)
        .then(res.redirect('/'))
});


app.get('/books/:id', (request, response) => {
    let SQL = `SELECT * FROM books WHERE id = $1;`;
    let safeValue = [request.params.id];
    client.query(SQL, safeValue)
        .then(results => {
            response.render('pages/books/detail', { books: results.rows[0] });
        });
});

app.get('/searches/new', (request, response) => {
    response.render('pages/searches/new');
});


app.post('/searches', (request, response) => {
    let query_search = request.body.searchEngine;
    let category = request.body.category;

    let url = `https://www.googleapis.com/books/v1/volumes?q=${query_search}+${category}&startIndex=0&maxResults=10`;


    superagent.get(url)
        .then(result => {
            let books = result.body.items.map(data => {
                return new Book(data);
            });
            response.render('pages/searches/show', { book: books });
        })
        .catch((error) => {
            response.render('pages/error', { errors: error });
        });
})

function Book(data) {
    if (data.volumeInfo.imageLinks === undefined) {
        this.image = 'https://i.imgur.com/J5LVHEL.jpg';
    } else {
        if (data.volumeInfo.imageLinks.smallThumbnail[4] === 's') {
            this.image = data.volumeInfo.imageLinks.smallThumbnail;
        } else {
            this.image = 'https' + data.volumeInfo.imageLinks.smallThumbnail.slice(4);
        }

    }
    this.title = data.volumeInfo.title ? data.volumeInfo.title : 'Title is not available!';
    this.author = data.volumeInfo.authors ? data.volumeInfo.authors[0] : 'Author is not available!';
    this.description = data.volumeInfo.description ? data.volumeInfo.description : 'Description is not available!';
    this.isbn = data.volumeInfo.industryIdentifiers ? data.volumeInfo.industryIdentifiers[0].type + ' ' + data.volumeInfo.industryIdentifiers[0].identifier : "Isbn is not available";
}

client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`We heard the PORT ${PORT}`);
        });

    })

