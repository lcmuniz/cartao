<script>
  export let nome;
  export let titulo;
  export let descricao;
  export let imagem;
</script>

<style>
  .cartao {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
    max-width: 30rem;
    border-radius: 5px;
    margin: 1rem 0;
    background: white;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 7rem;
  }

  .imagem {
    width: 33%;
    height: 100%;
  }

  .imagem-placeholder {
    background: #ccc;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .usuario {
    width: 67%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 1rem;
  }

  h1 {
    font-size: 1.25rem;
    font-family: "Roboto Slab", sans-serif;
    margin: 0.5rem 0;
  }

  h2 {
    font-size: 1rem;
    font-weight: normal;
    color: #5a5a5a;
    margin: 0;
    margin-bottom: 0.5rem;
  }

  .descricao {
    border-top: 1px solid #ccc;
    padding: 1rem;
  }
</style>

<div class="cartao">
  <header>
    <div class="imagem" class:imagem-placeholder={!imagem}>
      <img src={imagem} alt={nome} />
    </div>
    <div class="usuario">
      <h1>{nome}</h1>
      <h2>{titulo}</h2>
    </div>
  </header>
  <div class="descricao">
    <p>{descricao}</p>
  </div>
</div>
