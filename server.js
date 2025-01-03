const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
require('dotenv').config();

const app = express();

// 정적 파일 서빙
app.use(express.static(__dirname)); // 현재 디렉토리에서 정적 파일 제공

// 세션 설정
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// 사용자 직렬화/역직렬화
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
    done(null, { provider: 'google', ...profile });
}));

// Naver OAuth Strategy
passport.use(new NaverStrategy({
    clientID: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET,
    callbackURL: '/auth/naver/callback',
}, (accessToken, refreshToken, profile, done) => {
    done(null, { provider: 'naver', ...profile });
}));

// Google 로그인 엔드포인트
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/home'); // 성공 시 홈 화면으로 리디렉트
    }
);

// Naver 로그인 엔드포인트
app.get('/auth/naver', passport.authenticate('naver'));
app.get('/auth/naver/callback',
    passport.authenticate('naver', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/home'); // 성공 시 홈 화면으로 리디렉트
    }
);

// 홈 화면
app.get('/home', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.send(`<h1>Welcome ${req.user.displayName || req.user.id} (Provider: ${req.user.provider})</h1>`);
});

// 로그아웃
app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/');
    });
});

// 서버 실행
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
