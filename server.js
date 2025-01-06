const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();

// Body parser 추가
app.use(bodyParser.json());

// MySQL 연결 설정
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // 비밀번호가 없을 경우 비워둠
    database: 'kakao_users',
});

db.connect(err => {
    if (err) {
        console.error('MySQL 연결 오류:', err);
        return;
    }
    console.log('MySQL에 연결되었습니다.');
});

// 닉네임 저장 엔드포인트 (새 사용자 등록)
app.post('/auth/save', (req, res) => {
    const { nickname } = req.body;

    if (!nickname) {
        return res.status(400).send('닉네임이 필요합니다.');
    }

    // MySQL에 닉네임 저장
    const query = 'INSERT INTO users (nickname) VALUES (?) ON DUPLICATE KEY UPDATE nickname = VALUES(nickname)';
    db.query(query, [nickname], (err, results) => {
        if (err) {
            console.error('MySQL 데이터 저장 오류:', err);
            return res.status(500).send('데이터베이스 오류');
        }
        console.log('MySQL에 닉네임 저장 완료:', results);
        res.status(200).send('닉네임 저장 성공');
    });
});

// 닉네임 및 기숙사 정보 확인 엔드포인트
app.post('/auth/check_dorm', (req, res) => {
    const { nickname } = req.body;

    if (!nickname) {
        return res.status(400).send('닉네임이 필요합니다.');
    }

    // 닉네임과 기숙사 정보 확인
    const query = 'SELECT dorm FROM users WHERE nickname = ?';
    db.query(query, [nickname], (err, results) => {
        if (err) {
            console.error('MySQL 쿼리 오류:', err);
            return res.status(500).send('데이터베이스 오류');
        }

        if (results.length > 0 && results[0].dorm) {
            res.json({ status: 'existing_user', dorm: results[0].dorm });
        } else {
            res.json({ status: 'new_user' });
        }
    });
});

// 기숙사 정보 저장 엔드포인트
app.post('/auth/save_dorm', (req, res) => {
    const { nickname, dorm } = req.body;

    if (!nickname || !dorm) {
        return res.status(400).send('닉네임과 기숙사 정보가 필요합니다.');
    }

    // 기숙사 정보 저장
    const query = 'UPDATE users SET dorm = ? WHERE nickname = ?';
    db.query(query, [dorm, nickname], (err, results) => {
        if (err) {
            console.error('MySQL 업데이트 오류:', err);
            return res.status(500).send('데이터베이스 오류');
        }
        console.log('기숙사 정보 저장 완료:', results);
        res.status(200).send('기숙사 저장 성공');
    });
});

// 서버 실행
app.listen(80, () => {
    console.log('Server running on http://172.10.7.89');
});
