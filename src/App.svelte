<script>
  import Cartao from "./Cartao.svelte";

  let nome = "Luiz";
  let titulo = "";
  let imagem = "";
  let descricao = "";
</script>

<style>
  #form {
    width: 30rem;
    max-width: 100%;
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

<Cartao {nome} {titulo} {descricao} {imagem} />
