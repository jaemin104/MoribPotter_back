const express = require('express');
const axios = require('axios');
const app = express();

const KAKAO_CLIENT_ID = '9943d240d80a6557fa24722f4cff4047'; // REST API 키
const REDIRECT_URI = 'http://localhost:3000/auth/kakao/callback';

// 카카오 인증 URL로 리다이렉트
app.get('/auth/kakao', (req, res) => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
    res.redirect(kakaoAuthUrl);
});

// 카카오 인증 콜백 처리
app.get('/auth/kakao/callback', async (req, res) => {
    const code = req.query.code;

    try {
        // 액세스 토큰 요청
        const tokenResponse = await axios.post(
            'https://kauth.kakao.com/oauth/token',
            null,
            {
                params: {
                    grant_type: 'authorization_code',
                    client_id: KAKAO_CLIENT_ID,
                    redirect_uri: REDIRECT_URI,
                    code,
                },
            }
        );

        const { access_token } = tokenResponse.data;

        // 사용자 정보 요청
        const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const user = userResponse.data;

        res.json({
            accessToken: access_token,
            email: user.kakao_account.email,
            nickname: user.properties.nickname,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('카카오 로그인 실패');
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
