const should  = require("should");
const request = require("request");
const chai    = require("chai");
const logger  = require("mocha-logger");
const env     = require("../local.env.json");
const expect  = chai.expect;

// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const urlBase          = env.urlBase;
const urlCrfws         = `${urlBase}/crfws`;
const urlAuthorization = `${urlBase}/authorizationserver`;
const foodURL          = `${urlBase}/foodws`;
const siteId           = "/v2/carrefour";

describe("List of Products", function () {
  step(`Retrieve Products of Category '${env.product.category}'`, async function (done) {
    let path = "/app/products/find-products";
    // Query String com os parâmetros passados na URL para obter os produtos.
    let qs   = {
      category   : env.product.category,
      pageSize   : env.product.pageSize,
      currentPage: 0,
      strictSSL: env.strictSSL
    };
    request.get(
        {
          url: `${foodURL}${siteId}${path}`,
          qs : qs
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

          _body.should.have.property("appProductDataList");
          expect(_body.appProductDataList).to.be.a('array');

          done();
        }
    );
  });
});
