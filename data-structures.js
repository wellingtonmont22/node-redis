const { createClient } = require("redis");

(async () => {
  const client = createClient();
  await client.connect();

  await client.hSet("produto", "1", JSON.stringify({ nome: "Pão" }));

  await client.hSet("produto", "2", JSON.stringify({ nome: "Açucar" }));

  console.log(Object.assign({}, await client.hGetAll('produto')))

  await client.lPush("pessoas", ["well", "well2"]);

  console.log(await client.lRange('pessoas', 0, -1))
 
  await client.disconnect();
})();
