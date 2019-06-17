const logger   = require("mocha-logger");
const env      = require("../local-food.env");
const customer = require("../commons/customer");
const cart     = require("../commons/cart");
const payment  = require("../commons/payment");
const address  = require("../commons/cart/address");
const delivery = require("../commons/cart/delivery");

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

describe("Clean actual cart", function () {
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

    const responseData       = await customer.retrieveToken(env, requestData);
    headers['Authorization'] = responseData.authorization;

    done();
  });

  step("Retrieve Cart", async function (done) {
    const requestData = {
      url    : url,
      headers: headers
    };

    const responseData   = await cart.retrieveCart(env, requestData);
    productCodesToDelete = responseData.productCodes;
    cartCode             = responseData.cartCode;

    done();
  });

  step("Clear Cart", async function (done) {
    if (productCodesToDelete.length === 0) {
      return done();
    }

    const requestData = {
      url         : url,
      headers     : headers,
      cartCode    : cartCode,
      productCodes: productCodesToDelete
    };

    await cart.clearCart(env, requestData);

    done();
  });
});