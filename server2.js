const express = require("express");

const app = express();

const { createClient } = require("redis");

app.use(express.json());

const PORT = 3000;

const client = createClient();

app.use(async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const key = `rate-limit-${ip}`
  const requestCount = Number((await client.get(key)) || 0) + 1
  
  await client.set(key, requestCount, { EX: await client.get(`timer-${ip}`) || 30 })
  
  if (requestCount > 50) {
    await client.set(`timer-${ip}`, Number((await client.get(key)) || 0) + 50, { EX: 30 })
    
    return res.status(429).send('Rate-limit')
  } 
  next()
})

app.get("/", async (req, res) => {

  return res.send({
    msg: 'ok'
  });
});

app.get("/products", async (req, res) => {

  return res.send({
    msg: 'ok'
  });
});


async function startUp() {
  try {
    client.on("error", (err) => console.log("Redis Client Error", err));
    client.on("connect", async () => {
      console.log("Redis conectado com sucesso!");

      app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}.`);
      });
    });

    await client.connect();
  } catch (error) {
    throw new Error(error);
  }
}

startUp();

