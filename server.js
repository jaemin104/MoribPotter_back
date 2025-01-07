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

// 닉네임으로 user_id 조회 엔드포인트
app.post('/auth/get_user_id', (req, res) => {
    const { nickname } = req.body;

    if (!nickname) {
        return res.status(400).send('닉네임이 필요합니다.');
    }

    const query = 'SELECT id FROM users WHERE nickname = ?';
    db.query(query, [nickname], (err, results) => {
        if (err) {
            console.error('MySQL 쿼리 오류:', err);
            return res.status(500).send('데이터베이스 오류');
        }

        if (results.length > 0) {
            res.json({ user_id: results[0].id });
        } else {
            res.status(404).send('사용자를 찾을 수 없습니다.');
        }
    });
});

// 점수 저장 엔드포인트
app.post('/scores/save', (req, res) => {
    const { user_id, score } = req.body;

    if (!user_id || score === undefined) {
        return res.status(400).send('user_id와 score가 필요합니다.');
    }

    const query = 'INSERT INTO scores (user_id, score) VALUES (?, ?)';
    db.query(query, [user_id, score], (err, results) => {
        if (err) {
            console.error('MySQL 점수 저장 오류:', err);
            return res.status(500).send('데이터베이스 오류');
        }
        console.log('점수 저장 완료:', results);
        res.status(200).send('점수 저장 성공');
    });
});

// 개인 점수 기록 조회 엔드포인트
app.post('/scores/get_user_scores', (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).send('user_id가 필요합니다.');
    }

    const query = 'SELECT score, timestamp FROM scores WHERE user_id = ? ORDER BY timestamp DESC';
    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error('MySQL 쿼리 오류:', err);
            return res.status(500).send('데이터베이스 오류');
        }
        res.json(results);
    });
});

// 전체 랭킹 조회 엔드포인트
app.get('/scores/leaderboard', (req, res) => {
    const query = `
        SELECT
        RANK() OVER (ORDER BY MAX(s.score) DESC) AS \`rank\`,
        u.nickname,
        u.dorm,
        MAX(s.score) AS best_score
        FROM users u
        JOIN scores s ON u.id = s.user_id
        GROUP BY u.id, u.nickname, u.dorm
        ORDER BY \`rank\`
        LIMIT 10
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('MySQL 쿼리 오류:', err);
            return res.status(500).send('데이터베이스 오류');
        }
        res.json(results);
    });
});

// 모든 레시피와 재료 정보를 가져오는 API
app.get('/recipes', (req, res) => {
    const query = `
        SELECT 
            r.id AS recipe_id, 
            r.portion_name, 
            r.full_time,
            r.image_path AS recipe_image,
            i1.name AS fir_name, i1.image_path AS fir_image, r.fir_time,
            i2.name AS sec_name, i2.image_path AS sec_image, r.sec_time,
            i3.name AS thi_name, i3.image_path AS thi_image, r.thi_time
        FROM recipes r
        JOIN ingredients i1 ON r.fir_id = i1.id
        JOIN ingredients i2 ON r.sec_id = i2.id
        JOIN ingredients i3 ON r.thi_id = i3.id;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('MySQL 쿼리 오류:', err);
            return res.status(500).send('데이터베이스 오류');
        }

        // 데이터를 포맷팅하여 반환
        const formattedResults = results.map(recipe => ({
            recipe_id: recipe.recipe_id,
            portion_name: recipe.portion_name,
            full_time: recipe.full_time,
            recipe_image: recipe.recipe_image,
            ingredients: [
                {
                    name: recipe.fir_name,
                    time: recipe.fir_time,
                    image: recipe.fir_image,
                },
                {
                    name: recipe.sec_name,
                    time: recipe.sec_time,
                    image: recipe.sec_image,
                },
                {
                    name: recipe.thi_name,
                    time: recipe.thi_time,
                    image: recipe.thi_image,
                },
            ],
        }));

        res.json(formattedResults);
    });
});

// 특정 레시피를 ID로 조회하는 API
app.get('/recipes/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT 
            r.id AS recipe_id, 
            r.portion_name, 
            r.full_time,
            r.image_path AS recipe_image,
            i1.name AS fir_name, i1.image_path AS fir_image, r.fir_time,
            i2.name AS sec_name, i2.image_path AS sec_image, r.sec_time,
            i3.name AS thi_name, i3.image_path AS thi_image, r.thi_time
        FROM recipes r
        JOIN ingredients i1 ON r.fir_id = i1.id
        JOIN ingredients i2 ON r.sec_id = i2.id
        JOIN ingredients i3 ON r.thi_id = i3.id
        WHERE r.id = ?;
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('MySQL 쿼리 오류:', err);
            return res.status(500).send('데이터베이스 오류');
        }

        if (results.length === 0) {
            return res.status(404).send('레시피를 찾을 수 없습니다.');
        }

        const recipe = results[0];
        const formattedRecipe = {
            recipe_id: recipe.recipe_id,
            portion_name: recipe.portion_name,
            full_time: recipe.full_time,
            recipe_image: recipe.recipe_image,
            ingredients: [
                {
                    name: recipe.fir_name,
                    time: recipe.fir_time,
                    image: recipe.fir_image,
                },
                {
                    name: recipe.sec_name,
                    time: recipe.sec_time,
                    image: recipe.sec_image,
                },
                {
                    name: recipe.thi_name,
                    time: recipe.thi_time,
                    image: recipe.thi_image,
                },
            ],
        };

        res.json(formattedRecipe);
    });
});


// 서버 실행
app.listen(80, () => {
    console.log('Server running on http://172.10.7.89');
});
