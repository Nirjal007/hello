document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById("loginForm");
    const otpInputSection = document.getElementById("otpInputSection");
    const enable2FABtn = document.getElementById("enable2FA");
    const verifyOTPBtn = document.getElementById("verifyOTPBtn");
    
    // Handle login form submission
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;
        
        try {
            console.log("Sending login request:", { email, password, role });
            
            const response = await fetch("http://localhost:7000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            
            const data = await response.json();
            console.log("Login response:", data);
            
            if (response.ok) {
                if (data.twoFAEnabled) {
                    // Show 2FA input section
                    otpInputSection.style.display = "block";
                    alert("Verification code sent to your email.");
                } else {
                    alert("Login successful! Redirecting...");
                    redirectToDashboard(data.role);
                }
            } else {
                alert(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Login failed: " + error.message);
        }
    });
    
    // Handle 2FA OTP request
    enable2FABtn.addEventListener("click", async function () {
        const email = document.getElementById("email").value;
        
        if (!email) {
            alert("Please enter your email first");
            return;
        }
        
        try {
            const response = await fetch("http://localhost:7000/api/auth/enable-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                otpInputSection.style.display = "block";
                alert("Verification code sent to your email.");
            } else {
                alert(data.message || "Failed to send verification code");
            }
        } catch (error) {
            console.error("OTP request error:", error);
            alert("Failed to send verification code: " + error.message);
        }
    });
    
    // Handle OTP verification
    verifyOTPBtn.addEventListener("click", async function () {
        const email = document.getElementById("email").value;
        const otp = document.getElementById("otpCode").value;
        
        if (!otp) {
            alert("Please enter the verification code");
            return;
        }
        
        try {
            const response = await fetch("http://localhost:7000/api/auth/verify-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert("Login successful! Redirecting...");
                redirectToDashboard(document.getElementById("role").value);
            } else {
                alert(data.message || "Verification failed");
            }
        } catch (error) {
            console.error("OTP verification error:", error);
            alert("Verification failed: " + error.message);
        }
    });
});

// Redirect user based on role after login or OTP verification
function redirectToDashboard(role) {
    switch (role) {
        case "Admin":
            window.location.href = "/admin/admin.html";
            break;
        case "Supplier":
            window.location.href = "/supplier/public/supplier.html";
            break;
        case "Manufacturer":
            window.location.href = "/manufacturer/public/manufacturer.html";
            break;
        case "Distributor":
            window.location.href = "/Distributor/public/distributor.html";
            break;
        case "Retailer":
            window.location.href = "/retailer/public/retailer.html";
            break;
        default:
            window.location.href = "/";
    }
}