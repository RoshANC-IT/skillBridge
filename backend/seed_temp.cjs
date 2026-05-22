const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
    await mongoose.connect('mongodb://127.0.0.1:27017/skillbridge');
    const db = mongoose.connection.useDb('skillbridge');

    const employerPassword = await bcrypt.hash('password123', 10);
    await db.collection('users').updateOne(
        { email: 'teste1@sb.com' },
        {
            $set: {
                firstName: 'Test', lastName: 'Employer', username: 'teste1',
                email: 'teste1@sb.com', password: employerPassword, role: 'employer',
                city: 'Pune'
            }
        },
        { upsert: true }
    );

    const workerPassword = await bcrypt.hash('password123', 10);
    await db.collection('users').updateOne(
        { email: 'testw1@sb.com' },
        {
            $set: {
                firstName: 'Test', lastName: 'Worker', username: 'testw1',
                email: 'testw1@sb.com', password: workerPassword, role: 'worker',
                workerType: 'Plumber', city: 'Pune', phone: '+919876543210',
                availability: 'available'
            }
        },
        { upsert: true }
    );

    console.log('Seed done');
    process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
