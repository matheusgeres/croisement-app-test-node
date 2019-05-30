const should   = require("should");
const request  = require("request");
const chai     = require("chai");
const async    = require("async");
const logger   = require("mocha-logger");
const env      = require("../local.env");
const customer = require("../commons/customer");
const cart     = require("../commons/cart");
const address  = require("../commons/cart/address");
const delivery = require("../commons/cart/delivery");
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
};

describe("Make a purchase with one product", function () {
  // Variáveis globais que são reutilizadas entre as chamadas.
  let headers              = {};
  let productCodesToDelete = [];
  let cartCode;
  let addressId;
  let consignmentCode;
  let slotCode;
  let slotDate;

  step("Retrieve (Get) customer token", async function (done) {

    const requestData = {url: url};

    const responseData       = await customer.retrieve_token(env, requestData);
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
      url                 : url,
      headers             : headers,
      cartCode            : cartCode,
      productCodesToDelete: productCodesToDelete
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

    let responseData = await customer.retrieveAllAddress(env, requestData);
    addressId        = responseData.addressId;

    done();
  });

  step("Set Delivery Address", async function (done) {
    const requestData = {
      url      : url,
      headers  : headers,
      cartCode : cartCode,
      addressId: addressId
    };

    await address.setDeliveryAddress(env, requestData);

    done();
  });

  step("Add Product to Cart", async function (done) {
    const requestData = {
      url         : url,
      headers     : headers,
      productCodes: [env.product.productCode],
      quantity    : env.product.quantity
    };

    await cart.addProducts(env, requestData);

    done();

  });

  step("Retrieve (Get) Delivery Modes", async function (done) {
    const requestData = {
      url    : url,
      headers: headers
    };

    let responseData = await delivery.retrieveDeliveryModes(env, requestData);
    consignmentCode  = responseData.consignmentCode;

    done();
  });

  step("Retrieve Delivery Slots", async function (done) {
    const requestData = {
      url            : url,
      headers        : headers,
      consignmentCode: consignmentCode
    };

    let responseData = await delivery.retrieveDeliverySlots(env, requestData);
    slotCode         = responseData.slotCode;
    slotDate         = responseData.slotDate;

    done();
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
          headers  : headers,
          url      : `${foodURL}${siteId}${path}`,
          qs       : qs,
          form     : form,
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

          expect(response.statusCode).to.equal(200);

          done();
        }
    );
  });

  after(() => logger.log('cartCode ==> ', cartCode));
});
