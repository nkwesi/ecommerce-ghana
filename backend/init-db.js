const { Client } = require('pg');

async function testConnection(user, password) {
    const config = {
        host: 'localhost',
        port: 5432,
        user: user,
        password: password,
        database: 'postgres',
    };
    const client = new Client(config);
    try {
        await client.connect();
        console.log(`SUCCESS: Connected as ${user} with password ${password}`);
        return client;
    } catch (err) {
        console.log(`FAILED: ${user} / ${password} - ${err.message}`);
        return null;
    } finally {
        if (client._connected) await client.end();
    }
}

async function run() {
    const users = ['postgres', 'admin', process.env.USERNAME];
    const passwords = ['postgres', '', 'admin', 'password', '123456'];

    for (const u of users) {
        for (const p of passwords) {
            const client = await testConnection(u, p);
            if (client) {
                console.log('Continuing with successful connection...');
                // ... create DB logic if needed ...
                return;
            }
        }
    }
    console.log('All attempts failed.');
}

run();
