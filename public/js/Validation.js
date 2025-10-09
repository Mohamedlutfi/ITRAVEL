const elements = {
    fullName: document.getElementById("name"),
    email: document.getElementById("mail"),
    fullNameError: document.getElementById("Fnametxt"),
    emailError: document.getElementById("mailtxt"),
    password: document.getElementById("password"),
    dropdown: document.getElementById("dropdown"),
    passLength: document.getElementById("passLength"),
    passCapital: document.getElementById("passCapital"),
    passNumber: document.getElementById("passNum"),
    passSpecial: document.getElementById("passSpecial"),
    passwordError: document.getElementById("passchecktxt"),
    passwordCheck: document.getElementById("passwordCheck"),
    btn: document.getElementById("btn"),
    user: document.getElementById("user"),
    userError: document.getElementById("usererror"),
};

const patterns = {
    name: /^[a-zA-Z ]+$/,
    user: /^[a-zA-Z0-9_]{3,16}$/,
    email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
    password: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,24}$/,
    number: /^(?=.*[0-9]).+$/,
    capital: /^(?=.*[A-Za-z]).+$/,
    special: /^(?=.*[!@#$%^&*]).+$/,
};

const toggleClass = (element, condition, className) => {
    element.classList.toggle(className, condition);
};

elements.fullName.addEventListener("input", () => {
    toggleClass(elements.fullNameError, !patterns.name.test(elements.fullName.value) && elements.fullName.value.length > 0, "error");
});

elements.user.addEventListener("input", () => {
    toggleClass(elements.userError, !patterns.user.test(elements.user.value) && elements.user.value.length > 0, "error");
});

elements.email.addEventListener("input", () => {
    const isValid = patterns.email.test(elements.email.value);
    toggleClass(elements.emailError, !isValid && elements.email.value.length > 0, "error");
});

elements.password.addEventListener("input", () => {
    elements.dropdown.classList.add("visible");
    toggleClass(elements.passLength, elements.password.value.length >= 8, "green");
    toggleClass(elements.passNumber, patterns.number.test(elements.password.value), "green");
    toggleClass(elements.passCapital, patterns.capital.test(elements.password.value), "green");
    toggleClass(elements.passSpecial, patterns.special.test(elements.password.value), "green");

    if (patterns.password.test(elements.password.value)) {
        setTimeout(() => elements.dropdown.classList.remove("visible"), 500);
    }
});

elements.password.addEventListener("blur", () => {
    setTimeout(() => elements.dropdown.classList.remove("visible"), 700);
});

elements.passwordCheck.addEventListener("input", () => {
    const isMatch = elements.passwordCheck.value === elements.password.value && elements.passwordCheck.value.length > 0;
    toggleClass(elements.passwordError, !isMatch, "error");
});

elements.btn.addEventListener("click", (e) => {
    e.preventDefault();
    const isValidForm = elements.fullName.value.length > 0 &&
        elements.email.value.length > 0 &&
        elements.password.value.length > 0 &&
        elements.passwordCheck.value.length > 0 &&
        patterns.name.test(elements.fullName.value) &&
        patterns.email.test(elements.email.value) &&
        patterns.password.test(elements.password.value) &&
        elements.passwordCheck.value === elements.password.value;

    alert(isValidForm ? "Form submitted successfully!" : "Please fill in all fields correctly.");
});
