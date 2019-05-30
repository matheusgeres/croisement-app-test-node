const should  = require("should");
const request = require("request");
const chai    = require("chai");
const logger  = require("mocha-logger");
const expect  = chai.expect;

exports.retrieveDeliveryModes = async function (env, requestData) {
  return new Promise((resolve, reject) => {
    let path = "/app/cart/deliverymodes";
    request.get(
        {
          headers  : requestData.headers,
          url      : `${requestData.url.foodURL}${requestData.url.siteId}${path}`,
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

          let responseData = {
            consignmentCode: _body.deliveryModeList[0].consignmentCode
          };
          if (error) {
            reject(error);
          }

          resolve(responseData);
        }
    );
  });
};
