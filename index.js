import express from "express"
import bodyParser from "body-parser"
import pg from "pg"
import axios from "axios";
import { error } from "console";

const app = express();

const port = 3000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

const db = new pg.Client({
    host: "localhost",
    user: "postgres",
    database: "books",
    password: "abir",
    port: 5432
});

db.connect()

function currDate(){
    var currentDate = new Date();

    var day = currentDate.getDate();
    var month = currentDate.getMonth() + 1;
    var year = currentDate.getFullYear();
    var formattedDate = year + '-' + month + '-' + day;
    return formattedDate;
}

async function searchBookByTitle(title){
    const searchURL = "https://openlibrary.org/search.json";
    const params = {"title": title};
    try{
        const response = await axios.get(searchURL, {params: params});
        if(response.status === 200){
            const data = response.data;
            if (data.docs && data.docs.length > 0){
                const book = data.docs[0];
                const bookId = book.cover_edition_key || book.edition_key[0];
                return bookId;
            }else {
                console.log("No books found.");
                return null;
            }
        }else {
            console.log(`Error searching for book: ${response.status}`);
            return null;
    }
}catch (error) {
    console.error(`Error searching for book: ${error}`);
    return null;
}
}

let coverUrl = "img/portfolio-1.jpg"
app.get("/", async (req, res)=>{
    const result = await db.query("SELECT * FROM books;");
    console.log(result.rows);
    res.render("index.ejs", {books: result.rows});
})

app.post("/newbook", async (req, res)=>{
    const title = req.body.bookname;
    const review = req.body.review;
    const rating = req.body.rating;
    const date = currDate();
    searchBookByTitle(title)
    .then(bookId =>{
        if(bookId){
            coverUrl = `http://covers.openlibrary.org/b/OLID/${bookId}-L.jpg`;
            db.query("INSERT INTO books(title, review, rating, review_date, image) VALUES($1, $2, $3, $4, $5);", [title, review, rating, date, coverUrl]);
            res.redirect("/");
        }else{
            db.query("INSERT INTO books(title, review, rating, review_date, image) VALUES($1, $2, $3, $4, $5);", [title, review, rating, date, coverUrl]);
            res.redirect("/");
        }
    })
    .catch(error=>{
        console.error(`Error: ${error}`);
    });

});

app.get("/book/:id", async (req, res)=>{
    const id = req.params.id;
    const result = await  db.query("SELECT * FROM books WHERE id = $1", [id]);
    res.render("books.ejs", {
        id: id,
        title: result.rows[0].title,
        review: result.rows[0].review,
        rating: result.rows[0].rating,
        image : result.rows[0].image
    });
});

app.post("/editbook", async (req, res)=>{
    const id = req.body.id;
    const title = req.body.bookname;
    const review = req.body.review;
    const rating = req.body.rating;
    const image = req.body.image;
    const date = currDate();
    await db.query("UPDATE books SET title = $1 ,review = $2, rating = $3, review_date = $4, image = $5 WHERE id = $6;", [title, review, rating, date, image, id]);
    res.redirect("/");
});

app.post("/delete/:id", async (req, res)=>{
    await db.query("DELETE FROM books WHERE id = $1", [req.params.id]);
    res.redirect("/");
});

app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
});