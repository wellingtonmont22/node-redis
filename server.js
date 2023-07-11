const express = require("express");

const app = express();

const { createClient } = require("redis");

app.use(express.json());

const PORT = 3000;
const client = createClient();
const clients = [
  { id: 1, name: "Jose" },
  { id: 2, name: "Raquel" },
];

app.get("/", async (req, res) => {
  const clients = JSON.parse(await client.get("clients"));

  await client.incr("views");

  if (!clients) {
    const clients = await getAllClients();
    await client.set("clients", JSON.stringify(clients), { EX: 10 });
    return res.json(clients);
  }
  return res.json(clients);
});

app.get("/stale", async (req, res) => {
  const clients = JSON.parse(await client.get("clients"));
  const isClientsCacheStale = !JSON.parse(await client.get("clients:isStale"));

  if (isClientsCacheStale) {
    const isRefetching = !!JSON.parse(await client.get("clients:isRefetching"));
    if (!isRefetching) {
      await client.set("clients:isRefetching", "true", { EX: 20 });
      console.log('clients is refetching')
      /** Simulando atualização dos dados em caching */
      setTimeout(async () => {
        console.log("clients is stale.");
        const clients = await getAllClients();
        await client.set("clients", JSON.stringify(clients));
        await client.set("clients:isStale", "true", { EX: 5 });
        await client.del("clients:isRefetching");
      }, 5);
    }
  }

  await client.incr("views");
  return res.json(clients);
});

app.post("/", async (req, res) => {
  await client.del("clients");

  clients.push(req.body);

  return res.json({ message: "Criado com sucesso!" });
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

async function getAllClients() {
  const time = Math.random() * 2000;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(clients);
    }, time);
  });
}
