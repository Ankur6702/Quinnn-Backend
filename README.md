# Quinnn Backend

## Tech Stack
- [NodeJS](https://nodejs.org/en)
- [ExpressJS](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Rest API](https://developers.google.com/fit/rest/v1/get-started)
- [Swagger](https://swagger.io/)
- [Google APIs](https://cloud.google.com/apis/docs/overview) essentially the [Google Perspective API](https://perspectiveapi.com/).

## Documentation

[API Documentation](https://quinnn.azurewebsites.net/docs/)

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

- `MONGO_URI` is used to connect the project to a MongoDB database.
- `JWT_SECRET` is used for encoding and decoding JSON Web Tokens (JWT) for user authentication.
- `EMAIL_ID` and `EMAIL_PASSWORD` are used for sending email notifications to users from the application.
- `PERSPECTIVE_API_KEY` and `PERSPECTIVE_API_URL` are used to integrate Google's Perspective API for detecting and filtering out toxic content from user posts and comments.
- **Optional:** `PROD_URL` and `CLIENT_URL` are used for setting up the URLs for the production and client versions of the application.

## Installation

Install the project with yarn/npm.

Clone the repository


```bash
  git clone https://github.com/Ankur6702/Quinnn-Backend.git
```

Enter in cloned the directory

```bash
  cd Quinnn-Backend
```

Install Node modules in the cloned folder

```bash
  npm install
```

Start the server in production mode with

```bash
  npm start
```

Start the server in development mode with

```bash
  npm run dev
```

## Feedback or Support

For any feedback or support, email us on 2020kucp1096@iiitkota.ac.in.
