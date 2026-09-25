const token = localStorage.getItem("access_token");
const profileForm = document.getElementById("profile-form");
const deleteAccountButton = document.getElementById("delete-account-button");

async function loadProfile() {

    const response = await fetch(
        "http://127.0.0.1:5000/profile",
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    document.getElementById("profile-name").textContent = data.name;
    document.getElementById("profile-email").textContent = data.email;
    document.getElementById("profile-dob").textContent = data.date_of_birth;
    document.getElementById("profile-surf-level").value = data.surf_level;
    document.getElementById("profile-min-wave").value = data.min_wave_height ?? "";
    document.getElementById("profile-max-wave").value = data.max_wave_height ?? ""; //"Se o valor da esquerda for null ou undefined, use o valor da direita."
    console.log(data);
}

loadProfile();

profileForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const surfLevelInput = document.getElementById("profile-surf-level").value;
    const minWaveInput = document.getElementById("profile-min-wave").value;
    const maxWaveInput = document.getElementById("profile-max-wave").value;

    const profileData = {
        surf_level: surfLevelInput,
        min_wave_height: minWaveInput ? Number(minWaveInput) : null,
        max_wave_height: maxWaveInput ? Number(maxWaveInput) : null
    };

    const response = await fetch(
    "http://127.0.0.1:5000/profile",
    {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
    });

    const data = await response.json();

    if (response.ok) {
        alert(data.message);
    } else {
        alert(data.message);
    }

});

deleteAccountButton.addEventListener("click", async function() {
    const confirmDelete = confirm(
        "Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita."
    );

    if (!confirmDelete) { // if not -> 
        return; // acabou a execução dessa função, não execute o que estiver abaixo.
    }
        const response = await fetch(
        "http://127.0.0.1:5000/profile",
            {
                method:"DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                 },
            }
        );

        const data = await response.json();

        if (response.ok){
            alert(data.message);
            localStorage.removeItem("access_token");
            window.location.href="./index.html"
        }
        else{
            alert(data.message)
        }

});