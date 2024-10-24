require('dotenv').config();

const User = require('../models/Agents');
const Property = require('../models/property');
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const validator = require('validator'); 

const multer = require('multer');
const path = require('path');
const { PutObjectCommand } = require('@aws-sdk/client-s3'); // Ensure this is imported
const { s3Client } = require('../utils/s3Client'); // Adjust this path accordingly
const storage = multer.memoryStorage(); // Store image in memory
const upload = multer({ storage }); // Initialize multer



const uploadToS3 = async (file) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}${fileExtension}`; // Generate a unique file name

    const params = {
        Bucket: process.env.S3_BUCKET_NAME, // Your bucket name
        Key: fileName, // File name to save in S3
        Body: file.buffer, // File content
        ContentType: file.mimetype, // File MIME type
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command); // Use the correct S3 client

    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`
    return imageUrl; // Return the file name (key) for the database
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
});


const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) =>{
    return jwt.sign({ id }, process.env.SECRET, {
        expiresIn: maxAge
    })
}

const secretOrPrivateKey = process.env.SECRET;
function PasswordToken(userId, secretOrPrivateKey) {
    const payload = { userId };
    const options = { expiresIn: '1h' }; // Adjust expiration time as needed
  
    return jwt.sign(payload, secretOrPrivateKey, options);
  }

async function generateOTP() {
    return speakeasy.totp({
        secret: process.env.SECRET,
        encoding: 'base32',
        step: 30,
    })
}

module.exports.register_post_admin = async (req, res) =>{
    const { name, email, password } = req.body;
    

    try{
        const Finduser = await User.findOne({ email });
        if(Finduser){
            return res.status(400).json({ err: 'Account already exists in database'})
        }
        const user = await User.create({name, email, password });
        // const json = res.locals.user;
        const passToken = PasswordToken(user._id, secretOrPrivateKey);
        const token = createToken(user._id, secretOrPrivateKey);
        // res.cookie('jwt', token, {httpOnly :true, maxaAge: 3600 * 1000})
        res.cookie('jwt', passToken, {httpOnly:true, maxAge: maxAge * 1000, secure: true, // Set to true if using HTTPS
            sameSite: 'lax',})
        res.status(200).json({message : "Successfully Registered the user"});

    }catch(err){
        return res.status(400).json({ err: err.message });
    }

}

module.exports.login_post_admin =  async(req, res) =>{
    const { email, password} = req.body;


    try{  
        if(email == ''){
            return res.status(400).json({message: 'Pls enter email Address'})
        }
        if(password == ''){
            return res.status(400).json({message: 'Pls enter password'})
        }
        const Finduser = await User.findOne({ email });
        if(!Finduser){
            return res.status(400).json({ errors: 'User not found in database'})
        }
        const user = await User.login( email, password );
        const token = PasswordToken(user._id, secretOrPrivateKey);

        res.cookie('jwt', token, {httpOnly:true, maxAge: maxAge * 1000, secure: true, // Set to true if using HTTPS
            sameSite: 'lax',})
        
        res.status(200).json({message: 'login successfully'});

    }catch(err){
        return res.status(400).json({ err: err.message });
    }
};

module.exports.logout_get = async(req, res)=>{
    res.cookie('jwt', '', {maxAge : 1});
    res.redirect('/home')
};

module.exports.forget_password_post = async (req, res)=> {
    const { email } = req.body;

    try{
        // Check if the email exists in the database
        const user = await User.findOne( {email} );
        if (!user) {
            return res.status(404).json({ success: false, message: 'Email not found in the database' });
        }
        const otpCode = await generateOTP();
        const otpExpiration = new Date(Date.now() + 5 * 60 * 100);

        user.otpCode = otpCode;
        user.otpExpiration = otpExpiration;
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: email,
            subject: 'Password Reset OTP',
            text: `Your one-time password for password reset is: ${otpCode}`,
        };
      
        await transporter.sendMail(mailOptions);
        // console.log(otpCode)
        res.status(201).json({Message: `Code has been sent to ${email}`})

    }catch(err){
        return res.status(500).json({ message: 'Internal server error', err: err.message})
    }

}
 
module.exports.confirm_otp_post = async (req, res)=> {
    const { email, code } = req.body
    const user = await User.findOne({ email });

    try{
        if(!user || !user.otpCode || !user.otpExpiration || user.otpExpiration < Date.now){
            return res.status(400).json({ message: 'Invalid email address or Otp'})
        }
        if(user.otpCode !== code){
            return res.status(400).json({ message: 'Incorrect code'})
        }

        user.otpCode = null;
        user.otpExpiration = null;
        await user.save();

        return res.status(200).json({ message: 'Code is correct'})
    }catch(err){
        return res.status(500).json({ message: err.message})
    }
}

module.exports.change_password_post = async (req, res)=> {
    const { email, newPassword } = req.body;
    try{
        const user = await User.findOne({ email });

        if(!user){
            return res.status(404).json({ message: `${email} not found in the database`})
        }
        if (!validator.isStrongPassword(newPassword)) {
            throw Error('Password not strong enough')
          }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)
        const token = createToken(user._id);

        user.password == hashedPassword;
        await user.save();
        res.cookie('jwt', token, {httpOnly:true, maxAge: maxAge * 1000, secure: true, // Set to true if using HTTPS
            sameSite: 'lax',})
        res.status(200).json({email});
    }catch(err){

        return res.status(500).json({ message: err.message});
    }
}

module.exports.upload_property_post = upload.array('image'), async (req, res) => {

    try {
        console.log('Received files:', req.files); // Log received files

        // Check if files are uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files were uploaded.' });
        }

        // Upload each image to S3 and collect their keys
        const imageKeys = await Promise.all(req.files.map(file => { }));

        console.log('Uploaded Image Keys:', imageKeys); // Log the keys received from S3

        // Create a new property entry
        const newProperty = new Property({
            price: req.body.price,
            location: req.body.location,
            description: req.body.description,
            size: req.body.size,
            owner: req.body.owner, // Reference to the Agent
            status: req.body.status || 'available',
            dateCreated: new Date(),
            imageKey: imageKeys, // Save the S3 image keys
        });

        // Save the property to the database
        const savedProperty = await newProperty.save();

        res.status(201).json(savedProperty); // Respond with the saved property
    } catch (error) {
        console.error('Error creating property:', error);
        res.status(500).json({ message: 'Error creating property' });
    }
};

module.exports.get_all = async (req, res) => {
try {
    const allProperties = await Property.find().skip(parseInt(req.query.skip || 0)).limit(parseInt(req.query.limit || 10));
    res.status(201).json({ properties: allProperties });
} catch (err) {
    res.status(500).json({ error: err.message });
}
};

module.exports.get_by_id = async (req, res) => {
const { id } = req.params; // Extract the ID from the URL parameters

try {
    const property = await Property.findById(id);

    if (!property) {
    console.log(id)
    return res.status(404).json({ message: 'Property not found' });
    }

    res.status(200).json(property);
} catch (err) {
    res.status(500).json({ error: err.message });
}
};