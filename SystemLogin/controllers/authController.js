// controllers/authController.js
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/userModel");

// Store OTPs temporarily (consider moving to a DB)
const otpStore = {};

// Simple nodemailer transport (no OAuth required)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use app password for Gmail
    }
});

/**
 * Function to send OTP via email using simple authentication
 */
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = otp; // Store OTP temporarily
        
        console.log(`OTP for ${email}: ${otp}`); // Log OTP for testing

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your 2FA OTP Code",
            text: `Your One-Time Password (OTP) is: ${otp}. It will expire in 5 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
                    <h2 style="color: #4CAF50;">Your Verification Code</h2>
                    <p>Please use the following code to verify your login:</p>
                    <div style="background: #eee; padding: 10px; text-align: center; font-size: 24px;">
                        <strong>${otp}</strong>
                    </div>
                    <p>This code will expire in 5 minutes.</p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);
        
        // Set OTP to expire after 5 minutes
        setTimeout(() => {
            if (otpStore[email]) {
                delete otpStore[email];
                console.log(`OTP for ${email} expired`);
            }
        }, 5 * 60 * 1000);
        
        res.status(200).json({ 
            success: true, 
            message: "Verification code sent successfully" 
        });
    } catch (err) {
        console.error("Error sending OTP:", err);
        res.status(500).json({ 
            success: false, 
            message: "Failed to send verification code" 
        });
    }
};

/**
 * User Registration Function
 */
const register = async (req, res) => {
  try {
      console.log("Registration request body:", req.body);
      
      const { email, password, roles, companyName, storeName, number } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
          return res.status(400).json({
              success: false,
              message: "Email already registered. Please log in."
          });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = new User({
          email,
          password: hashedPassword,
          companyName,
          storeName,
          number,
          roles: roles || ["Admin"], // Use roles from request or default
          twoFAEnabled: false
      });

      // Save user to database
      await newUser.save();
      
      console.log("User registered successfully:", newUser.email);
      
      res.status(201).json({
          success: true,
          message: "User registered successfully"
      });

  } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({
          success: false,
          message: "Server error during registration",
          error: err.message
      });
  }
};
/**
 * User Login Function with 2FA OTP
 */
const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        console.log("Login attempt:", { email, role });

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: `No account found with email ${email}` 
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid credentials" 
            });
        }
        
        // Check role if provided
        if (role && !user.roles.includes(role)) {
            return res.status(403).json({ 
                success: false,
                message: `You don't have access as ${role}` 
            });
        }

        // Determine the user's role (use the provided role or the first role in the array)
        const userRole = role || user.roles[0];

        // If 2FA is enabled, send OTP
        if (user.twoFAEnabled) {
            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            otpStore[email] = otp;
            
            console.log(`OTP for ${email}: ${otp}`); // Log OTP for testing

            // Email options
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Your 2FA OTP Code",
                text: `Your One-Time Password (OTP) is: ${otp}. It will expire in 5 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
                        <h2 style="color: #4CAF50;">Your Verification Code</h2>
                        <p>Please use the following code to verify your login:</p>
                        <div style="background: #eee; padding: 10px; text-align: center; font-size: 24px;">
                            <strong>${otp}</strong>
                        </div>
                        <p>This code will expire in 5 minutes.</p>
                    </div>
                `
            };

            // Send email
            await transporter.sendMail(mailOptions);
            
            // Set OTP to expire after 5 minutes
            setTimeout(() => {
                if (otpStore[email]) {
                    delete otpStore[email];
                    console.log(`OTP for ${email} expired`);
                }
            }, 5 * 60 * 1000);
            
            return res.status(200).json({ 
                success: true,
                message: "OTP sent to email. Please verify to proceed.", 
                twoFAEnabled: true, 
                role: userRole 
            });
        }

        // If 2FA is not enabled, proceed to dashboard
        res.status(200).json({ 
            success: true,
            message: "Login successful", 
            twoFAEnabled: false, 
            role: userRole 
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ 
            success: false,
            message: "Internal Server Error", 
            error: err.message 
        });
    }
};

/**
 * Verify OTP Function for 2FA
 */
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        console.log("Verifying OTP:", { email, otp, storedOTP: otpStore[email] });

        // Check if OTP matches
        if (otpStore[email] && otpStore[email] === otp) {
            // Find user to get their role
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ 
                    success: false,
                    message: "User not found" 
                });
            }

            // Clear OTP after successful verification
            delete otpStore[email];
            
            return res.status(200).json({ 
                success: true,
                message: "2FA Verified Successfully!",
                role: user.roles[0]
            });
        } else {
            return res.status(400).json({ 
                success: false,
                message: "Invalid OTP or OTP expired" 
            });
        }
    } catch (err) {
        console.error("OTP verification error:", err);
        res.status(500).json({ 
            success: false,
            message: "Internal Server Error", 
            error: err.message 
        });
    }
};

module.exports = { register, login, sendOTP, verifyOTP };