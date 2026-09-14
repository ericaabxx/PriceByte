import 'dotenv/config';
import { writeFile } from 'node:fs/promises';

const API_KEY = process.env.LOMADEE_API_KEY;

if (!API_KEY) {
  console.error('❌ A variável LOMADEE_API_KEY não foi encontrada.');
  console.error('Verifique se existe um arquivo .env na raiz do projeto.');
  process.exit(1);
}

const BASE_URL = 'https://api-beta.lomadee.com.br/affiliate/products';

// Termos que vamos pesquisar
const TERMOS_DE_BUSCA = ['notebook', 'notebook gamer', 'notebook RTX'];

// Marcas que queremos reconhecer
const MARCAS_CONHECIDAS = [
  'acer',
  'lenovo',
  'dell',
  'hp',
  'asus',
  'samsung',
  'positivo',
  'vaio',
  'lg',
];

// GPUs que queremos reconhecer
const GPUS_CONHECIDAS = [
  'rtx 5090',
  'rtx 5080',
  'rtx 5070',
  'rtx 5060',
  'rtx 4090',
  'rtx 4080',
  'rtx 4070',
  'rtx 4060',
  'rtx 4050',
  'rtx 3060',
  'rtx 3050',
  'gtx 1650',
];

// -----------------------------------------
// Normaliza textos
// -----------------------------------------

function normalizarTexto(texto = '') {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// -----------------------------------------
// Extrai informações do nome do notebook
// -----------------------------------------

function extrairEspecificacoes(nomeProduto) {
  const nomeNormalizado = normalizarTexto(nomeProduto);

  // Marca
  const marca =
    MARCAS_CONHECIDAS.find((marca) => nomeNormalizado.includes(marca)) || null;

  // RAM
  const matchRam = nomeNormalizado.match(/(\d{1,3})\s?gb\s?(ram|memoria)/);

  const ram = matchRam ? Number(matchRam[1]) : null;

  // SSD / HD
  const matchArmazenamentoGb = nomeNormalizado.match(
    /(\d{3,4})\s?gb\s?(ssd|hd)/
  );

  const matchArmazenamentoTb = nomeNormalizado.match(/(\d)\s?tb\s?(ssd|hd)?/);

  let armazenamento = null;

  if (matchArmazenamentoGb) {
    armazenamento = Number(matchArmazenamentoGb[1]);
  } else if (matchArmazenamentoTb) {
    armazenamento = Number(matchArmazenamentoTb[1]) * 1024;
  }

  // Tela
  const matchTela = nomeNormalizado.match(/(\d{2}[.,]\d)\s?"?\s?(polegadas)?/);

  const tela = matchTela ? Number(matchTela[1].replace(',', '.')) : null;

  // GPU
  const gpu =
    GPUS_CONHECIDAS.find((gpu) => nomeNormalizado.includes(gpu)) || null;

  // Processador
  const matchProcessador = nomeProduto.match(
    /(i[3579]-?\d{3,5}[a-z]{0,2}|ryzen\s?\d\s?\d{3,4}[a-z]{0,2})/i
  );

  const processador = matchProcessador ? matchProcessador[0] : null;

  // Sistema operacional
  let sistemaOperacional = null;

  if (nomeNormalizado.includes('linux')) {
    sistemaOperacional = 'Linux';
  } else if (nomeNormalizado.includes('windows')) {
    sistemaOperacional = 'Windows';
  }

  return {
    marca,
    ram,
    armazenamento,
    tela,
    gpu,
    processador,
    sistemaOperacional,
  };
}

// -----------------------------------------
// Busca produtos na API da Lomadee
// -----------------------------------------

async function buscarProdutos(termo) {
  const url = new URL(BASE_URL);

  url.searchParams.set('search', termo);
  url.searchParams.set('page', '1');
  url.searchParams.set('limit', '100');
  url.searchParams.set('isAvailable', 'true');

  const resposta = await fetch(url, {
    method: 'GET',

    headers: {
      'x-api-key': API_KEY,
    },
  });

  if (!resposta.ok) {
    const erro = await resposta.text();

    throw new Error(`Erro ${resposta.status} na Lomadee: ${erro}`);
  }

  const dados = await resposta.json();

  return dados.data || [];
}

// -----------------------------------------
// Transforma produto da Lomadee
// no formato usado pelo Price Byte
// -----------------------------------------

function transformarProduto(produto) {
  const nome = produto.name || 'Notebook sem nome';

  const specs = extrairEspecificacoes(nome);

  // A API coloca o preço dentro de options → pricing
  const opcao = produto.options?.[0];

  const preco = opcao?.pricing?.[0];

  // A Lomadee envia preço em centavos
  const precoAtual = preco?.price ? Number(preco.price) / 100 : 0;

  const precoAntigo = preco?.listPrice
    ? Number(preco.listPrice) / 100
    : precoAtual;

  // Imagem
  const imagem = produto.images?.[0]?.url || opcao?.images?.[0]?.url || null;

  return {
    nome,

    marca: specs.marca,

    processador: specs.processador,

    gpu: specs.gpu,

    ram: specs.ram,

    armazenamento: specs.armazenamento,

    tela: specs.tela,

    sistemaOperacional: specs.sistemaOperacional,

    precoAntigo,

    precoAtual,

    // Ainda não temos parcelamento confiável
    // nesse endpoint.
    parcelas: null,

    semJuros: null,

    loja: opcao?.seller || 'Loja parceira',

    imagem,

    link: produto.url || '#',

    // Informações da Lomadee
    organizationId: produto.organizationId,

    productId: produto.id,
  };
}

// -----------------------------------------
// Programa principal
// -----------------------------------------

async function main() {
  console.log('🔎 Buscando notebooks na Lomadee...\n');

  const todosProdutos = [];

  for (const termo of TERMOS_DE_BUSCA) {
    console.log(`Buscando: "${termo}"...`);

    try {
      const produtos = await buscarProdutos(termo);

      console.log(`   → ${produtos.length} produtos encontrados`);

      todosProdutos.push(...produtos);
    } catch (erro) {
      console.error(`❌ Erro ao buscar "${termo}":`, erro.message);
    }
  }

  // -----------------------------------------
  // Remove produtos duplicados
  // -----------------------------------------

  const produtosUnicos = [];

  const idsVistos = new Set();

  for (const produto of todosProdutos) {
    const id = produto.id || produto.url;

    if (!id) {
      continue;
    }

    if (idsVistos.has(id)) {
      continue;
    }

    idsVistos.add(id);

    produtosUnicos.push(transformarProduto(produto));
  }

  // -----------------------------------------
  // Remove produtos sem preço
  // -----------------------------------------

  const produtosComPreco = produtosUnicos.filter(
    (produto) => produto.precoAtual > 0
  );

  // -----------------------------------------
  // Salva produtos.json
  // -----------------------------------------

  await writeFile(
    'produtos.json',
    JSON.stringify(produtosComPreco, null, 2),
    'utf-8'
  );

  console.log('\n--------------------------------');

  console.log(`✅ ${produtosComPreco.length} notebooks salvos`);

  console.log('📁 Arquivo atualizado: produtos.json');

  console.log('--------------------------------\n');
}

main();
