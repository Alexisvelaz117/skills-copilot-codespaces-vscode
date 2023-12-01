// Create web server with express
const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

// Create the express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Store comments
const commentsByPostId = {};

// Get comments from a post
app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});

// Create a comment on a post
app.post('/posts/:id/comments', async (req, res) => {
    // Generate a random id
    const commentId = randomBytes(4).toString('hex');
    // Get the post id
    const { id } = req.params;
    // Get the comment
    const { content } = req.body;
    // Get the comments for the post
    const comments = commentsByPostId[id] || [];
    // Add the comment to the post
    comments.push({ id: commentId, content, status: 'pending' });
    // Save the comments
    commentsByPostId[id] = comments;
    // Emit event on event bus
    await axios.post('http://event-bus-srv:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: id,
            status: 'pending'
        }
    });
    // Send the comments
    res.status(201).send(comments);
});

// Handle events from event bus
app.post('/events', async (req, res) => {
    // Get the event type
    const { type } = req.body;
    // If the event is a comment moderated event
    if (type === 'CommentModerated') {
        // Get the event data
        const { data } = req.body;
        // Get the post id
        const { postId, id, status, content } = data;
        // Get the comments for the post
        const comments = commentsByPostId[postId];
        // Find the comment
        const comment = comments.find(comment => {
            return comment.id === id;
        });
        // Update the comment status
        comment.status = status;
        // Emit event on event bus
        await axios.post('http://event
