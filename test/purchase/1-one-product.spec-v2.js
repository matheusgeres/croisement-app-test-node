const should  = require("should");
const request = require("request");
const chai    = require("chai");
const async   = require("async");
const logger  = require("mocha-logger");
const env     = require("../local.env.json");
const expect  = chai.expect;

// Ignora a verificação de certificado para Conexões TLS e requests HTTPS. Mais sobre: https://nodejs.org/api/all.html#cli_node_tls_reject_unauthorized_value
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const urlBase          = env.urlBase;
const urlCrfws         = `${urlBase}/crfws`;
const urlAuthorization = `${urlBase}/authorizationserver`;
const foodURL          = `${urlBase}/foodws`;
const siteId           = "/v2/carrefour";

describe("Make a purchase with one product", function () {
  // Variáveis globais que são reutilizadas entre as chamadas.
  let cartCode;
  let headers = {};
  let addressId;
  let consignmentCode;
  let slotCode;
  let slotDate;
  let productCodesToDelete;

  step("Get customer token", async function (done) {
    let path = "/oauth/token";
    // Chaves para realizar a autenticação
    let form = {
      client_id    : env.token.client_id,
      client_secret: env.token.client_secret,
      grant_type   : env.token.grant_type,
      username     : env.token.username,
      password     : env.token.password,
    };
    if (env.debug) {
      logger.log("Form:", JSON.stringify(form, null, 1));
    }

    request.post(
        {
          url : `${urlAuthorization}${path}`,
          form: form
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

          // Se o token de acesso é adquirido, seta o header com o mesmo.
          _body.should.have.property("access_token");
          expect(_body.access_token).to.be.a('string');
          headers['Authorization'] = `bearer ${_body.access_token}`;
          _body.should.have.property("refresh_token");
          expect(_body.refresh_token).to.be.a('string');

          done();
        }
    );
  });

  step("Retrieve Cart", async function (done) {
    let path = "/app/cart/";
    // Query String com os parâmetros passados na URL para obter o carrinho.
    let qs   = {
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
          headers: headers,
          url    : `${foodURL}${siteId}${path}`,
          qs     : qs
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

          // Se encontra o carrinho é retornado, atualiza o código do carrinho.
          _body.should.have.property("code");
          expect(_body.code).to.be.a('string');
          cartCode = _body.code;

          productCodesToDelete = (_body.entries || [])
          .map(oe => oe.product)
          .map(p => p.code);

          logger.log('Product to clear', JSON.stringify(productCodesToDelete, null, 1));

          done();
        }
    );
  });

  step("Clear Cart", async function (done) {
    if (productCodesToDelete.length === 0) {
      this.skip();
    }

    let path = "/app/cart/entry/";
    let qs   = {
      cartCode: cartCode
    };
    if (env.debug) {
      logger.log("QueryString:", JSON.stringify(qs, null, 1));
    }

    async.forEachOfSeries(productCodesToDelete, (productCode, key, callback) => {
      // Parâmetros enviados para adicionar um produto no carrinho.
      request.delete(
          {
            headers: headers,
            url    : `${foodURL}${siteId}${path}${productCode}?cartCode=${cartCode}&discardSession=false`,
            qs     : qs
          },
          function (error, response, body) {

            logger.log('Cleaning product', productCode);

            expect(response.statusCode).to.equal(200);

            callback();
          }
      );
    }, err => {
      // Se tem erro, exibe a mensagem na console.
      if (err) {
        console.error(err.message);
      } else {
        // Na ausência de erro, informa ao mocha que o processo foi concluído.
        done();
      }
    });
  });

  step("Retrieve All Addresses", async function (done) {
    if (env.deliveryAddress.force) {
      addressId = env.deliveryAddress.addressId;
      this.skip();
    }

    let path = "/app/customer/current/addresses";
    request.get(
        {
          headers: headers,
          url    : `${foodURL}${siteId}${path}`,
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

          _body.should.have.property("addresses");
          expect(_body.addresses[0].id).to.be.a('string');
          addressId = _body.addresses[0].id;

          done();
        }
    );
  });

  step("Set Delivery Adress", async function (done) {
    let path = "/app/cart/addresses/delivery";
    let form = {
      cartCode : cartCode,
      addressId: addressId
    };
    if (env.debug) {
      logger.log("Form:", JSON.stringify(form, null, 1));
    }
    request.put(
        {
          headers: headers,
          url    : `${foodURL}${siteId}${path}`,
          form   : form
        },
        function (error, response, body) {

          expect(response.statusCode).to.equal(200);

          done();
        }
    );
  });

  step("Add Product to Cart", async function (done) {
    let path        = "/app/cart/entry";
    let productCode = env.product.productCode;
    let qty         = 1;
    // Parâmetros enviados para adicionar um produto no carrinho.
    let form        = {
      cartCode      : cartCode,
      productCode   : productCode,
      qty           : qty,
      discardSession: true
    };
    if (env.debug) {
      logger.log("Form:", JSON.stringify(form, null, 1));
    }

    request.post(
        {
          headers: headers,
          url    : `${foodURL}${siteId}${path}`,
          form   : form
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

          done();
        }
    );
  });

  step("Get Delivery Modes", async function (done) {
    let path = "/app/cart/v2/deliverymodes";
    let qs = {
      deliveryModeCode: env.deliveryModeCode
    };
    
    request.get(
        {
          headers: headers,
          url    : `${foodURL}${siteId}${path}`,
          qs: qs
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

          _body.should.have.property("deliveryModeList");
          expect(_body.deliveryModeList[0].consignmentCode).to.be.a('string');
          consignmentCode = _body.deliveryModeList[0].consignmentCode;

          done();
        }
    );
  });

  step("Retrieve Delivery Slots", async function (done) {
    let path = "/app/cart/v2/deliveryslots";
    let form = {
      deliveryMode   : env.deliveryModePeriodCode,
      consignmentCode: consignmentCode
    };
    if (env.debug) {
      logger.log("Form:", JSON.stringify(form, null, 1));
    }

    request.post(
        {
          headers: headers,
          url    : `${foodURL}${siteId}${path}`,
          form   : form
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

          _body.should.have.property("availableSlotDataList");
          expect(_body.availableSlotDataList[0].code).to.be.a('string');
          expect(_body.availableSlotDataList[0].scheduleDate).to.be.a('string');

          slotCode = _body.availableSlotDataList[0].code;
          slotDate = _body.availableSlotDataList[0].scheduleDate;

          done();
        }
    );
  });

  step("Set Delivery Mode", async function (done) {
    let path = "/app/cart/v2/set-delivery-mode";
    let form = {
      deliveryMode   : env.deliveryModePeriodCode,
      consignmentCode: consignmentCode,
      driveWarehouse : env.driveWarehouse,
      drivePos       : env.drivePos,
      modality       : env.modality,
      scheduleDate   : slotDate,
      slotCode       : slotCode
    };
    if (env.debug) {
      logger.log("Form:", JSON.stringify(form, null, 1));
    }

    request.post(
        {
          headers: headers,
          url    : `${foodURL}${siteId}${path}`,
          form   : form
        },
        function (error, response, body) {

          expect(response.statusCode).to.equal(200);

          done();
        }
    );
  });

  step("Place Order With Credit Card Method", async function (done) {
    let path = "/app/payment/place-order-credit-card-payment";
    let qs   = {
      cartCode: cartCode
    };
    let form = {
      accountHolderName : env.card.accountHolderName,
      cardNumber        : env.card.cardNumber,
      expiryMonth       : env.card.expiryMonth,
      expiryYear        : env.card.expiryYear,
      verificationNumber: env.card.verificationNumber,
      installments      : env.card.installments,
      cardType          : env.card.cardType,
      saveCC            : env.card.saveCC,
      AdobeID           : env.card.saveCC
    };
    if (env.debug) {
      logger.log("Form:", JSON.stringify(form, null, 1));
      logger.log("QueryString:", JSON.stringify(qs, null, 1));
    }

    request.post(
        {
          headers: headers,
          url    : `${foodURL}${siteId}${path}`,
          qs     : qs,
          form   : form
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

          expect(response.statusCode).to.equal(200);

          done();
        }
    );
  });

  after(() => console.log('\n\ncartCode ==> ', cartCode));
});
