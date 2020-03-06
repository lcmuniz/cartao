<script>
  import Cartao from "./Cartao.svelte";

  let nome = "Luiz Carlos";
  let titulo = "";
  let imagem = "";
  let descricao = "";
  let statusContato = "novo";

  let mensagem = [
    "Nome é obrigatório",
    "Título é obrigatório",
    "Descrição é obrigatória"
  ];

  let erros = [];

  function adicionarContato() {
    erros = [];

    if (nome === "") {
      erros.push(mensagem[0]);
    }
    if (titulo === "") {
      erros.push(mensagem[1]);
    }
    if (descricao === "") {
      erros.push(mensagem[2]);
    }

    if (erros.length === 0) {
      statusContato = "valido";
    } else {
      statusContato = "invalido";
    }
  }
</script>

<style>
  #form {
    width: 30rem;
    max-width: 100%;
  }
  .erro {
    color: red;
  }
</style>

<div id="form">
  <div class="form-control">
    <label for="nome">Nome</label>
    <input type="text" bind:value={nome} id="nome" />
  </div>
  <div class="form-control">
    <label for="titulo">Título</label>
    <input type="text" bind:value={titulo} id="titulo" />
  </div>
  <div class="form-control">
    <label for="imagem">URL da Imagem</label>
    <input type="text" bind:value={imagem} id="imagem" />
  </div>
  <div class="form-control">
    <label for="descricao">Descrição</label>
    <textarea rows="3" bind:value={descricao} id="descricao" />
  </div>
</div>

<button on:click={adicionarContato}>Adicionar Contato</button>

{#if statusContato === 'valido'}
  <Cartao {nome} {titulo} {descricao} {imagem} />
{:else if statusContato === 'invalido'}
  <h3 class="erro">Preencha os dados obrigatórios:</h3>
  <ul class="erro">

    {#each erros as erro}
      <li>{erro}</li>
    {/each}

  </ul>
{:else}
  <h3>Preencha os campos acima</h3>
{/if}
