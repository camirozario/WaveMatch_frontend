const registerForm = document.getElementById("register-form")

registerForm.addEventListener("submit",async function(event){
    event.preventDefault();

    const nameInput = document.getElementById("register-name").value;
    const dobInput = document.getElementById("register-dob").value;
    const emailInput = document.getElementById("register-email").value;
    const passwordInput = document.getElementById("register-password").value;
    const surfLevelInput = document.getElementById("register-surf-level").value;

    const minWaveInput = document.getElementById("register-min-wave").value;
    const maxWaveInput = document.getElementById("register-max-wave").value;

    const registerData = {
    name: nameInput,
    date_of_birth: dobInput,
    email: emailInput,
    password: passwordInput,
    surf_level: surfLevelInput,
    min_wave_height: minWaveInput ? Number(minWaveInput) : null, // operador ternadrio ele usa  // usa Number(minWaveInpuT) caso contrario retorna null
    max_wave_height: maxWaveInput ? Number(maxWaveInput) : null
    };

    const response = await fetch(
        "http://127.0.0.1:5000/register",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(registerData)
        }
    );

    const data = await response.json();

    if (response.ok){
        alert(data.message);
        window.location.href = "./index.html";
    } else{
        alert(data.message)
    }
    console.log(response.status);
    console.log(data);

    console.log(registerData);

})