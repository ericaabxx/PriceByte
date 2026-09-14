const http = require('http');

const API_KEY = 'COLOQUE_SUA_CHAVE_AQUI';

async function buscarNotebooks() {
  const resposta = await fetch(
    'https://api.lomadee.com.br/affiliate/products?search=notebook&limit=5',
    {
      headers: {
        'x-api-key': API_KEY,
      },
    }
  );

  if (!resposta.ok) {
    throw new Error(`Erro da Lomadee: ${resposta.status}`);
  }

  const dados = await resposta.json();

  console.log(dados);
}

buscarNotebooks();
