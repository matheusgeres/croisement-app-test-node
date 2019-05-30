const should  = require("should");
const request = require("request");
const chai    = require("chai");
const logger  = require("mocha-logger");
const expect  = chai.expect;

exports.retrieveAllAddress = async function (env, requestData) {
  return new Promise((resolve, reject) => {
    let path = "/app/customer/current/addresses";
    request.get(
        {
          headers  : requestData.headers,
          url      : `${requestData.url.foodURL}${requestData.url.siteId}${path}`,
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

          _body.should.have.property("addresses");
          expect(_body.addresses[0].id).to.be.a('string');

          const responseData = {
            addressId: _body.addresses[0].id
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
