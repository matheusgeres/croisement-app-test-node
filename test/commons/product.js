const should  = require("should");
const request = require("request");
const chai    = require("chai");
const logger  = require("mocha-logger");
const expect  = chai.expect;

exports.findProducts = async function (env, requestData) {
  return new Promise((resolve, reject) => {
    let path = "/app/products/find-products";
    // Query String com os parâmetros passados na URL para obter os produtos.
    let qs   = {
      category   : env.product.category,
      pageSize   : env.product.pageSize,
      currentPage: 0
    };
    request.get(
        {
          url: `${requestData.url.foodURL}${requestData.url.siteId}${path}`,
          qs : qs,
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

          // Se encontra a lista de produtos, faz o map para retornar uma lista de códigos de produtos.
          _body.should.have.property("appProductDataList");
          expect(_body.appProductDataList).to.be.an('array');
          
          const responseData = {
            productCodesToPurchase: _body.appProductDataList.map(obj => obj.code)
          }

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
}