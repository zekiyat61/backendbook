import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { User } from '../model/userModel.js'; 

const router = express.Router();

// Helper Function to Generate JWT
const generateToken = (userId) => {
    const payload = { id: userId };
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
};
const sendVerificationEmail = async (email, token) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // or any other service
        auth: {
            user: process.env.EMAIL, // Add this to your .env
            pass: process.env.EMAIL_PASSWORD, // Add this to your .env
        },
    });

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Verify your email',
        html: `<p>Click <a href="https://frontendbook-gamma.vercel.app/user/verify?token=${token}">here</a> to verify your email.</p>`,
    };
    await transporter.sendMail(mailOptions);
};

// Middleware to Authenticate User
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication token missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id; // Attach user ID to the request
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Signup Endpoint
router.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;
    console.log('here');
    
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
       
        // Save the user
        const newUser = new User({ username, password: hashedPassword, email, verificationToken });
        const verificationToken = jwt.sign(
            { userId: newUser._id, isLogged: true },
            "your_secret_key", // Use this key for development
            { expiresIn: "1h" }
          );
        await newUser.save();

        // send email verfication

       await sendVerificationEmail(email,verificationToken)
       
       console.log('done');
       
        res.status(201).json({ message: 'Verfication email sent to your email' });
    } catch (error) {
        console.error(error);
        res.status(400).json({error,message:"error while verfication send"});
    }
});

// Signin Endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isEmailVerified){
            return res.status(401).json({ message: 'Email not Verfied' });
        }
        // Generate a token
        const token = jwt.sign(
            { userId: user._id, isLogged: true },
            "your_secret_key", // Use this key for development
            { expiresIn: "1h" }
          );
        res.status(200).json({ message: 'Login successful', token,username:user.username});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Profile Endpoint (Protected)
router.get('/profile', authenticate, async (req, res) => {
    try {
        // Find the user based on the authenticated user ID
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/verify',async (req,res)=>{
try {
    const { token } = req.query;
    const user = await User.findOne({verificationToken:token})
    if (user){
        user.isEmailVerified = true;
        user.verificationToken = null;
        await user.save();
        res.status(201).json({ message: 'Email Verified successfully' });
    }
    else {
        return res.status(404).json({ message: 'Invalid token' });
    }
} catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
}
})
export default router;