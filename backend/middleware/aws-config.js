require('dotenv').config();
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');


// AWS S3 setup using AWS SDK v3
const s3Client = new S3Client({
  region: 'ca-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});