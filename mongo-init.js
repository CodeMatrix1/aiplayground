// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Create the database
db = db.getSiblingDB('aiplayground');

// Create a user for the application
db.createUser({
  user: 'aiplayground_user',
  pwd: 'aiplayground_password',
  roles: [
    {
      role: 'readWrite',
      db: 'aiplayground'
    }
  ]
});

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('accounts');
db.createCollection('sessions');
db.createCollection('verificationTokens');
db.createCollection('tasks');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.accounts.createIndex({ "provider": 1, "providerAccountId": 1 }, { unique: true });
db.sessions.createIndex({ "sessionToken": 1 }, { unique: true });
db.verificationTokens.createIndex({ "identifier": 1, "token": 1 }, { unique: true });
db.tasks.createIndex({ "userId": 1, "createdAt": -1 });
db.tasks.createIndex({ "type": 1, "status": 1 });

print('MongoDB initialization completed successfully!');
