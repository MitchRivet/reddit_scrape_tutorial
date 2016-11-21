var express = require('express');
var sentiment = require('sentiment');
var request = require('request');

//initialize express
var app = express();

function *findReplies(comments) {
    for (var i = 0; i < comments.length; i++) {
        var commentMeta = comments[i].data;
        if (commentMeta.body && commentMeta.author !== "[deleted]") {
          var score = sentiment(commentMeta.body);
          yield {
            author: commentMeta.author,
            body: commentMeta.body,
            score: score
          };
        }

        if (commentMeta.replies) {
          yield *findReplies(commentMeta.replies.data.children);
        }
      }
}

app.get('/scrape', (req, res) => {
    var flatComments = [];
    //feel free to use any comment thread you want, as long as it is appended as .json
    var url = 'https://www.reddit.com/r/politics/comments/5bu1u6/if_you_vote_for_trump_you_own_the_racism_yes_you/.json';
    request(url, (err, response, body) => {
        if (err) {
            console.log(err);
        } else {
            let commentJSON = JSON.parse(response.body);

            //this is where the comment section lives
            let comments = commentJSON[1].data.children;

            var getReply = findReplies(comments);
            var replyGrab = getReply.next();

            while (!replyGrab.done) {
              flatComments.push(replyGrab.value);
              replyGrab = getReply.next();
            }

            if (replyGrab.done) {
                res.json({title: url, comments: flatComments });
            }
        }
        });
});

app.listen('8081');

console.log('Listening on port 8081');
exports = module.exports = app;
