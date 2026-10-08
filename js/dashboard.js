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
    
    Object.entries(data)
        .sort(function(a, b) {
            return b[1].best_score - a[1].best_score;
        })
        .forEach(function([beachName, beachData]) {
            
        const beachTitle = document.createElement("div");
        beachTitle.classList.add("beach-title");


        const beachTitleText = document.createElement("h2");
        beachTitleText.textContent = beachName;

        const beachTitleMore = document.createElement("button");
        beachTitleMore.classList.add("btn", "beach-title-button");

        const arrowIcon = document.createElement("img");
        arrowIcon.src = "./assets/img/arrow.png";
        arrowIcon.alt = "Ver detalhes";

        beachTitleMore.appendChild(arrowIcon);

        const hourlyChart = document.createElement("div");
        hourlyChart.classList.add("hourly-chart");
        const chartCanvas = document.createElement("canvas");
        hourlyChart.appendChild(chartCanvas);
        
        let chartCreated = false;

        beachTitleMore.addEventListener("click", async function() {

            beachTitleMore.classList.toggle("active");

            const isOpen = hourlyChart.classList.toggle("active");
       
            if (isOpen && !chartCreated ) {
          
                const response = await fetch(
                    `http://127.0.0.1:5000/spots/${encodeURIComponent(beachName)}/hourly`,
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

                if (!response.ok) {
                console.error("Erro ao buscar dados horários:", response.status);
                return;
                }

                const hourlyData = await response.json();

                console.log("Dados horários de:", beachName, hourlyData);

                const hours = Object.keys(hourlyData).map(function(time) {
                    return time.slice(11, 16);
                });

                const waveHeights = Object.values(hourlyData).map(function(data) {
                    return data.wave_height;
                });

                const windSpeeds = Object.values(hourlyData).map(function(data) {
                    return data.wind_speed;
                });

                console.log(hours);
                console.log(waveHeights);

                const maxWave = Math.max(...waveHeights);

                const waveScaleMax = Math.ceil(maxWave * 1.5 * 2) / 2;
                new Chart(chartCanvas, {
                data: {
                    labels: hours,

                    datasets: [
                        {
                            type: "bar",
                            label: "Altura das ondas (m)",
                            data: waveHeights,
                            backgroundColor: "#76B8CE",
                            borderRadius: 4,
                            barPercentage: 0.65,
                            categoryPercentage: 0.85,
                            yAxisID: "y", //Associa as ondas ao eixo esquerdo
                            order: 2
                        },
                        {
                            type: "line",
                            label: "Velocidade do vento (km/h)",
                            data: windSpeeds,
                            borderColor: "#E7833C",
                            backgroundColor: "#E7833C",
                            borderWidth: 2,
                            tension: 0.3,
                            pointRadius: 3,
                            yAxisID: "y1", // Associa o vento ao eixo direito
                            order: 1
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,


                    interaction: {
                        mode: "index",
                        intersect: false
                    },

                    scales: {
                       y: {
                                type: "linear",
                                position: "left",
                                min: 0,
                                max: waveScaleMax,
                                title: {
                                    display: true,
                                    text: "Ondas (m)"
                                }
                            },

                        y1: {
                            type: "linear",
                            position: "right",
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: "Vento (km/h)"
                            },
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    }
                }
            });

                chartCreated = true;
            }
        });


        beachTitle.appendChild(beachTitleText);
        beachTitle.appendChild(beachTitleMore);

        recommendations.appendChild(beachTitle);
        recommendations.appendChild(hourlyChart);

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
