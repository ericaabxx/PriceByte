export default async function handler(req, res) {
  try {
    const apiKey = process.env.LOMADEE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        erro: "LOMADEE_API_KEY não configurada"
      });
    }

    const url =
      "https://api-beta.lomadee.com.br/affiliate/products" +
      "?search=notebook" +
      "&page=1" +
      "&limit=20";

    const resposta = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey
      }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      return res.status(resposta.status).json(dados);
    }

    return res.status(200).json(dados);

  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: "Erro ao consultar a Lomadee",
      mensagem: erro.message
    });
  }
}