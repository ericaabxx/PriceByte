// Os produtos agora vêm de produtos.json, gerado pelo script
// gerar-produtos.js a partir da API da Lomadee (ver esse arquivo para
// detalhes). Aqui carregamos o JSON antes de exibir qualquer coisa.

let produtos = [];

// Busca produtos.json e devolve a lista (ou lista vazia em caso de erro)
async function carregarProdutos() {
  try {
    const resposta = await fetch('produtos.json');

    if (!resposta.ok) {
      throw new Error(
        `Não foi possível carregar produtos.json (${resposta.status})`
      );
    }

    return await resposta.json();
  } catch (erro) {
    console.error('Falha ao carregar produtos:', erro);

    if (quantidadeEncontrada) {
      quantidadeEncontrada.textContent =
        'Não foi possível carregar os notebooks agora';
    }

    return [];
  }
}

// Seleção dos elementos da página

const gradeProdutos = document.querySelector('.grade-produtos');
const campoBusca = document.querySelector('#inBusca');
const campoOrdenacao = document.querySelector('#ordenar');
const faixaPreco = document.querySelector('.faixa-preco');
const precoSelecionado = document.querySelector('.preco-selecionado');
const botaoFiltrar = document.querySelector('.botao-filtrar');
const botaoLimpar = document.querySelector('.botao-limpar');
const quantidadeEncontrada = document.querySelector('.quantidade-encontrada');

// Formata valores no padrão brasileiro

