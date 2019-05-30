const should  = require("should");
const request = require("request");
const chai    = require("chai");
const logger  = require("mocha-logger");
const async   = require("async");
const expect  = chai.expect;

exports.retrieveCart = async function (env, requestData) {
  return new Promise((resolve, reject) => {
    const path = "/app/cart/";
    // Query String com os parâmetros passados na URL para obter o carrinho.
    const qs   = {
      // cartCode: cartCode,
      discardSession : true,
      fixQty         : true,
      removeAvailable: true
    };
    if (env.debug) {
      logger.log("QueryString:", JSON.stringify(qs, null, 1));
    }

    request.get(
        {
          headers: requestData.headers,
          url    : `${requestData.url.foodURL}${requestData.url.siteId}${path}`,
          qs     : qs,
          strictSSL: env.strictSSL
        },
        function (error, response, body) {

          let _body;
          try {
            _body = JSON.parse(body);
            if (env.debug) {
              logger.log("Body:", JSON.stringify(_body, null, 1));
            }
          } catch (e) {
            _body = {};
          }

          // Se encontra o carrinho é retornado, atualiza o código do carrinho.
          _body.should.have.property("code");
          expect(_body.code).to.be.a('string');

          const responseData = {
            cartCode            : _body.code,
            productCodesToDelete: (_body.entries || [])
            .map(oe => oe.product)
            .map(p => p.code),
          };

          if (error) {
            reject(error);
          }
          if (env.debug) {
            logger.log(JSON.stringify(responseData, null, 1));
          }
          resolve(responseData);
        }
    );
  });
};

exports.clearCart = async function (env, requestData) {
  return new Promise((resolve, reject) => {
    let path = "/app/cart/entry/";
    let qs   = {
      cartCode      : requestData.cartCode,
      discardSession: false
    };
    if (env.debug) {
      logger.log("QueryString:", JSON.stringify(qs, null, 1));
    }

    async.forEachOfSeries(requestData.productCodesToDelete, (productCode, key, callback) => {
      // Parâmetros enviados para adicionar um produto no carrinho.
      request.delete(
          {
            headers: requestData.headers,
            url    : `${requestData.url.foodURL}${requestData.url.siteId}${path}${productCode}`,
            qs     : qs,
            strictSSL: env.strictSSL
          },
          function (error, response, body) {

            expect(response.statusCode).to.equal(200);

            callback();
          }
      );
    }, err => {
      // Se tem erro, exibe a mensagem na console.
      if (err) {
        logger.error(err.message);
        reject(err);
      } else {
        // Na ausência de erro, informa ao mocha que o processo foi concluído.
        resolve();
      }
    });
  });
};

exports.addProducts = async function(env, requestData){
    return new Promise((resolve, reject) => {
        let path = "/app/cart/entry";
        async.forEachOfSeries(requestData.productCodesToPurchase, (productCode, key, callback) => {
            // Parâmetros enviados para adicionar um produto no carrinho.
            let form = {
              cartCode      : requestData.cartCode,
              productCode   : productCode,
              qty           : requestData.qty,
              discardSession: true
            };
            if (env.debug) {
              logger.log("Form:", JSON.stringify(form, null, 1));
            }
      
            request.post(
                {
                  headers: requestData.headers,
                  url    : `${requestData.url.foodURL}${requestData.url.siteId}${path}`,
                  form   : form,
                  strictSSL: env.strictSSL
                },
                function (error, response, body) {
      
                  let _body = {};
                  try {
                    _body = JSON.parse(body);
                    if (env.debug) {
                      logger.log("Body:", JSON.stringify(_body, null, 1));
                    }
                  } catch (e) {
                    _body = {};
                  }
      
                  _body.should.have.property("code");
                  _body.should.have.property("entries");
                  let el = _body.entries.length - 1;
                  expect(_body.entries[el].product.code).to.equal(productCode);
      
                  callback();
                }
            );
          }, err => {
            // Se tem erro, exibe a mensagem na console.
            if (err) {
              logger.error(err.message);
              reject();
            } else {
              // Na ausência de erro, informa ao mocha que o processo foi concluído.
              resolve();
            }
          });
    });
    
}
