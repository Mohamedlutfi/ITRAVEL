let fullName = document.getElementById("name");
let email = document.getElementById("mail");
let fullNameError = document.getElementById("Fnametxt");
let emailError = document.getElementById("mailtxt");
let password = document.getElementById("password");
let dropdown = document.getElementById("dropdown");
let passLength = document.getElementById("passLength");
let passCapital = document.getElementById("passCapital");
let passNumber = document.getElementById("passNum");
let passSpecial = document.getElementById("passSpecial");
let passwordError = document.getElementById("passchecktxt");
let passwordCheck = document.getElementById("passwordCheck");
let btn = document.getElementById("btn");
let validationName = /^[a-zA-Z ]+$/; // only letters and spaces
let validationEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;// basic email pattern
let validateionPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&])[A-Za-z\d#@$!%*?&]{8,24}$/;
// At least one uppercase letter, one lowercase letter, one number and one special character
// Minimum eight characters and maximum 24 characters
let validationNumber = /^(?=.*[0-9]).+$/;// contains at least one digit
let validationCapital = /^(?=.*[A-Z])(?=.*[a-z]).+$/;// contains at least one uppercase and one lowercase letter
let validationSpecial = /^(?=.*[!@#$%^&*]).+$/;// contains at least one special character

let value1= "d";
console.log(validationSpecial.test(value1)); // True

fullName.addEventListener("input", ()=>{// when the user types in the name input field
       if (validationName.test(fullName.value)){
        fullNameError.classList.remove("error");
    }
    else{
    if (fullName.value.length > 0)
        fullNameError.classList.add("error");
    else
    fullNameError.classList.remove("error");
}
});

email.addEventListener("input", ()=>{// when the user types in the email input field
       if (validationEmail.test(email.value)){
        emailError.classList.add("green");
    }
    else{
    if (email.value.length > 0){
        emailError.classList.add("error");
        emailError.classList.remove("green");
    }
    else
    emailError.classList.remove("error");
}
});
password.addEventListener("input", ()=>{// when the user types in the password input field
    dropdown.classList.add("visible");
    if (password.value.length >= 8)
        passLength.classList.add("green");
        else
            passLength.classList.remove("green");
    if(validationNumber.test(password.value))
        passNumber.classList.add("green");
        else
            passNumber.classList.remove("green");
    if(validationCapital.test(password.value))
        passCapital.classList.add("green");
        else
            passCapital.classList.remove("green");
    if(validationSpecial.test(password.value))
        passSpecial.classList.add("green");
        else
            passSpecial.classList.remove("green");
    if (validateionPassword.test(password.value))
        setTimeout(()=>{
    dropdown.classList.remove("visible");
}, 500)
        
})

password.addEventListener("blur", ()=>{
    setTimeout(()=>{
        dropdown.classList.remove("visible");
    }, 700)   }
);

passwordCheck.addEventListener("change", ()=>{
    if (passwordCheck.value === password.value && passwordCheck.value.length > 0){
        passwordError.classList.remove("error");}
    else{
        if (passwordCheck.value.length > 0){
        passwordError.classList.add("error");
        }
        else
        passwordError.classList.remove("error");
    }
});

btn.addEventListener("click", (e)=>{
    e.preventDefault();
    if (fullName.value.length>0 && email.value.length>0 && password.value.length>0 && passwordCheck.value.length>0 &&
    validationName.test(fullName.value) && validationEmail.test(email.value) && validateionPassword.test(password.value) &&
    passwordCheck.value === password.value){
        alert("Form submitted successfully!");
    }
    else{
        alert("Please fill in all fields correctly.");
    }

});