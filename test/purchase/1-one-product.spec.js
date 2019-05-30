const should   = require("should");
const request  = require("request");
const chai     = require("chai");
const async    = require("async");
const logger   = require("mocha-logger");
const env      = require("../local-food.env");
const customer = require("../commons/customer");
const cart     = require("../commons/cart");
const address  = require("../commons/address");
const expect   = chai.expect;

// Ignora a verificação de certificado para Conexões TLS e requests HTTPS. Mais sobre: https://nodejs.org/api/all.html#cli_node_tls_reject_unauthorized_value
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const urlBase          = env.urlBase;
const urlCrfws         = `${urlBase}/crfws`;
const urlAuthorization = `${urlBase}/authorizationserver`;
const foodURL          = `${urlBase}/foodws`;
const siteId           = "/v2/carrefour";

const url = {
  urlBase         : urlBase,
  urlCrfws        : urlCrfws,
  urlAuthorization: urlAuthorization,
  foodURL         : foodURL,
  siteId          : siteId
}

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

    const requestData = {url: url};

    const responseData       = await customer.generate_token(env, requestData);
    headers['Authorization'] = responseData.authorization;

    done();
  });

  step("Retrieve Cart", async function (done) {
    const requestData = {
      url    : url,
      headers: headers
    };

    const responseData   = await cart.retrieveCart(env, requestData);
    productCodesToDelete = responseData.productCodesToDelete;
    cartCode             = responseData.cartCode;

    done();
  });

  step("Clear Cart", async function (done) {
    if (productCodesToDelete.length === 0) {
      return done();
    }

    const requestData = {
      url     : url,
      headers : headers,
      cartCode: cartCode
    };

    await cart.clearCart(env, requestData);

    done();
  });

  step("Retrieve All Addresses", async function (done) {
    if (env.deliveryAddress.force) {
      addressId = env.deliveryAddress.addressId;
      return done();
    }

    const requestData = {
      url    : url,
      headers: headers
    };

    let responseData = await address.retrieveAllAddress(env, requestData);
    addressId        = responseData.addressId;

    done();
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
          headers  : headers,
          url      : `${foodURL}${siteId}${path}`,
          form     : form,
          strictSSL: env.strictSSL
        },
        function (error, response, body) {

          expect(response.statusCode).to.equal(200);

          done();
        }
    );
  });

  step("Add Product to Cart", async function (done) {
    const requestData = {
      url: url,
      productCodesToPurchase: [env.product.productCode],
      qty                   : 1
    }
    
    await cart.addProducts(env, requestData);

    done();

  });

  step("Get Delivery Modes", async function (done) {
    let path = "/app/cart/deliverymodes";
    request.get(
        {
          headers: headers,
          url    : `${foodURL}${siteId}${path}`,
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

          _body.should.have.property("deliveryModeList");
          expect(_body.deliveryModeList[0].consignmentCode).to.be.a('string');
          consignmentCode = _body.deliveryModeList[0].consignmentCode;

          done();
        }
    );
  });

  step("Retrieve Delivery Slots", async function (done) {
    let path = "/app/cart/deliveryslots";
    let form = {
      deliveryMode   : env.deliverySlots.deliveryMode,
      consignmentCode: consignmentCode
    };
    if (env.debug) {
      logger.log("Form:", JSON.stringify(form, null, 1));
    }

    request.post(
        {
          headers: headers,
          url    : `${foodURL}${siteId}${path}`,
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
    let path = "/app/cart/set-delivery-mode";
    let form = {
      deliveryMode   : env.deliveryMode,
      consignmentCode: consignmentCode,
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
          form   : form,
          strictSSL: env.strictSSL
        },
        function (error, response, body) {

          expect(response.statusCode).to.equal(200);

          done();
        }
    );
  });

  xstep("Place Order With Credit Card Method", async function (done) {
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

          expect(response.statusCode).to.equal(200);

          done();
        }
    );
  });

  after(() => logger.log('\n\ncartCode ==> ', cartCode));
});
