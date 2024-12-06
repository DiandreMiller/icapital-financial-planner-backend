//Dependencies
const express = require('express');
const cors = require('cors');
const { body, validationResult } = require('express-validator');

//Database
const sequelize = require('./config/database');

//Configuration
const app = express();
// app.use(cors());


const allowedOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URL_DEPLOYED];

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Block postman requests

// app.use((request, response, next) => {
//     const userAgent = request.headers['user-agent'];
//     if (userAgent.includes('Postman')) {
//       return response.status(403).send('Requests from Postman are not allowed.');
//     }
//     next();
//   });
  

app.use(express.json());

// Rate limiting
const limiter = require('./middlewares/rateLimiters'); 

// Incoming request logging
const logIncomingRequest = require('./middlewares/incomingRequests');

// Validations
const signInValidation = require('./validations/userValidationsSignIn');
const signUpValidation = require('./validations/userValidationsSignUp');
const incomeValidation = require('./validations/incomeValidation');
const expenseValidation = require('./validations/expenseValidation');

//Controllers
const signInController = require('./controllers/signInController'); 
const signUpController = require('./controllers/signUpController'); 
const passkeyController = require('./controllers/passkeyController'); 
const authenticatePasskeyController = require('./controllers/authenticatePasskeyController');
const challengeController = require('./controllers/challengeController');
const incomeController = require('./controllers/userIncomeController');
//Create Income Controller
// const expenseController = require('./controllers/')

//Check incoming requests
app.use(logIncomingRequest);

//Routes
app.get('/', (request, response) => {
    response.send('Welcome to my iCapital Financial Planner App');
});

// Rate limiting and validation middleware to routes
app.post('/sign-in', limiter,
    [
        body('identifier').trim().escape().notEmpty().withMessage('Email, username, or phone number is required'),
        body('password').trim().escape().notEmpty().withMessage('Password is required')
    ], 
    async (request, response) => {
    console.log('Incoming request:', request.method, request.originalUrl);
    console.log('Request Body:', request.body);

    // Validate the incoming request
    const { error } = signInValidation().validate(request.body); 
    if (error) {
        console.log('Validation Error Sign In:', error.details);
        return response.status(400).json({ message: error.details[0].message });
    }

    // Proceed to the controller if validation passes
    signInController(request, response);
});


app.post('/sign-up', limiter, 
    [
    body('username').trim().escape().notEmpty().withMessage('Username is required'),
    body('email').trim().isEmail().escape().withMessage('Valid email is required'),
    body('password').trim().escape().notEmpty().withMessage('Password is required'),
    body('dateOfBirth').isDate().withMessage('Valid date of birth is required'),
    body('phoneNumber').trim().optional().escape().isMobilePhone().withMessage('Valid phone number is required')
], 
async (request, response) => {
    console.log('Incoming request:', request.method, request.originalUrl);
    console.log('Request Body:', request.body);

     // Validate the incoming request
     const errors = validationResult(request);
     if (!errors.isEmpty()) {
         console.log('Validation Error Sign Up:', errors.array());
         return response.status(400).json({ message: errors.array() });
     }

    // Validate the incoming request
    const { error } = signUpValidation().validate(request.body);
    if (error) {
        console.log('Validation Error Sign Up:', error.details);
        return response.status(400).json({ message: error.details[0].message });
    }

    await signUpController(request, response);
});

app.post('/register-passkey', logIncomingRequest, limiter, passkeyController.registerPasskey);
app.post('/verify-passkey', logIncomingRequest, limiter, passkeyController.verifyPasskey);
app.post('/authenticate-passkey', logIncomingRequest, limiter, authenticatePasskeyController.authenticatePasskey);

app.get('/generate-challenge',  challengeController);

app.get('*', (request, response) => {
    response.status(404).send('Page not found again');
});

// Error handling middleware
app.use((err, request, response, next) => {
    console.error(err.stack); 
    response.status(500).json({ message: 'Server error', error: err.message }); 
});


module.exports = app;