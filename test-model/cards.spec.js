/**
 * Arquivo exemplo para teste de api
 * A API utilizada neste projeto eh
 * @see https://magicthegathering.io/
 *
 * Este exemplo faz parte de um post no medium
 * @see  https://medium.com/@hdeodato/teste-autom%C3%A1tico-de-api-rest-usando-com-node-js-mocha-chai-6aec4613d100
 *
 * @author Henrique Deodato
 * @see twitter.com/hdeodato
 */

/**
 * Carrega as bibliotecas que vamos utilizar
 * O mocha nao eh carregado aqui, pois ele que executa este arquivo
 */
var should  = require("should");
var request = require("request");
var chai    = require("chai");
var expect  = chai.expect;
var urlBase = "https://api.magicthegathering.io/v1";

// Criamos nosso primeiro caso de teste e fornecemos uma descricao utilizando describe
describe("Teste API magicthegathering.io", function () {
  // a funcao it eh o que vamos testar realmente, neste caso o endpoint /cards, que deve retornar no maximo 100 cartas
  it("Deve receber 100 cartas", function (done) {
    request.get(
        {
          url: `${urlBase}/cards`
        },
        function (error, response, body) {
          // precisamos converter o retorno para um objeto json
          var _body = {};
          try {
            _body = JSON.parse(body);
          } catch (e) {
            _body = {};
          }

          // utilizando a funcao expect do chai, vamos verificar se o resultado da chamada foi sucesso (200)
          expect(response.statusCode).to.equal(400);

          // agora, verificamos se retornou a propriedade cards
          if (_body.should.have.property("cards")) {
            //se retornou, vamos verificar o tamanho, deve ser menor ou igual a 100 itens
            expect(_body.cards).to.have.lengthOf.at.most(100);
          }

          done(); // avisamos o test runner que acabamos a validacao e ja pode proseeguir
        }
    );
  });

  it("Deve receber a carta 'A Indiferente' ", function (done) {
    before(function () {
      this.skip();
    });

    //faremos a chamada com o nome em ingles mesmo, para verificar se eh a carta correta, vamos ver o artista e o nome da carta novamente
    request.get(
        {
          url: `${urlBase}/cards?name=Heedless One`
        },
        function (error, response, body) {
          // precisamos converter o retorno para um objeto json
          var _body = {};
          try {
            _body = JSON.parse(body);
          } catch (e) {
            _body = {};
          }

          // sucesso (200)?
          expect(response.statusCode).to.equal(200);

          // agora, verificamos se retornou a propriedade cards
          if (_body.should.have.property("cards")) {
            //como filtramos, queremos que retorne pelo menos 1, pois existem varias versoes da mesma carta
            expect(_body.cards).to.have.lengthOf.at.least(1);

            //faz a verificacao na primeira carta
            if (_body.cards[0].should.have.property("artist")) {
              expect(_body.cards[0].artist).to.equal("Mark Zug");
            }
            if (_body.cards[0].should.have.property("name")) {
              expect(_body.cards[0].name).to.equal("Heedless One");
            }
          }

          done(); // avisamos o test runner que acabamos a validação e já pode proseeguir
        }
    );
  });
});
