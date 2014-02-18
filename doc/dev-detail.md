# Development Detail

## Questions

### Create

Create question

    POST /questions

ex. ```curl -i http://localhost:3000/questions -d "text=my question text&title=the title of my question&author=me"```

#### Algorithm
1.	Check whether the question exists or not
2.	If the question does not exist, create a new question; otherwise, returns corresponding error information


### Get All

Get all questions

    GET /questions

ex. ```curl -i http://localhost:3000/questions```

#### Algorithm
1.	Check whether questions exist or not
2.	If questions exist, returns all questions; otherwise, returns corresponding error information


### Get

Get question with specific ID

    GET /question/:question_id

ex. ```curl -i http://localhost:3000/question/1```

#### Algorithm
1.	Check whether the question exists or not
2.	If the question exists, returns the question information; otherwise, returns corresponding error information


### Update

Update question

    PUT /question/:question_id

ex. ```curl -i http://localhost:3000/question/1 -X PUT -d "text=my NEW question text&title=the NEW title of my question&author=NEW me"```

#### Algorithm
1.	Check whether the question exists or not
2.	If the question exists, updates the question; otherwise, returns corresponding error information

### Delete

Delete question

    DELETE /question/:question_id

ex. ```curl -i http://localhost:3000/question/2 -X DELETE```

#### Algorithm
1.	Check whether the question exists
2.	If the question does not exist, corresponding error will be returned.
3.	If the question exists, check whether the answers to question exist.
4.	If the answers to question exist, check whether the comments to answers exist.
5.	If the comments to answers exist, delete the comments to answers then delete the answers to question.
6.	If the comments to answers do not exist, delete the answers to question.    
7.	Check whether the comments to question exist
8.	If the comments to question exist, delete the comments to question then delete the question.
9.	If the comment to question does not exist, delete the question.


### Index

Spotlight: returns up to 10 questions with their answers

    GET /

ex. ```curl -i http://localhost:3000```

#### Algorithm
1.	Check whether the question exists or not.
2.	If the question does not exist, returns corresponding errors.
3.	If the question exists, check whether the question has answers or not.
4.	If the question does not have any answers, returns corresponding information and check whether the question has question comments or not.
5.	If the question has answers, check whether each answer has answer comments or not.
6.  Return up to 10 questions with corresponding answers.

### Head

Get headers for testing validity, accessibility, and recent modification

    HEAD /question/:question_id

ex. ```curl -i http://localhost:3000/question/1 -X HEAD```

#### Algorithm
1.	Check whether the question exists
2.	If the question does not exist, corresponding error will be returned.
3.	If the question exists, returns corresponding head information will be returned without a response body.


## Question Comments

### Create

Add new comment to question

    POST /question/:question_id/comments

ex. ```curl -i http://localhost:3000/question/1/comments -d "text=question comment text&author=my author name"```

#### Algorithm
1. Check whether the question exist
2. If the question exists, add the comments to question; otherwise, corresponding error will be returned.


### Get All

Get all comments of question

    GET /question/:question_id/comments

ex. ```curl -i http://localhost:3000/question/1/comments```

#### Algorithm
1. Check whether the question exist
2. If the question exists, get all comments to question; otherwise, corresponding error will be returned.

### Get

Get question comment with specific ID

    GET /question/:question_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/comment/1```

#### Algorithm
1. Check whether the question exist
2. If the question exists, get a specific comment of the question; otherwise, corresponding error will be returned.

### Update

Update comment of question

    PUT /question/:question_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/comment/1 -X PUT -d "text=New questioncomment text&author=my New author name"```

#### Algorithm
1. Check whether the question exist
2. If the question exists, get a specific comment of the question; otherwise, corresponding error will be returned.

### Delete

Delete comment of question

    DELETE /question/:question_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/comment/2 -X DELETE```

#### Algorithm
1.	Check whether the question exists
2.	If the question does not exist, corresponding error will be returned.
3.	Otherwise, check whether the comments to question exist.
4.	If the comment to question does not exist, corresponding error will be returned.
5.	If the comment for the question exists, delete the comment.


### Head

Get headers for testing validity, accessibility, and recent modification

    HEAD /question/:question_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/comment/1 -X HEAD```

#### Algorithm
1.	Check whether the question exists
2.	If the question does not exist, corresponding error will be returned.
3.	Otherwise, check whether the comments to question exist.
4.	If the comment to question does not exist, corresponding error will be returned.
5.	If the comment for the question exists, returns corresponding head information will be returned without a response body.


## Answers

### Create

Add new answer to question

    POST /question/:question_id/answers

ex. ```curl -i http://localhost:3000/question/1/answers -d "text=my answer text&author=the answer author"```

#### Algorithm
1. Check whether the question exists or not
2. If the question exists, add a new answer to the question, otherwise, returns corresponding errors. 


### Get all answers for a specific question

Get all answers for a specific question

    GET /question/:question_id/answers

ex. ```curl -i http://localhost:3000/question/1/answers```

#### Algorithm
1. Check whether the question exists or not.
2. If the question exists, returns all the answers which belong to the question, otherwise, returns corresponding errors. 


