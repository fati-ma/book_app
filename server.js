'use strict';

const { response } = require('express');
const express = require('express');
require('dotenv').config();
const PORT = process.env.PORT;
const superagent = require('superagent');

const app = express();

app.use(express.static('./public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));

app.get('/', (require, response)=>{
    response.render('pages/index');
})

app.get('/searches/new', (require, response)=>{
    response.render('pages/searches/new');
})

app.post('/searches', (request, response)=>{
    let query_search = request.body.searchEngine;
    let category = request.body.category;

    
    let url=`https://www.googleapis.com/books/v1/volumes?q=${query_search}+${category}&startIndex=0&maxResults=10`;

    superagent.get(url)
    .then(result=>{
        let books = result.body.items.map(data=>{
            return new Book(data);
        });
        response.render('pages/searches/show', {book: books});
    })
    .catch((error)=>{
        response.render('pages/error', {errors: error});
    });
})

function Book(data) {
    if (data.volumeInfo.imageLinks === undefined){
        this.image = 'https://i.imgur.com/J5LVHEL.jpg';
    } else {
        if(data.volumeInfo.imageLinks.smallThumbnail[4] === 's') {
            this.image = data.volumeInfo.imageLinks.smallThumbnail;
        } else {
            this.image = 'https' + data.volumeInfo.imageLinks.smallThumbnail.slice(4);
        }
        
    }
    this.title = data.volumeInfo.title;
    this.author = data.volumeInfo.authors;
    this.description = data.volumeInfo.description;
}

app.listen(PORT, ()=>{
    console.log(`We heard the PORT ${PORT}`);
});