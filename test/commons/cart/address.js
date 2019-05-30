const should  = require("should");
const request = require("request");
const chai    = require("chai");
const logger  = require("mocha-logger");
const expect  = chai.expect;

exports.setDeliveryAddress = async function (env, requestData) {
  return new Promise((resolve, reject) => {
    let path = "/app/cart/addresses/delivery";
    let form = {
      cartCode : requestData.cartCode,
      addressId: requestData.addressId
    };
    if (env.debug) {
      logger.log("Form:", JSON.stringify(form, null, 1));
    }
    request.put(
        {
          headers  : requestData.headers,
          url      : `${requestData.url.foodURL}${requestData.url.siteId}${path}`,
          form     : form,
          strictSSL: env.strictSSL
        },
        function (error, response, body) {

          expect(response.statusCode).to.equal(200);

          if (error) {
            reject(error);
          }

          resolve();
        }
    );
  });
};