### Get All

Get all answers ever stored in the datastore

    GET /answers

ex. ```curl -i http://localhost:3000/answers```

#### Algorithm
1. Return all the answers in the datastore, irrespective of questions.


### Get

Get answer with specific ID

    GET /question/:question_id/answer/:answer_id

ex. ```curl -i http://localhost:3000/question/1/answer/1```

#### Algorithm
1. Check whether the question exists or not.
2. If the question exists, returns the specific answer which belongs to the question, otherwise, returns corresponding errors. 


### Update

Update answer

    PUT /question/:question_id/answer/:answer_id

ex. ```curl -i http://localhost:3000/question/1/answer/1 -X PUT -d "text=NEW answer text&author=NEW author name"```

#### Algorithm
1.	Check whether the question exists or not.
2.	If the question does not exist, returns corresponding errors.
3.	If the question exists, check whether the answer exists or not.
4.	If the answer exists, updates the specific answer which belongs to the question, otherwise, returns corresponding errors.


### Delete

Delete answer

    DELETE /question/:question_id/answer/:answer_id

ex. ```curl -i http://localhost:3000/question/1/answer/2 -X DELETE```

#### Algorithm
1.	Check whether the question exists or not.
2.	If the question does not exist, returns corresponding errors. 
3.	If the question exists, check whether answer comments which belong to the requested answer exist or not. 
4.	If there are comments for the answer, delete the answer comments before deleting the answer, otherwise, delete the answer.

### Head

Get headers for testing validity, accessibility, and recent modification

    HEAD /question/:question_id/answer/:answer_id

ex. ```curl -i http://localhost:3000/question/1/answer/1 -X HEAD```

#### Algorithm
1.	Check whether the question exists or not.
2.	If the question does not exist, returns corresponding errors.
3.	If the question exists, check whether the answer exists or not.
4.	If the answer exists, returns corresponding head information will be returned without a response body.

## Answer Comments

### Create

Add new comment to answer

    POST /question/:question_id/answer/:answer_id/comments

ex. ```curl -i http://localhost:3000/question/1/answer/1/comments -d "text=answer comment text&author=my author name"```

#### Algorithm
1.	Check whether the question exists or not.
2.	If the question does not exist, returns corresponding errors.
3.	If the question exists, check whether the answer exists or not.
4.	If the answer does not exist, returns the corresponding errors.
5.	If the answer exists, create answer comment and add it to the answer.


### Get All

Get all comments of answer

    GET /question/:question_id/answer/:answer_id/comments

ex. ```curl -i http://localhost:3000/question/1/answer/1/comments```

#### Algorithm
1.	Check whether the question exists or not.
2.	If the question does not exist, returns corresponding errors.
3.	If the question exists, check whether the answer exists or not.
4.	If the answer does not exist, returns the corresponding errors.
5.	If the answer exists, returns all the comments for the answer.


### Get

Get answer comment with specific ID

    GET /question/:question_id/answer/:answer_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/answer/1/comment/1```

#### Algorithm
1.	Check whether the question exists or not.
2.	If the question does not exist, returns corresponding errors.
3.	If the question exists, check whether the answer exists or not.
4.	If the answer does not exist, returns corresponding errors.
5.	If the answer exists, check whether the comment for it exists or not.
6.	If the answer comment exists, returns the content and metadata of the comment; otherwise, returns corresponding errors.


### Update

Update comment of answer

    PUT /question/:question_id/answer/:answer_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/answer/1/comment/1 -X PUT -d "text=New answer_comment text&author=New author name"```

#### Algorithm
1.	Check whether the question exists or not.
2.	If the question does not exist, returns corresponding errors.
3.	If the question exists, check whether the answer exists or not.
4.	If the answer does not exist, returns corresponding errors.
5.	If the answer exists, check whether the comment for it exists or not.
6.	If the answer comment exists, updates the data for the comment; otherwise, returns corresponding errors.


### Delete

Delete comment of answer

    DELETE /question/:question_id/answer/:answer_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/answer/1/comment/2 -X DELETE```

#### Algorithm
1.	Check whether the question exists or not
2.	If the question does not exist, returns corresponding errors.
3.	If the question exists, check whether the answer exists or not.
4.	If the answer does not exist, returns corresponding errors.
5.	If the answer exists, check whether the comment for it exists or not.
6.	If the answer comment exists, then the comment is deleted; otherwise, returns corresponding errors.



### Head

Get headers for testing validity, accessibility, and recent modification

    HEAD /question/:question_id/answer/:answer_id/comment/:comment_id

ex. ```curl -i http://localhost:3000/question/1/answer/1/comment/1 -X HEAD```

#### Algorithm
1.	Check whether the question exists or not.
2.	If the question does not exist, returns corresponding errors.
3.	If the question exists, check whether the answer exists or not.
4.	If the answer does not exist, returns corresponding errors.
5.	If the answer exists, check whether the comment for it exists or not.
6.	If the answer comment exists, returns corresponding head information will be returned without a response body.
