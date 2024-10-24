const uploadToS3 = async (file) => {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}${fileExtension}`; // Generate a unique file name
  
      const params = {
        Bucket: process.env.S3_BUCKET_NAME, // Your bucket name
        Key: fileName, // File name to save in S3
        Body: file.buffer, // File content
        ContentType: file.mimetype, // File MIME type
      };
  
      const command = new PutObjectCommand(params);
      await s3Client.send(command);
  
      return fileName; // Return the file name (key) that will be stored in MongoDB
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error('Error uploading to S3');
    }
  };

  module.exports = { uploadToS3 };
  