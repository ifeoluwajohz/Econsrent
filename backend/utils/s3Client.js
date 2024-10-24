const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config(); // Load environment variables

const s3Client = new S3Client({
    region: 'eu-north-1', // Matches the new endpoint region
    // endpoint: 'ifeoluwabucket.s3.eu-north-1.amazonaws.com', // Replace with your bucket name

    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

module.exports = { s3Client };