function formatarPreco(preco) {
  return preco.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Calcula a porcentagem de desconto

function calcularDesconto(precoAntigo, precoAtual) {
  if (!precoAntigo || precoAntigo <= precoAtual) {
    return 0;
  }

  const diferenca = precoAntigo - precoAtual;
  const desconto = (diferenca / precoAntigo) * 100;

  return desconto;
}

// Classifica a oferta

function classificarOferta(precoAntigo, precoAtual) {
  const desconto = calcularDesconto(precoAntigo, precoAtual);

  if (desconto >= 30) {
    return 'Excelente oferta';
  } else if (desconto >= 15) {
    return 'Bom preço';
  } else {
    return 'Preço normal';
  }
}

// Escolhe a classe do selo

function definirClasseOferta(classificacao) {
  if (classificacao === 'Excelente oferta') {
    return 'excelente';
  } else if (classificacao === 'Bom preço') {
    return 'bom';
  } else {
    return 'normal';
  }
}

// Cria o card utilizando createElement

function criarCard(produto) {
  const classificacao = classificarOferta(
    produto.precoAntigo,
    produto.precoAtual
  );

  const classeOferta = definirClasseOferta(classificacao);

  const valorParcela = produto.parcelas
    ? produto.precoAtual / produto.parcelas
    : null;

  // Elemento principal

  const card = document.createElement('article');
  card.classList.add('card-produto');

  // Topo

  const cardTopo = document.createElement('div');
  cardTopo.classList.add('card-topo');

  const selo = document.createElement('span');
  selo.classList.add('selo-oferta', classeOferta);
  selo.textContent = classificacao;

  const favorito = document.createElement('button');
  favorito.classList.add('botao-favorito');
  favorito.type = 'button';
  favorito.textContent = '♡';

  favorito.setAttribute('aria-label', `Favoritar ${produto.nome}`);

  cardTopo.append(selo, favorito);

  // Imagem

  let elementoImagem;

  if (produto.imagem) {
    elementoImagem = document.createElement('img');
    elementoImagem.src = produto.imagem;
    elementoImagem.alt = produto.nome;
  } else {
    elementoImagem = document.createElement('div');
  }

  elementoImagem.classList.add('imagem-produto');

  // Conteúdo

  const conteudo = document.createElement('div');
  conteudo.classList.add('card-conteudo');

  const nome = document.createElement('h3');
  nome.textContent = produto.nome;

  const especificacoes = document.createElement('p');
  especificacoes.classList.add('especificacoes');

  // Nem toda oferta traz specs estruturadas (a Lomadee só garante o
  // título do anúncio), então montamos a linha só com o que existir.
  const partesEspecificacoes = [
    produto.processador,
    produto.gpu ? produto.gpu.toUpperCase() : null,
    produto.ram ? `${produto.ram} GB RAM` : null,
    produto.armazenamento ? `${produto.armazenamento} GB SSD` : null,
    produto.tela ? `${produto.tela}"` : null,
    produto.sistemaOperacional,
  ].filter(Boolean);

  especificacoes.textContent =
    partesEspecificacoes.length > 0
      ? partesEspecificacoes.join(' | ')
      : 'Especificações não informadas pela loja';

  // Preços

  const precoAntigo = document.createElement('p');
  precoAntigo.classList.add('preco-antigo');
  precoAntigo.textContent = formatarPreco(produto.precoAntigo);

  const precoAtual = document.createElement('p');
  precoAtual.classList.add('preco-atual');
  precoAtual.textContent = formatarPreco(produto.precoAtual);

  const parcelamento = document.createElement('p');
  parcelamento.classList.add('parcelamento');

  parcelamento.textContent = produto.parcelas
    ? `${produto.parcelas}x de ` +
      `${formatarPreco(valorParcela)}` +
      `${produto.semJuros ? ' sem juros' : ''}`
    : 'Consulte o parcelamento na loja';

  // Rodapé

  const cardRodape = document.createElement('div');
  cardRodape.classList.add('card-rodape');

  const loja = document.createElement('span');
  loja.classList.add('loja');
  loja.textContent = produto.loja;

  const botaoOferta = document.createElement('a');
  botaoOferta.classList.add('botao-oferta');
  botaoOferta.href = produto.link;
  botaoOferta.target = '_blank';
  botaoOferta.rel = 'noopener noreferrer';
  botaoOferta.textContent = 'Ver oferta →';

  cardRodape.append(loja, botaoOferta);

  // Montagem do conteúdo

  conteudo.append(
    nome,
    especificacoes,
    precoAntigo,
    precoAtual,
    parcelamento,
    cardRodape
  );

  card.append(cardTopo, elementoImagem, conteudo);

  return card;
}

// Mostra os produtos

function mostrarProdutos(listaProdutos) {
  gradeProdutos.replaceChildren();

  const fragmento = document.createDocumentFragment();

  listaProdutos.forEach((produto) => {
    const card = criarCard(produto);
    fragmento.append(card);
  });

  gradeProdutos.append(fragmento);

  atualizarQuantidade(listaProdutos.length);
}

// Atualiza a quantidade encontrada

function atualizarQuantidade(quantidade) {
  if (!quantidadeEncontrada) {
    return;
  }

  quantidadeEncontrada.textContent = `${quantidade} notebook${
    quantidade !== 1 ? 's' : ''
  } encontrado${quantidade !== 1 ? 's' : ''}`;
}

// Retorna os valores dos checkboxes marcados

function obterSelecionados(nomeDoFiltro) {
  const camposSelecionados = document.querySelectorAll(
    `input[name="${nomeDoFiltro}"]:checked`
  );

  return Array.from(camposSelecionados).map((campo) => {
    return campo.value;
  });
}

// Aplica todos os filtros

function filtrarProdutos(listaProdutos) {
  const marcas = obterSelecionados('marca');
  const gpus = obterSelecionados('gpu');
  const memorias = obterSelecionados('ram');
  const armazenamentos = obterSelecionados('armazenamento');
  const parcelamentos = obterSelecionados('parcelamento');

  const precoMaximo = Number(faixaPreco.value);

  return listaProdutos.filter((produto) => {
    const correspondeMarca =
      marcas.length === 0 || marcas.includes(produto.marca);

    const correspondeGpu = gpus.length === 0 || gpus.includes(produto.gpu);

    const correspondeRam =
      memorias.length === 0 || memorias.includes(String(produto.ram));

    const correspondeArmazenamento =
      armazenamentos.length === 0 ||
      armazenamentos.includes(String(produto.armazenamento));

    const correspondePreco = produto.precoAtual <= precoMaximo;

    const correspondeParcelamento = verificarParcelamento(
      produto,
      parcelamentos
    );

    return (
      correspondeMarca &&
      correspondeGpu &&
      correspondeRam &&
      correspondeArmazenamento &&
      correspondePreco &&
      correspondeParcelamento
    );
  });
}

// Verifica as opções de parcelamento

function verificarParcelamento(produto, selecionados) {
  if (selecionados.length === 0) {
    return true;
  }

  return selecionados.some((opcao) => {
    if (opcao === 'sem-juros') {
      return produto.semJuros;
    }

    if (opcao === '12-ou-mais') {
      return produto.parcelas >= 12;
    }

    if (opcao === '24-ou-mais') {
      return produto.parcelas >= 24;
    }

    return false;
  });
}

// Filtra pelo campo de busca

function pesquisarProdutos(listaProdutos) {
  const pesquisa = campoBusca.value.trim().toLowerCase();

  if (pesquisa === '') {
    return listaProdutos;
  }

  return listaProdutos.filter((produto) => {
    return (
      produto.nome.toLowerCase().includes(pesquisa) ||
      produto.marca.toLowerCase().includes(pesquisa) ||
      produto.processador.toLowerCase().includes(pesquisa) ||
      produto.gpu.toLowerCase().includes(pesquisa)
    );
  });
}

// Ordena os produtos

function ordenarProdutos(listaProdutos) {
  const produtosOrdenados = [...listaProdutos];
  const tipoOrdenacao = campoOrdenacao.value;

  if (tipoOrdenacao === 'menor-preco') {
    produtosOrdenados.sort((produtoA, produtoB) => {
      return produtoA.precoAtual - produtoB.precoAtual;
    });
  }

  if (tipoOrdenacao === 'maior-preco') {
    produtosOrdenados.sort((produtoA, produtoB) => {
      return produtoB.precoAtual - produtoA.precoAtual;
    });
  }

  if (tipoOrdenacao === 'maior-desconto') {
    produtosOrdenados.sort((produtoA, produtoB) => {
      const descontoA = calcularDesconto(
        produtoA.precoAntigo,
        produtoA.precoAtual
      );

      const descontoB = calcularDesconto(
        produtoB.precoAntigo,
        produtoB.precoAtual
      );

      return descontoB - descontoA;
    });
  }

  return produtosOrdenados;
}

// Executa busca, filtros e ordenação

function atualizarProdutos() {
  let resultado = [...produtos];

  resultado = pesquisarProdutos(resultado);
  resultado = filtrarProdutos(resultado);
  resultado = ordenarProdutos(resultado);

  mostrarProdutos(resultado);
}

// Atualiza o texto da faixa de preço

function atualizarTextoPreco() {
  const valor = Number(faixaPreco.value);

  precoSelecionado.textContent = `até ${formatarPreco(valor)}`;
}

// Limpa todos os filtros

function limparFiltros() {
  const checkboxes = document.querySelectorAll(
    '.filtros input[type="checkbox"]'
  );

  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  campoBusca.value = '';
  campoOrdenacao.value = 'custo-beneficio';
  faixaPreco.value = faixaPreco.max;

  atualizarTextoPreco();
  mostrarProdutos(produtos);
}

// Eventos

botaoFiltrar.addEventListener('click', atualizarProdutos);

botaoLimpar.addEventListener('click', limparFiltros);

campoBusca.addEventListener('input', atualizarProdutos);

campoOrdenacao.addEventListener('change', atualizarProdutos);

faixaPreco.addEventListener('input', () => {
  atualizarTextoPreco();
  atualizarProdutos();
});

// Primeira exibição da página

async function iniciar() {
  atualizarTextoPreco();

  quantidadeEncontrada.textContent = 'Carregando notebooks...';

  produtos = await carregarProdutos();

  mostrarProdutos(produtos);
}

iniciar();
