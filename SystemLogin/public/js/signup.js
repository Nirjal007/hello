document.getElementById("signupForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  // Get form input values
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const selectedRole = document.getElementById("role").value;
  const companyName = document.getElementById("companyName").value;
  const storeName = document.getElementById("storeName").value;
  const number = document.getElementById("contactNumber").value;
  
  console.log("Submitting form with data:", {
      email, password, roles: [selectedRole], companyName, storeName, number
  });

  try {
      // Send POST request to backend API for user registration
      const response = await fetch("http://localhost:7000/api/auth/register", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
              email, 
              password, 
              roles: [selectedRole], 
              companyName, 
              storeName, 
              number 
          })
      });

      console.log("Response status:", response.status);
      
      // Parse response from server
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
          alert("Signup successful! Redirecting to login...");
          window.location.href = "./login.html"; // Redirect to login page
      } else {
          alert(`Signup failed: ${data.message}`);
      }

  } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please try again later.");
  }
});