const should  = require("should");
const request = require("request");
const chai    = require("chai");
const logger  = require("mocha-logger");
const expect  = chai.expect;

exports.placeOrderCreditCard = async function (env, requestData) {
  return new Promise((resolve, reject) => {
    let path = "/app/payment/place-order-credit-card-payment";
    let qs   = {
      cartCode: requestData.cartCode
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
          headers  : requestData.headers,
          url      : `${requestData.url.foodURL}${requestData.url.siteId}${path}`,
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

          if (error) {
            reject(error);
          }

          resolve();
        }
    );

  });
};
