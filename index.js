const express = require('express');
const app = express();
const port = 3000;

const redis = require('redis');

const cache = redis.createClient({
  url: 'redis://localhost:6379'
});

cache.on('connect', () => {
  console.log('Redis is ready');
});

cache.on('error', (e) => {
  console.log('Redis error', e);
});

async function startRedis() {
  await cache.connect();
}

startRedis();

// Função que calcula o fatorial e usa cache
async function calcularFatorialComCache(numero) {
  if (numero < 0 || isNaN(numero)) {
      return{erro: "Número inválido!"}
  }

  else if (numero === 0 || numero === 1) {
      return{resultado:1, cache: false};
    }
  else{
    
    const chave = `fatorial:${numero}`;

    // tenta pegar do Redis
    const valorCache = await cache.get(chave);
    if (valorCache) {
      return { resultado: valorCache, cache: true };
    }

    // calcula o fatorial
    let resposta = 1;
    for (let i = numero; i >= 1; i--) {
      resposta *= i;
    }

    // salva no Redis
    await cache.set(chave, resposta.toString());

    return { resultado: resposta, cache: false };
  }
}

// Rota principal
app.get('/', (req, res) => {
  res.send('Coloque /fatorial/(Número desejado) na url!');
});

// Rota do fatorial
app.get('/fatorial/:numero', async (req, res) => {
  const numero = parseInt(req.params.numero);
  const resultado = await calcularFatorialComCache(numero);

  if(resultado.erro != null){
    res.send(`É um número inválido!`)
  }
  else if (resultado.cache) {
    res.send(`Resultado do fatorial em cache: ${resultado.resultado}.`);
  } else {
    res.send(`Resultado do fatorial: ${resultado.resultado}.`);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});