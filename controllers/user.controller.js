import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

// Helper function to dynamically determine the domain based on the request
const getDomain = (req) => {
    const host = req.hostname;
    const localHostnames = ['localhost', '127.0.0.1'];

    if (localHostnames.includes(host)) {
        return 'localhost';
    }

    const domainMap = {
        'job-portal-backend-5utw.onrender.com': 'job-portal-backend-5utw.onrender.com',
        'job-portal-backend-praveen.vercel.app': 'job-portal-backend-praveen.vercel.app',
    };

    return domainMap[host] || host;
};

export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;
         
        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };

        const file = req.file;
        const fileUri = getDataUri(file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message: 'User already exists with this email.',
                success: false,
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile: {
                profilePhoto: cloudResponse.secure_url,
            }
        });

        return res.status(201).json({
            message: "Account created successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};

export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        if (role !== user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with the current role.",
                success: false
            });
        }

        const tokenData = { userId: user._id };
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        };

        const domain = getDomain(req);

        return res.status(200)
            .cookie("token", token, {
                maxAge: 1 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                sameSite: 'none',
                secure: true,
                domain: domain
            })
            .json({
                message: `Welcome back ${user.fullname}`,
                user,
                success: true
            });
    } catch (error) {
        console.log(error);
    }
};

export const logout = async (req, res) => {
    try {
        const domain = getDomain(req);
        
        return res.status(200)
            .cookie("token", "", {
                maxAge: 0,
                httpOnly: true,
                sameSite: 'none',
                secure: true,
                domain: domain
            })
            .json({
                message: "Logged out successfully.",
                success: true
            });
    } catch (error) {
        console.log(error);
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;
        const file = req.file;

        if (file) {
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

            if (!cloudResponse) {
                throw new Error('Failed to upload file to Cloudinary.');
            }

            let skillsArray;
            if (skills) {
                skillsArray = skills.split(',');
            }

            const userId = req.id;
            let user = await User.findById(userId);

            if (!user) {
                return res.status(400).json({
                    message: 'User not found.',
                    success: false
                });
            }

            if (fullname) user.fullname = fullname;
            if (email) user.email = email;
            if (phoneNumber) user.phoneNumber = phoneNumber;
            if (bio) user.profile.bio = bio;
            if (skills) user.profile.skills = skillsArray;

            user.profile.resume = cloudResponse.secure_url;
            user.profile.resumeOriginalName = file.originalname;

            await user.save();

            user = {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                profile: user.profile
            };

            return res.status(200).json({
                message: 'Profile updated successfully.',
                user,
                success: true
            });
        } else {
            return res.status(400).json({
                message: 'No file uploaded.',
                success: false
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'An error occurred while updating the profile.',
            success: false
        });
    }
};
