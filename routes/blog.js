// Npm Packages
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const { fetchUser } = require('../middleware/fetchUser');

// Models
const Blog = require('../models/Blog');

// Local functions
const logger = require('../logger');

dotenv.config();

// To create a new blog
router.post('/create', fetchUser, [
    body('title', 'Title must be atleast 5 characters').isLength({ min: 5 }),
    body('content', 'Content must be atleast 10 characters').isLength({ min: 5 }),
    body('imageURL', 'Image URL must be a valid URL').optional()
], async (req, res) => {
    try {
        logger.info('Creating a new blog');
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.error('Invalid input');
            return res.status(400).json({ status: 'error', message: errors.array() });
        }
        const { title, content, imageURL } = req.body;
        const blog = new Blog({
            title,
            content,
            author: req.userId,
            imageURL
        });
        const savedBlog = await blog.save();
        logger.info('Blog created successfully');
        res.json({ status: 'success', message: 'Blog created successfully', blog: savedBlog });
    } catch (error) {
        logger.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});

// To fetch a blog
router.get('/fetch/:id', async (req, res) => {
    try {
        logger.info('Fetching a blog');
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            logger.error('Blog not found');
            return res.status(404).json({ status: 'error', message: 'Blog not found' });
        }
        logger.info('Blog fetched successfully');
        res.json({ status: 'success', message: 'Blog fetched successfully', blog });
    } catch (error) {
        logger.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});


// To update a blog
router.put('/update/:id', fetchUser, [
    body('title', 'Title must be atleast 5 characters').isLength({ min: 5 }),
    body('content', 'Content must be atleast 10 characters').isLength({ min: 5 }),
    body('imageURL', 'Image URL must be a valid URL').optional()
], async (req, res) => {
    try {
        logger.info('Updating a blog');
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.error('Invalid input');
            return res.status(400).json({ status: 'error', message: errors.array() });
        }
        
        logger.info('Checking if blog exists');
        let blog = await Blog.findById(req.params.id);
        if (!blog) {
            logger.error('Blog not found');
            return res.status(404).json({ status: 'error', message: 'Blog not found' });
        }

        logger.info('Checking if user is authorized to update the blog');
        if (blog.author.toString() !== req.userId) {
            logger.error('User not authorized to update the blog');
            return res.status(401).json({ status: 'error', message: 'User not authorized to update the blog' });
        }

        logger.info('Updating the blog');
        const { title, content, imageURL } = req.body;
        if(title) blog.title = title;
        if(content) blog.content = content;
        if(imageURL || imageURL === '') blog.imageURL = imageURL;

        logger.info('Saving the blog');
        const savedBlog = await blog.save();
        logger.info('Blog updated successfully');
        res.json({ status: 'success', message: 'Blog updated successfully', blog: savedBlog });
    } catch (error) {
        logger.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});


// To delete a blog
router.delete('/delete/:id', fetchUser, async (req, res) => {
    logger.info('Deleting a blog');
    try {
        logger.info('Checking if blog exists');
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            logger.error('Blog not found');
            return res.status(404).json({ status: 'error', message: 'Blog not found' });
        }

        logger.info('Checking if user is authorized to delete the blog');
        // @ts-ignore
        if (blog.author.toString() !== req.userId) {
            logger.error('User not authorized to delete the blog');
            return res.status(401).json({ status: 'error', message: 'User not authorized to delete the blog' });
        }

        logger.info('Deleting the blog');
        await Blog.findByIdAndDelete(req.params.id);
        logger.info('Blog deleted successfully');
        res.json({ status: 'success', message: 'Blog deleted successfully' });
    } catch (error) {
        logger.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Upvote a blog
router.put('/upvote/:id', fetchUser, async (req, res) => {
    logger.info('Upvoting a blog');
    try {
        // @ts-ignore
        const userId = req.userId;
        logger.info('Checking if blog exists');
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            logger.error('Blog not found');
            return res.status(404).json({ status: 'error', message: 'Blog not found' });
        }

        logger.info('Checking if user has already upvoted the blog');
        if (blog.upvotes.includes(userId)) {
            logger.error('User has already upvoted the blog');
            return res.status(400).json({ status: 'error', message: 'User has already upvoted the blog' });
        }

        logger.info('Checking if user has already downvoted the blog');
        if (blog.downvotes.includes(userId)) {
            logger.info('Removing the downvote');
            const index = blog.downvotes.indexOf(userId);
            blog.downvotes.splice(index, 1);
        }

        logger.info('Adding the upvote');
        blog.upvotes.push(userId);
        const savedBlog = await blog.save();
        logger.info('Blog upvoted successfully');
        res.json({ status: 'success', message: 'Blog upvoted successfully', blog: savedBlog });
    } catch (error) {
        logger.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});


// Downvote a blog
router.put('/downvote/:id', fetchUser, async (req, res) => {
    logger.info('Downvoting a blog');
    try {
        // @ts-ignore
        const userId = req.userId;
        logger.info('Checking if blog exists');
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            logger.error('Blog not found');
            return res.status(404).json({ status: 'error', message: 'Blog not found' });
        }

        logger.info('Checking if user has already downvoted the blog');
        if (blog.downvotes.includes(userId)) {
            logger.error('User has already downvoted the blog');
            return res.status(400).json({ status: 'error', message: 'User has already downvoted the blog' });
        }

        logger.info('Checking if user has already upvoted the blog');
        if (blog.upvotes.includes(userId)) {
            logger.info('Removing the upvote');
            const index = blog.upvotes.indexOf(userId);
            blog.upvotes.splice(index, 1);
        }

        logger.info('Adding the downvote');
        blog.downvotes.push(userId);
        const savedBlog = await blog.save();
        logger.info('Blog downvoted successfully');
        res.json({ status: 'success', message: 'Blog downvoted successfully', blog: savedBlog });
    } catch (error) {
        logger.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Fetch all blogs of logged in user
router.get('/myblogs', fetchUser, async (req, res) => {
    logger.info('Fetching all blogs of logged in user');
    try {
        // @ts-ignore
        const userId = req.userId;
        logger.info('Fetching all blogs of logged in user');
        const blogs = await Blog.find({ author: userId});
        logger.info('Blogs fetched successfully');
        res.json({ status: 'success', message: 'Blogs fetched successfully', blogs });
    } catch (error) {
        logger.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;