const token = localStorage.getItem("access_token");
const recommendations = document.getElementById("recommendations");
const recommendationsLoading = document.getElementById("recommendations-loading");
const directionAngles = {
    N: 0,
    NE: 45,
    E: 90,
    SE: 135,
    S: 180,
    SW: 225,
    W: 270,
    NW: 315
};

// Variável para controlar o redirecionamento para a página de login - TOKEN EXPIRADO
let isRedirectingToLogin = false;

function handleUnauthorized(response) {

    if (response.status === 401 && !isRedirectingToLogin) {

        isRedirectingToLogin = true;

        localStorage.removeItem("access_token");

        alert("Sua sessão expirou. Faça login novamente para continuar.");

        window.location.href = "./index.html";

        return true;
    }

    return response.status === 401;
}


console.log("dashboard.js carregou!"); 

async function loadDashboard() { // await precisa estar dentro de uma função async.
 
    console.log("loadDashboard executou!");

    const response = await fetch(
        "http://127.0.0.1:5000/user_main_dashboard",
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

   if (handleUnauthorized(response)) {
    return;
}

    const data = await response.json();

    recommendationsLoading.style.display = "none";
    
    Object.entries(data).forEach(function([beachName, beachData]) {

        const beachTitle = document.createElement("h2");
        beachTitle.textContent = beachName;

        recommendations.appendChild(beachTitle);

        beachData.periodos.forEach(function(period) {
            //create div for each period and append it to the recommendations
            const periodCard = document.createElement("div");
            periodCard.classList.add("period-card");

            const periodNameScore = document.createElement("div");
            periodNameScore.classList.add("period-name-score");
            periodNameScore.textContent = `${period.periodo} | Score: ${period.score.toFixed(2)}`;
            periodCard.appendChild(periodNameScore);

            const periodDetails = document.createElement("div");
            periodDetails.classList.add("period-details");

            //onda 
            const waveIcon = document.createElement("img");
            waveIcon.src = "./assets/img/minimalist-wave-icon.svg";
            waveIcon.alt = "Altura das Ondas";

            const waveText = document.createElement("span");
            waveText.textContent = `${period.wave_height.toFixed(2)} m`;
            
            //vento 
            const windIcon = document.createElement("img");
            windIcon.src = "./assets/img/minimalist-wind-icon.svg";
            windIcon.alt = "Velocidade do Vento";

            const windText = document.createElement("span");
            windText.textContent = `${period.wind_speed.toFixed(2)} km/h`;

            //direção do vento
            const windDirectionIcon = document.createElement("img");
            windDirectionIcon.src = "./assets/img/minimalist-arrow-icon.svg";
            windDirectionIcon.alt = "Direção do Vento";
            windDirectionIcon.style.transform=`rotate(${directionAngles[period.wind_direction]}deg)`;
            const windDirectionText = document.createElement("span");
            windDirectionText.textContent = `${period.wind_direction}`;

            periodDetails.appendChild(waveIcon);
            periodDetails.appendChild(waveText);

            periodDetails.appendChild(windIcon);
            periodDetails.appendChild(windText);

            periodDetails.appendChild(windDirectionIcon);
            periodDetails.appendChild(windDirectionText);
            
            periodCard.appendChild(periodDetails);

            recommendations.appendChild(periodCard);
            //const periodText = document.createElement("p");

        });

    });

    console.log(data);
}

loadDashboard();


async function loadDashboardInfo() {

    const response = await fetch(
        "http://127.0.0.1:5000/dashboard_info",
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }

        
    );

    if (handleUnauthorized(response)) {
    return;
    }

    const data = await response.json();

    const welcomeMessage = document.getElementById("welcome-message");
    const weatherCondition = document.getElementById("weather-condition");
    const temperature = document.getElementById("temperature");
    const weatherMessage = document.getElementById("weather-message");

    welcomeMessage.textContent = `Olá, ${data.name}! Pronto/(a) para um dia de surf?`;

    weatherCondition.textContent = `Hoje o dia está ${data.condition_text}.`;

    temperature.textContent = `A Temperatura é: ${data.temperature} °C`;

    weatherMessage.textContent = data.message;

    console.log(data);
}

loadDashboardInfo();
