const express = require('express');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();
app.use(express.json()); // JSON 요청 처리

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google 토큰 검증 엔드포인트
app.post('/auth/verify-token', async (req, res) => {
    const { idToken } = req.body; // Android 앱에서 전달된 토큰

    try {
        // Google 서버에서 ID 토큰 검증
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID, // OAuth 클라이언트 ID
        });
        const payload = ticket.getPayload(); // 사용자 정보
        res.json({ success: true, user: payload });
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
});

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
