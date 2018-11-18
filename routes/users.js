const express = require('express');
const router  = express.Router();
const User = require("../models/User");
const Course = require("../models/Course");

// Bcrypt to encrypt passwords
const bcrypt = require("bcryptjs");
const bcryptSalt = 10;

/* Ensure logged in middleware */
function ensureAuthenticated(req, res, next) {
  if (req.user) {
    return next();
  } else {
    res.redirect('/auth/login')
  }
}

/// USERS

/* GET user profile page */
router.get('/user-profiles', ensureAuthenticated, (req, res, next) => {
  User.find()
  .then(userData => {
    res.render('user-profiles/user-overview', {userData});
  })
  .catch(err => console.log("User Profile Error", err))
});

/* GET user edit page */
router.get('/user-profiles/edit', ensureAuthenticated, (req, res, next) => {
  let id = req.user._id
  User.findById(id)
  .then(userData => {
    res.render("user-profiles/edit", {userData});
  })
});

/* POST user edit page */
router.post("/user-profiles", ensureAuthenticated, (req, res, next) => {
  let id = req.user._id
  const {username, role} = req.body
  User.findByIdAndUpdate(id, {
    username: req.body.username,
    role: req.body.role,
  })
  .then(updateUser => (
    res.redirect("/users/user-profiles")
  ))
  })

  /* GET add user page*/
router.get('/signup', checkRole("Boss"), (req, res, next) => {
    User.find()
    .then(userData => {
      res.render("user-profiles/signup", {userData});
    })
});

  /* POST add user page*/
router.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const role = req.body.role;
  if (username === "" || password === "" || role === "") {
    res.render("user-profiles/signup", { message: "Indicate username, password and role" });
    return;
  }

  User.findOne({ username }, "username", (err, user) => {
    if (user !== null) {
      res.render("user-profiles/signup", { message: "The username already exists" });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      username,
      password: hashPass,
      role,
    });

    newUser.save()
    .then(() => {
      res.redirect("/");
    })
    .catch(err => {
      res.render("user-profiles/signup", { message: "Something went wrong" });
    })
  });
});







/// COURSES

/* Check for role middleware */
function checkRole(role1, role2) {
  return (req,res,next) => {
    if(req.user && req.user.role === role1
      || req.user && req.user.role === role2) {
      next()
    }
    else {
      res.redirect('/')
    }
  }
}

/* GET course overview */
router.get('/course-overview', checkRole("TA", "Boss"), (req, res, next) => {
    Course.find()
    .then(courseData => {
      res.render('courses/course-overview', {courseData});
    })
    .catch(err => console.log("Course Overview Error", err))
  })

/* GET new course */
router.get('/new', checkRole("TA"), (req, res, next) => {
    res.render("courses/new");
  })

/* POST handle new course */
router.post("/course-overview", checkRole("TA"), (req, res, next) => {
  // Define sources for new object
  const {title, bootcamp} = req.body
  // Create new object based on form input and model
  const newCourse = new Course ({title, bootcamp})
  newCourse.save() 
  .then(addedCourse=> 
    res.redirect("/users/course-overview"))
  .catch( err =>
    console.log("error add Course", err)
    ) 
})

/* GET edit courses */
router.get('/:id/edit', checkRole("TA"), (req, res, next) => {
  let id = req.params.id
  Course.findById(id)
  .then(courseData => {
    res.render("courses/edit", {courseData});
  })
});

/* POST edit page */
router.post("/:id", checkRole("TA"), (req, res, next) => {
  let id = req.params.id
  const {title, bootcamp} = req.body
  Course.findByIdAndUpdate(id, {
    title: req.body.title,
    bootcamp: req.body.bootcamp,
  })
  .then(updateCourse => (
    // Why is the redirect to the detail page not working?
    res.redirect("/users/course-overview")
  ))
  })

/* POST delete course */
router.post("/course-overview/:id/delete", checkRole("TA"), (req, res, next) =>
Course.findByIdAndRemove(req.params.id)
.then (removedCourse => 
  res.redirect("/users/course-overview")
)
.catch( err =>
  console.log("error remove", err)
)
)

/* GET course detail page */
router.get('/:id', checkRole("TA", "Boss"), (req, res, next) => {
  let id = req.params.id
  Course.findById(id)
  .then(courseData => {
    res.render('courses/course-detail', {courseData});
  })
  .catch(err => console.log("Course Detail Error", err))
})



module.exports = router;