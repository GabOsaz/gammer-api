require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const jwtDecode = require('jwt-js-decode');
const jwtDecode = require('jwt-decode');
const jwtJsDecode = require('jwt-js-decode');
const mongoose = require('mongoose');
const jwt = require('express-jwt');
const cookieParser = require('cookie-parser')

const User = require('./data/User');
const RegisterSchool = require('./data/RegisterSchool');
const Fixture = require('./data/Fixture');

// const csrf = require('csurf');
// const csrfProtection = csrf({
//   cookie: true
// });

const {
  createToken,
  verifyPassword
} = require('./util');

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

//  Register a school
app.post('/api/register_school', async (req, res) => {
  try {
    const { firstName, lastName, schoolName, state, year, email, phoneNumber } = req.body;

    const existingSchool = await RegisterSchool.findOne({
      schoolName
    }).lean();

    if (existingSchool) {
      return res
        .status(400)
        .json({ message: 'School already registered' });
    }

    const schoolData = {
      gameMasterFirstName: firstName,
      gameMasterLastName: lastName,
      schoolName,
      state,
      yearFounded: year,
      email,
      phoneNumber,
      accepted: false
    };

    const registeredSchool = new RegisterSchool(schoolData);
    await registeredSchool.save();

    res.status(201).json({
      message: 'Successfully Registered!',
      registeredSchool
    });
  } catch (err) {
    // console.log(err);
    return res.status(400).json({
      message: 'There was a problem registering the school'
    });
  }
});

// Login an admin
app.post('/api/authenticate', async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log(req, 'req')

    const user = await User.findOne({
      email
    }).lean();
    // console.log(user)

    if (!user) {
      return res.status(403).json({
        message: 'Wrong email or password.'
      });
    }

    const passwordValid = verifyPassword(
      password,
      user.password
    );
    // console.log(password, user.password)

    if (passwordValid) {
      const { password, ...rest } = user;
      const userInfo = Object.assign({}, { ...rest });

      const token = createToken(userInfo);

      const decodedToken = jwtJsDecode.jwtDecode(token);
      // console.log(decodedToken.payload.exp > decodedToken.payload.iat)
      const expiresAt = decodedToken.payload.exp;

      // res.cookie('token', token, {
      //   httpOnly: true
      // })

      res.json({
        message: 'Authentication successful!',
        token,
        userInfo,
        expiresAt
      });
    } else {
      res.status(403).json({
        message: 'Wrong email or password.'
      });
    }
  } catch (err) {
    console.log(err);
    if(err.status < 500) {
      return res
        .status(err.status)
        .json({ message: 'Something went wrong.' });
    } else {
      res
        .status(err.status)
        .json({ message: "Internal Server Error" });
    }
  }
});

// Register a school
// app.post('/api/signup', async (req, res) => {
//   try {
//     const { email } = req.body;

//     const hashedPassword = await hashPassword(
//       req.body.password
//     );

//     const userData = {
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       role: 'admin'
//     };

//     const existingEmail = await User.findOne({
//       email: userData.email
//     }).lean();

//     if (existingEmail) {
//       return res
//         .status(400)
//         .json({ message: 'Email already exists' });
//     }

//     const newUser = new User(userData);
//     const savedUser = await newUser.save();

//     if (savedUser) {
//       const token = createToken(savedUser);
//       const decodedToken = jwtDecode(token);
//       const expiresAt = decodedToken.exp;

//       const {
//         email,
//         role
//       } = savedUser;

//       const userInfo = {
//         email,
//         role
//       };

//       res.cookie('token', token, {
//         httpOnly: true
//       })

//       return res.json({
//         message: 'User created!',
//         token,
//         userInfo,
//         expiresAt
//       });
//     } else {
//       return res.status(400).json({
//         message: 'There was a problem creating your account'
//       });
//     }
//   }
//   catch (err) {
//     return res.status(400).json({
//       message: 'There was a problem creating your account'
//     });
//   }
// });

const attachUser = (req, res, next) => {
  const token = req.headers.authorization.slice(7); // only with localStorage
  // const token = req.cookies.token
  if(!token) {
    return res.status(401).json({message: 'Authentication invalid'})
  }
  // const decodedToken = jwtDecode(token.slice(7));   only with localStorage
  const decodedToken = jwtJsDecode.jwtDecode(token);
  if(!decodedToken) {
    return res.status(401).json({message: 'There was a problem authorizing your token'})
  } else {
    req.user = decodedToken;
    // console.log(decodedToken)
    next();
  }
}

app.use(attachUser);

// Verify Token
const checkJwt = jwt({
  secret: process.env.JWT_SECRET,
  getToken: req => req.headers.authorization.slice(7)
  // getToken: req => req.cookies.token
})

// app.use(csrfProtection);

// app.get('api/csrf-token', (req, res) => {
//   res.json({ csrfToken: req.csrfToken()});
// })

// app.use((req, res, next) => {
//   console.log(req.header);
//   next();
// })

app.use(checkJwt)

const requireAdmin = (req, res, next) => {
  const { role } = req.user;
  if(role !== 'admin') {
    return res.status(401).json({message: 'Insufficient role'});
  }
  next();
}

app.use(requireAdmin)

// Accept a school's registration
app.patch('/api/accept_school', async (req, res) => {
  try {
    const { accepted, id } = req.body;
    await RegisterSchool.findOneAndUpdate(
      { _id: id },
      { accepted }
    );
    res.json({
      message:
        'Successful!'
    });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

// Create a match fix
app.post('/api/match_fix', async (req, res) => {
  try {
    const { fixture } = req.body

    const data = {
      fixture
    };

    const newFixture = new Fixture(data);
    await newFixture.save();

    res.status(201).json({
      message: 'Successfully Created!',
      newFixture
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      message: 'There was a problem creating the fixture'
    });
  }
});

// Fetch Registered Schools
app.get('/api/registered_schools', async (req, res) => {
  try {
    const registeredSchools = await RegisterSchool.find()
      .lean()

    res.json({
      registeredSchools
    });
  } catch (err) {
    return res.status(400).json({
      message: 'There was a problem getting the registered schools'
    });
  }
})

// Fetch Math Fixtures
app.get('/api/match_fixtures', async (req, res) => {
  try {
    const fixtures = await Fixture.find()
      .lean()

    res.json({
      fixtures
    });
  } catch (err) {
    return res.status(400).json({
      message: 'There was a problem getting match fixtures'
    });
  }
})

async function connect() {
  const PORT = process.env.PORT || 3001
  try {
    mongoose.Promise = global.Promise;
    await mongoose.connect(process.env.ATLAS_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });
    console.log('Mongoose connected');
  } catch (err) {
  }
  

  app.listen(PORT, () => console.log(`Server has started on ${PORT}.`));
  // app.listen(3001);
  // console.log('API listening on localhost:3001');
}

connect();
