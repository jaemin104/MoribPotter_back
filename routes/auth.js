const express = require('express');
const { register, login } = require('../controllers/authController');
const router = express.Router();

// 회원가입 엔드포인트
router.post('/register', register);

// 로그인 엔드포인트
router.post('/login', login);

module.exports = router;
