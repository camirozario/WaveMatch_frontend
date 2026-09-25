const loginForm = document.getElementById("login-form")

loginForm.addEventListener("submit", async function(event){
    event.preventDefault(); // Normalmente um <form> tenta enviar os dados e recarregar/navegar a página.

    const emailInput = document.getElementById("login-email-input").value;
    const passwordInput = document.getElementById("login-password-input").value;

    const loginData = {
    email:emailInput,
    password:passwordInput
    }

    console.log(loginData);

    const response = await fetch("http://127.0.0.1:5000/login",{ // para ONDE estamos enviando -> Nesta função, espere essa requisição produzir uma resposta antes de continuar para a próxima linha - response representa minha resposta
        method:"POST", //qual método HTTP usar

        headers:{
            "Content-Type":"application/json" //"o conteúdo que estou enviando é JSON"
        },
        body: JSON.stringify(loginData) //transforma o objeto JavaScript em JSON para ser enviado
    });
    const data = await response.json(); //outro await porque ler/converter o corpo da resposta também é uma operação assíncrona.

    if (response.ok){ //fica true quando a resposta está na faixa 200–299
        localStorage.setItem("access_token", data.access_token); // rmazenamento que o navegador oferece para guardar pequenos dados como strings e pode ser recuperado
        console.log("Login realizado com sucesso!");

        window.location.href = "./dashboard.html"; // window representa a janela do navegador. Dentro dela temos location, que contém informações sobre a página atual. -> "Navegador, agora vá para dashboard.html."

        } else {
        console.log("Erro no login:", data.message);
        }

});
