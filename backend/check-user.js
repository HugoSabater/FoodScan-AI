
const { User } = require('./src/models');

async function checkUser() {
    try {
        console.log('Checking User model...');
        const user = await User.findByPk(1);
        console.log('User found:', user ? user.toJSON() : 'null');

        const allUsers = await User.findAll();
        console.log('All users:', allUsers.map(u => u.toJSON()));

    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

checkUser();
