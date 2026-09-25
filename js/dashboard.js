const token = localStorage.getItem("access_token");
const recommendations = document.getElementById("recommendations");

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
    
    Object.entries(data).forEach(function([beachName, beachData]) {

        const beachTitle = document.createElement("h2");
        beachTitle.textContent = beachName;

        recommendations.appendChild(beachTitle);

        beachData.periodos.forEach(function(period) {

            const periodText = document.createElement("p");

            periodText.textContent = `${period.periodo} | ${period.score.toFixed(2)}`;

            recommendations.appendChild(periodText);
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
