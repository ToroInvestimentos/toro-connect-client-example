# example-command-line

## Configuração

Complete as propriedades do objeto

```
const credentials = {
  client_id: '', // Insira o identificador de parceiro
  client_secret: '', // Insira o segredo de parceiro
  redirect_uris: [ '' ], // Insira a URL de callback
  scope: 'openid profile email accounts' // Com exceção do openid, os outros escopos são opcionais
}
```

## Execução

1. comando: `node e2e-flow-toro.js`
2. Copie a url após o redirecionamento e cole no terminal