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

        const topRecommendationScores = beachData.periodos
            .slice(0, 3)
            .map(function(period) {
                return Number(period.score);
            });
            
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

                const data = await response.json();

                console.log("RESPOSTA COMPLETA DA API:", data);

                const hourlyData = data.hourly;
                const periodScores = data.periodos;
                const windDirectionIcon = new Image();
                let hourlyChartInstance;

                windDirectionIcon.addEventListener("load", function() {
                    if (hourlyChartInstance) {
                        hourlyChartInstance.draw();
                    }
                });
                windDirectionIcon.src = "./assets/img/minimalist-arrow-icon.svg";

                console.log("Dados horários de:", beachName, hourlyData);
                console.log("Scores dos períodos:", periodScores);

                // Filtrar apenas os horários entre 05h e 19h
                const filteredData = Object.entries(hourlyData).filter(function([time, data]) {
                    const hour = Number(time.slice(11, 13));

                    return hour >= 5 && hour < 19;
                });

                // Extrair os dados filtrados
                const hours = filteredData.map(function([time, data]) {
                    return time.slice(11, 16);
                });

                const waveHeights = filteredData.map(function([time, data]) {
                    return data.wave_height;
                });

                const windSpeeds = filteredData.map(function([time, data]) {
                    return data.wind_speed;
                });

                console.log(hours);
                console.log(waveHeights);

                const maxWave = Math.max(...waveHeights);
                const waveScaleMax = Math.ceil(maxWave * 1.5 * 2) / 2;

                // create plugin for Chart.js
                const periodBackgroundPlugin = {
                    id: "periodBackground",

                    beforeDatasetsDraw(chart) {
                        const { ctx, chartArea, scales } = chart;

                        if (!chartArea) return;

                        const periods = [
                            { name: "Amanhecer", time: "05h–08h", start: 5, end: 8, color: "rgba(239, 184, 65, 0.12)" },
                            { name: "Manhã", time: "08h–12h", start: 8, end: 12, color: "rgba(239, 104, 59, 0.08)" },
                            { name: "Tarde", time: "12h–16h", start: 12, end: 16, color: "rgba(36, 89, 116, 0.08)" },
                            { name: "Fim da tarde", time: "16h–19h", start: 16, end: 19, color: "rgba(184, 166, 221, 0.12)" }
                        ];

                        periods.forEach(period => {
                            period.data = periodScores.find(
                                item => item.periodo === period.name.toLowerCase()
                            );
                        });

                        const xScale = scales.x;

                        periods.forEach(period => {
                            const startIndex = hours.findIndex(
                                hour => Number(hour.slice(0, 2)) === period.start
                            );

                            const endIndex = hours.findIndex(
                                hour => Number(hour.slice(0, 2)) === period.end
                            );

                            if (startIndex === -1) return;

                            // Distância entre duas horas no gráfico
                            const step = xScale.getPixelForValue(1) - xScale.getPixelForValue(0);

                            // Começa meia hora visual antes da primeira barra
                            const startX = Math.max(
                                chartArea.left,
                                xScale.getPixelForValue(startIndex) - step / 2
                            );

                            // Termina antes da primeira barra do próximo período
                            const endX = endIndex !== -1
                                ? xScale.getPixelForValue(endIndex) - step / 2
                                : chartArea.right;

                            const headerTop = chartArea.top - 90;

                            ctx.save();
                            ctx.fillStyle = period.color;

                            ctx.fillRect(
                                startX,
                                headerTop,
                                endX - startX,
                                chartArea.bottom - headerTop
                            );

                            ctx.strokeStyle = "rgba(38, 60, 67, 0.14)";
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(endX, headerTop);
                            ctx.lineTo(endX, chartArea.bottom);
                            ctx.stroke();

                            const centerX = (startX + endX) / 2;
                            const segmentWidth = endX - startX;

                            ctx.textAlign = "center";
                            ctx.textBaseline = "top";

                            if (period.data) {
                                // Score do período
                                const scoreText = `${period.data.score.toFixed(1)} pts`;
                                const isTopRecommendation = topRecommendationScores.some(
                                    score => Math.abs(score - Number(period.data.score)) < 0.001
                                );
                                ctx.font = "700 11px 'DM Sans', Arial, sans-serif";
                                const pillWidth = ctx.measureText(scoreText).width + 18;
                                const pillHeight = 22;
                                const pillX = centerX - pillWidth / 2;
                                const pillY = headerTop + 7;

                                ctx.fillStyle = isTopRecommendation ? "#386550" : "#fffcf5";
                                ctx.strokeStyle = isTopRecommendation ? "#263c43" : "rgba(38, 60, 67, 0.28)";
                                ctx.lineWidth = isTopRecommendation ? 1.5 : 1;
                                ctx.shadowColor = isTopRecommendation ? "rgba(38, 60, 67, 0.24)" : "transparent";
                                ctx.shadowOffsetX = isTopRecommendation ? 2 : 0;
                                ctx.shadowOffsetY = isTopRecommendation ? 2 : 0;
                                ctx.beginPath();
                                if (ctx.roundRect) {
                                    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 11);
                                } else {
                                    ctx.rect(pillX, pillY, pillWidth, pillHeight);
                                }
                                ctx.fill();
                                ctx.stroke();
                                ctx.shadowColor = "transparent";
                                ctx.shadowOffsetX = 0;
                                ctx.shadowOffsetY = 0;

                                ctx.fillStyle = isTopRecommendation ? "#fffcf5" : "#263c43";

                                ctx.fillText(
                                    scoreText,
                                    centerX,
                                    pillY + 4
                                );
                            }

                            // Nome do período
                            ctx.fillStyle = "#263c43";
                            ctx.font = `700 ${segmentWidth < 82 ? 10 : 12}px 'DM Sans', Arial, sans-serif`;
                            ctx.fillText(
                                period.name,
                                centerX,
                                headerTop + 36
                            );

                            ctx.font = "500 10px 'DM Sans', Arial, sans-serif";
                            ctx.fillStyle = "#586667";
                            ctx.fillText(
                                period.time,
                                centerX,
                                headerTop + 54
                            );

                            if (period.data) {
                                // Direção predominante do vento
                                ctx.font = "500 10px 'DM Sans', Arial, sans-serif";
                                ctx.fillStyle = "#586667";
                                const windText = `Vento ${period.data.wind_type}`;
                                const windTextWidth = ctx.measureText(windText).width;
                                const iconSize = 12;
                                const iconGap = 4;
                                const windGroupWidth = iconSize + iconGap + windTextWidth;
                                const windGroupStartX = centerX - windGroupWidth / 2;
                                const windY = headerTop + 73;

                                if (windDirectionIcon.complete && windDirectionIcon.naturalWidth) {
                                    const iconCenterX = windGroupStartX + iconSize / 2;
                                    const iconCenterY = windY + iconSize / 2;
                                    const windAngle = directionAngles[period.data.wind_direction] || 0;

                                    ctx.save();
                                    ctx.translate(iconCenterX, iconCenterY);
                                    ctx.rotate(windAngle * Math.PI / 180);
                                    ctx.drawImage(
                                        windDirectionIcon,
                                        -iconSize / 2,
                                        -iconSize / 2,
                                        iconSize,
                                        iconSize
                                    );
                                    ctx.restore();
                                }

                                ctx.textAlign = "left";
                                ctx.fillText(
                                    windText,
                                    windGroupStartX + iconSize + iconGap,
                                    windY
                                );
                            }
                            ctx.restore();
                        });
                    }
                };

                //create chart with Chart.js
                hourlyChartInstance = new Chart(chartCanvas, {
                data: {
                    labels: hours,

                    datasets: [
                        {
                            type: "bar",
                            label: "Altura das ondas (m)",
                            data: waveHeights,
                            backgroundColor: "rgba(73, 150, 179, 0.82)",
                            hoverBackgroundColor: "#245974",
                            borderColor: "#245974",
                            borderWidth: 1,
                            borderRadius: 7,
                            borderSkipped: false,
                            barPercentage: 0.62,
                            categoryPercentage: 0.8,
                            yAxisID: "y", //Associa as ondas ao eixo esquerdo
                            order: 2
                        },
                        {
                            type: "line",
                            label: "Velocidade do vento (km/h)",
                            data: windSpeeds,
                            borderColor: "#E7833C",
                            backgroundColor: "#fffcf5",
                            borderWidth: 2.5,
                            tension: 0.35,
                            pointRadius: 3.5,
                            pointHoverRadius: 6,
                            pointBorderWidth: 2,
                            pointBorderColor: "#E7833C",
                            pointBackgroundColor: "#fffcf5",
                            yAxisID: "y1", // Associa o vento ao eixo direito
                            order: 1
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 650,
                        easing: "easeOutQuart"
                    },
                    layout: {
                            padding: {
                                top: 94,
                                right: 4,
                                left: 4
                            }
                        },


                    interaction: {
                        mode: "index",
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            position: "bottom",
                            align: "start",
                            labels: {
                                color: "#263c43",
                                usePointStyle: true,
                                pointStyle: "circle",
                                boxWidth: 8,
                                boxHeight: 8,
                                padding: 18,
                                font: {
                                    family: "DM Sans, Arial, sans-serif",
                                    size: 12,
                                    weight: "600"
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: "#263c43",
                            titleColor: "#fffcf5",
                            bodyColor: "#fffcf5",
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: true,
                            boxPadding: 5,
                            titleFont: {
                                family: "DM Sans, Arial, sans-serif",
                                size: 13,
                                weight: "700"
                            },
                            bodyFont: {
                                family: "DM Sans, Arial, sans-serif",
                                size: 12
                            }
                        }
                    },
                    scales: {
                       x: {
                                grid: {
                                    display: false
                                },
                                border: {
                                    color: "rgba(38, 60, 67, 0.28)"
                                },
                                ticks: {
                                    color: "#586667",
                                    maxRotation: 0,
                                    autoSkipPadding: 12,
                                    font: {
                                        family: "DM Sans, Arial, sans-serif",
                                        size: 11,
                                        weight: "500"
                                    }
                                }
                            },
                       y: {
                                type: "linear",
                                position: "left",
                                min: 0,
                                max: waveScaleMax,
                                title: {
                                    display: true,
                                    text: "Ondas (m)",
                                    color: "#245974",
                                    font: {
                                        family: "DM Sans, Arial, sans-serif",
                                        size: 11,
                                        weight: "700"
                                    }
                                },
                                grid: {
                                    color: "rgba(38, 60, 67, 0.1)",
                                    drawTicks: false
                                },
                                border: {
                                    display: false
                                },
                                ticks: {
                                    color: "#586667",
                                    padding: 8,
                                    font: {
                                        family: "DM Sans, Arial, sans-serif",
                                        size: 11
                                    }
                                }
                            },

                        y1: {
                            type: "linear",
                            position: "right",
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: "Vento (km/h)",
                                color: "#E7833C",
                                font: {
                                    family: "DM Sans, Arial, sans-serif",
                                    size: 11,
                                    weight: "700"
                                }
                            },
                            grid: {
                                drawOnChartArea: false
                            },
                            border: {
                                display: false
                            },
                            ticks: {
                                color: "#586667",
                                padding: 8,
                                font: {
                                    family: "DM Sans, Arial, sans-serif",
                                    size: 11
                                }
                            }
                        }
                    }
                },
            plugins: [periodBackgroundPlugin]

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
