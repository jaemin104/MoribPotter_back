const express = require('express');
const axios = require('axios');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();

const KAKAO_CLIENT_ID = '9943d240d80a6557fa24722f4cff4047'; // REST API 키
const REDIRECT_URI = 'http://172.10.7.89/auth/kakao/callback';

// Body parser 추가 (JSON 데이터 처리)
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'kakao_users',
});

db.connect(err => {
    if (err) {
        console.error('MySQL 연결 오류:', err);
        return;
    }
    console.log('MySQL에 연결되었습니다.');
});

// 카카오 인증 URL로 리다이렉트
app.get('/auth/kakao', (req, res) => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
    res.redirect(kakaoAuthUrl);
});

// 카카오 인증 콜백 처리 (로그인 및 닉네임 저장 로직 통합)
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
        const nickname = user.properties.nickname;

        // MySQL에 닉네임 저장
        const query = 'INSERT INTO users (nickname) VALUES (?) ON DUPLICATE KEY UPDATE nickname = VALUES(nickname)';
        db.query(query, [nickname], (err, results) => {
            if (err) {
                console.error('MySQL 데이터 저장 오류:', err);
                return res.status(500).send('데이터베이스 오류');
            }
            console.log('MySQL에 닉네임 저장 완료:', results);

            // 성공 응답 반환
            res.json({
                accessToken: access_token,
                nickname: nickname,
                message: '카카오 로그인 및 닉네임 저장 성공',
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('카카오 로그인 실패');
    }
});

/*
app.get('/test', (req, res) => {
    res.status(200).send('서버 연결 성공!');
});
*/

app.listen(80, () => {
    console.log('Server running on http://172.10.7.89');
});
