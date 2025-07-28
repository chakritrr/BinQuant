function usrClicked() {
  const firstnameDOM = document.getElementById("firstname");
  const lastnameDOM = document.getElementById("lastname");
  const ageDOM = document.getElementById("age");
  const genderDOM = document.querySelector("input[name=gender]:checked");
  const interestsDOM = document.querySelectorAll(
    "input[name=interest]:checked"
  );

  const interest = [];
  for (let i = 0; i < interestsDOM.length; i++) {
    interest.push(interestsDOM[i].value);
  }

  const userData = {
    firstname: firstnameDOM.value,
    lastname: lastnameDOM.value,
    age: ageDOM.value,
    gender: genderDOM.value,
    interest: interest,
  };

  console.log("userData:", userData);
  // console.log("interestsDOM:", interestsDOM);
}
