const pool = require('../db'); // PostgreSQL 연결 설정
const bcrypt = require('bcrypt');

// 사용자 추가 및 기숙사 배정
async function addUser(username, password, dormName) {
    const hashedPassword = await bcrypt.hash(password, 10); // 비밀번호 해시
    const dormIdResult = await pool.query('SELECT id FROM dorms WHERE name = $1', [dormName]);
    const dormId = dormIdResult.rows[0]?.id;

    if (!dormId) {
        throw new Error('Invalid dorm name');
    }

    await pool.query(
        'INSERT INTO users (username, password, dorm_id) VALUES ($1, $2, $3)',
        [username, hashedPassword, dormId]
    );
}

// 특정 사용자의 기숙사 확인
async function getUserDorm(username) {
    const result = await pool.query(
        `SELECT u.username, d.name AS dorm_name
        FROM users u
        JOIN dorms d ON u.dorm_id = d.id
        WHERE u.username = $1`,
        [username]
    );
    return result.rows[0];
}

module.exports = { addUser, getUserDorm };
