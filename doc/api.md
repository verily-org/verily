# API Documentation
For details about the algorithms of the controllers, see [```doc/dev-detail.html```](dev-detail.html) or [```doc/dev-detail.md```](dev-detail.md).


## Questions

### Create

Create question

    POST /questions

ex. ```curl -i http://localhost:3000/questions -d "text=my question text&title=the title of my question&author=me"```

### Get All

Get all questions

    GET /questions

ex. ```curl -i http://localhost:3000/questions```

### Get

Get question with specific ID

    GET /question/:question_id

ex. ```curl -i http://localhost:3000/question/1```

### Update

Update question

    PUT /question/:question_id

ex. ```curl -i http://localhost:3000/question/1 -X PUT -d "text=my NEW question text&title=the NEW title of my question&author=NEW me"```

### Delete

Delete question

    DELETE /question/:question_id

ex. ```curl -i http://localhost:3000/question/2 -X DELETE```

### Index

Spotlight: returns up to 10 questions with their answers

    GET /

ex. ```curl -i http://localhost:3000```

### Head

Get headers for testing validity, accessibility, and recent modification

    HEAD /question/:question_id

ex. ```curl -i http://localhost:3000/question/1 -X HEAD```


## Question Comments

### Create

Add new comment to question

    POST /question/:question_id/comments

ex. ```curl -i http://localhost:3000/question/1/comments -d "text=question comment text&author=my author name"```

### Get All

Get all comments of question

    GET /question/:question_id/comments

ex. ```curl -i http://localhost:3000/question/1/comments```

### Get

Get question comment with specific ID

    GET /question/:question_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/comment/1```

### Update

Update comment of question

    PUT /question/:question_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/comment/1 -X PUT -d "text=New questioncomment text&author=my New author name"```

### Delete

Delete comment of question

    DELETE /question/:question_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/comment/2 -X DELETE```

### Head

Get headers for testing validity, accessibility, and recent modification

    HEAD /question/:question_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/comment/1 -X HEAD```


## Answers

### Create

Add new answer to question

    POST /question/:question_id/answers

ex. ```curl -i http://localhost:3000/question/1/answers -d "text=my answer text&author=the answer author"```

### Get all answers for a specific question

Get all answers for a specific question

    GET /question/:question_id/answers

ex. ```curl -i http://localhost:3000/question/1/answers```

### Get All

Get all answers ever stored in the datastore

    GET /answers

ex. ```curl -i http://localhost:3000/answers```

### Get

Get answer with specific ID

    GET /question/:question_id/answer/:answer_id

ex. ```curl -i http://localhost:3000/question/1/answer/1```

### Update

Update answer

    PUT /question/:question_id/answer/:answer_id

ex. ```curl -i http://localhost:3000/question/1/answer/1 -X PUT -d "text=NEW answer text&author=NEW author name"```

### Delete

Delete answer

    DELETE /question/:question_id/answer/:answer_id

ex. ```curl -i http://localhost:3000/question/1/answer/2 -X DELETE```

### Head

Get headers for testing validity, accessibility, and recent modification

    HEAD /question/:question_id/answer/:answer_id

ex. ```curl -i http://localhost:3000/question/1/answer/1 -X HEAD```


## Answer Comments

### Create

Add new comment to answer

    POST /question/:question_id/answer/:answer_id/comments

ex. ```curl -i http://localhost:3000/question/1/answer/1/comments -d "text=answer comment text&author=my author name"```

### Get All

Get all comments of answer

    GET /question/:question_id/answer/:answer_id/comments

ex. ```curl -i http://localhost:3000/question/1/answer/1/comments```

### Get

Get answer comment with specific ID

    GET /question/:question_id/answer/:answer_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/answer/1/comment/1```

### Update

Update comment of answer

    PUT /question/:question_id/answer/:answer_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/answer/1/comment/1 -X PUT -d "text=New answer_comment text&author=New author name"```

### Delete

Delete comment of answer

    DELETE /question/:question_id/answer/:answer_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/answer/1/comment/2 -X DELETE```

### Head

Get headers for testing validity, accessibility, and recent modification

    HEAD /question/:question_id/answer/:answer_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/answer/1/comment/1 -X HEAD```