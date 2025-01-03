const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const app = express();

app.use(express.static(__dirname));
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// 사용자 정보를 세션에 저장
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Google 로그인 전략
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
    // profile 객체의 데이터 확인 및 세션 저장
    const user = {
        id: profile.id,
        displayName: profile.displayName || 'No Name',
        email: profile.emails ? profile.emails[0].value : 'No Email',
        photo: profile.photos ? profile.photos[0].value : null
    };
    return done(null, user);
}));

// Google 로그인 라우트
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => res.redirect('/home')
);

// 홈 페이지
app.get('/home', (req, res) => {
    if (req.isAuthenticated()) {
        const { displayName, email, photo } = req.user;
        res.send(`
            <h1>Welcome, ${displayName}</h1>
            <p>Email: ${email}</p>
            ${photo ? `<img src="${photo}" alt="Profile Photo" style="border-radius: 50%;" />` : ''}
            <br>
            <a href="/logout"><button>Logout</button></a>
        `);
    } else {
        res.redirect('/');
    }
});

// 로그아웃 라우트
app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            console.error('Logout Error:', err);
            return res.redirect('/error');
        }
        req.session.destroy(() => {
            res.redirect('/');
        });
    });
});

// 메인 페이지
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
    console.error('Global Error:', err);
    res.status(500).send('Something went wrong!');
});

// 서버 시작
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
