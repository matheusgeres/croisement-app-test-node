const should = require("should");
const request = require("request");
const chai = require("chai");
const expect = chai.expect;

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const urlBase = "https://localhost:9002";
const urlCrfws = urlBase + "/crfws";
const urlAuthorization = urlBase + "/authorizationserver";
const foodURL = urlBase + "/foodws";
const siteId = "/v2/carrefour";

describe("List of Products", function(){
    step("Retrieve Products of Category 'Mercado'", function(done){
        let path = "/app/products/find-products";
        // Query String com os parâmetros passados na URL para obter os produtos.
        let qs = {
            category: 'mercado',
            pageSize: 40,
            currentPage: 0
        };
        request.get(
            {
                url: foodURL + siteId + path,
                qs: qs
            },
            function(error, response, body) {

                let _body = {};
                try {
                  _body = JSON.parse(body);
                } catch (e) {
                  _body = {};
                }

                if(_body.should.have.property("appProductDataList")){
                    expect(_body.appProductDataList).to.be.a('array');
                }

                done();
            }
        );
    });
});