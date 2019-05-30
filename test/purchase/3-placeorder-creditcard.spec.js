const logger   = require("mocha-logger");
const env      = require("../local-food.env");
const customer = require("../commons/customer");
const cart     = require("../commons/cart");
const payment  = require("../commons/payment");
const address  = require("../commons/cart/address");
const delivery = require("../commons/cart/delivery");
const product  = require("../commons/product");

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

describe("Place order with Credit Card and forty products on cart.", function () {
  // Variáveis globais que são reutilizadas entre as chamadas.
  let cartCode;
  let headers = {};
  let productCodesToPurchase;
  let productCodesToDelete;
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

  step(`Retrieve Products of Category '${env.product.category}'`, async function (done) {
    const requestData = {
      url: url
    };

    responseData = await product.findProducts(env, requestData);
    productCodesToPurchase = responseData.productCodesToPurchase;

    done();
  });

  step("Add Product to Cart", async function (done) {
    const requestData = {
      url         : url,
      headers     : headers,
      productCodes: productCodesToPurchase,
      quantity    : env.product.quantity
    }

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
    const requestData = {
      url            : url,
      headers        : headers,
      consignmentCode: consignmentCode,
      slotDate       : slotDate,
      slotCode       : slotCode
    };

    await delivery.setDeliveryMode(env, requestData);

    done();
  });

  xstep("Place Order With Credit Card Method", async function (done) {
    const requestData = {
      url     : url,
      headers : headers,
      cartCode: cartCode
    };

    await payment.placeOrderCreditCard(env, requestData);

    done();
  });

  after(() => logger.log('cartCode ==> ', cartCode));
});
