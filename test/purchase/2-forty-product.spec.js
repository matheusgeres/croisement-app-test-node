const should = require("should");
const request = require("request");
const chai = require("chai");
const expect = chai.expect;
const async = require("async");

// Ignora a verificação de certificado para Conexões TLS e requests HTTPS. Mais sobre: https://nodejs.org/api/all.html#cli_node_tls_reject_unauthorized_value
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const urlBase = "https://localhost:9002";
const urlCrfws = urlBase + "/crfws";
const urlAuthorization = urlBase + "/authorizationserver";
const foodURL = urlBase + "/foodws";
const siteId = "/v2/carrefour";

describe("Make a purchase with forty product", function(){
    // Variáveis globais que são reutilizadas entre as chamadas.
    let cartCode;
    let headers = {};
    let productsCode;
    let addressId;
    let consignmentCode;
    let slotCode;
    let slotDate;

    step("Get customer token", function(done){
        let path = "/oauth/token";
        // Chaves para realizar a autenticação
        let form = {
            client_id:'carrefour_mobileapp',
            client_secret: 'CarrefourMobileApp2018',
            grant_type: 'custom-grant',
            username:'cliente.carrefour@keyrus.com.br',
            password:'Keyrus2016',
        };

        request.post(
            {
                url: urlAuthorization + path,
                form: form
            },
            function(error, response, body) {

                let _body = {};
                try {
                    _body = JSON.parse(body);
                } catch (e) {
                    _body = {};
                }

                // Se o token de acesso é adquirido, seta o header com o mesmo.
                if(_body.should.have.property("access_token")){
                    expect(_body.access_token).to.be.a('string');
                    headers['Authorization'] = `bearer ${_body.access_token}`;
                }
                if(_body.should.have.property("refresh_token")){
                    expect(_body.refresh_token).to.be.a('string');
                }

                done();
            }
        );
    });

    step("Retrieve Cart", function(done){
        let path = "/app/cart/";
        // Query String com os parâmetros passados na URL para obter o carrinho.
        let qs = {
            // cartCode: cartCode,
            discardSession: false,
            fixQty: false
        };
        request.get(
            {
                headers: headers,
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
                
                // Se encontra o carrinho é retornado, atualiza o código do carrinho.
                if(_body.should.have.property("code")){
                    expect(_body.code).to.be.a('string');
                    cartCode = _body.code;
                }

                done();
            }
        );
    });

    step("Retrieve Products of Categoria 'Mercado'", function(done){
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

                // Se encontra a lista de produtos, faz o map para retornar uma lista de códigos de produtos.
                if(_body.should.have.property("appProductDataList")){
                    expect(_body.appProductDataList).to.be.an('array');
                    productsCode = _body.appProductDataList.map(obj => obj.code);
                }

                done();
            }
        );
    });
    
    step("Add Product to Cart", async function(done){
        let path = "/app/cart/entry";
        let qty = 1;

        async.forEachOfSeries(productsCode, (productCode, key, callback) => {
            // Parâmetros enviados para adicionar um produto no carrinho.
            let form = {
                cartCode: cartCode,
                productCode: productCode,
                qty: qty,
                discardSession: false
            };
            request.post(
                {
                    headers: headers,
                    url: foodURL + siteId + path,
                    form: form
                },
                function(error, response, body) {

                    let _body = {};
                    try {
                    _body = JSON.parse(body);
                    } catch (e) {
                    _body = {};
                    }
                    
                    if(_body.should.have.property("code")){
                        if(_body.entries==undefined){
                            expect(response.statusCode).to.equal(200);
                        }else{
                            let el = _body.entries.length-1;
                            expect(_body.entries[el].product.code).to.equal(productCode);
                        }
                    }
                    
                    callback();
                }
            );
        }, err => {
            // Se tem erro, exibe a mensagem na console.
            if (err){
                console.error(err.message);
            } else{
                // Na ausência de erro, informa ao mocha que o processo foi concluído.
                done();
            }
        });
    });

    step("Retrieve All Addresses", function(done){
        let path = "/app/customer/current/addresses";
        request.get(
            {
                headers: headers,
                url: foodURL + siteId + path,
            },
            function(error, response, body) {

                let _body = {};
                try {
                  _body = JSON.parse(body);
                } catch (e) {
                  _body = {};
                }

                if(_body.should.have.property("addresses")){
                    expect(_body.addresses[0].id).to.be.a('string');
                    addressId = _body.addresses[0].id;
                }

                done();
            }
        );
    });

    step("Set Delivery Adress", function(done){
        let path = "/app/cart/addresses/delivery";
        let form = {
            cartCode: cartCode,
            addressId: addressId
        };
        request.put(
            {
                headers: headers,
                url: foodURL + siteId + path,
                form: form
            },
            function(error, response, body) {

                expect(response.statusCode).to.equal(200);

                done();
            }
        );
    });

    step("Get Delivery Modes", function(done){
        let path = "/app/cart/deliverymodes";
        request.get(
            {
                headers: headers,
                url: foodURL + siteId + path,
            },
            function(error, response, body) {

                let _body = {};
                try {
                  _body = JSON.parse(body);
                } catch (e) {
                  _body = {};
                }

                if(_body.should.have.property("deliveryModeList")){
                    expect(_body.deliveryModeList[0].consignmentCode).to.be.a('string');
                    consignmentCode = _body.deliveryModeList[0].consignmentCode;
                }

                done();
            }
        );
    });

    step("Retrieve Delivery Slots", function(done){
        let path = "/app/cart/deliveryslots";
        let form = {
            deliveryMode: 'Cedo',
            consignmentCode: consignmentCode
        };
        request.post(
            {
                headers: headers,
                url: foodURL + siteId + path,
                form: form
            },
            function(error, response, body) {

                let _body = {};
                try {
                  _body = JSON.parse(body);
                } catch (e) {
                  _body = {};
                }

                if(_body.should.have.property("availableSlotDataList")){
                    expect(_body.availableSlotDataList[0].code).to.be.a('string');
                    expect(_body.availableSlotDataList[0].scheduleDate).to.be.a('string');

                    slotCode = _body.availableSlotDataList[0].code;
                    slotDate = _body.availableSlotDataList[0].scheduleDate;
                }

                done();
            }
        );
    });

    step("Set Delivery Mode", function(done){
        let path = "/app/cart/set-delivery-mode";
        let form = {
            deliveryMode: 'manhã',
            consignmentCode: consignmentCode,
            scheduleDate: slotDate,
            slotCode: slotCode
        };
        request.post(
            {
                headers: headers,
                url: foodURL + siteId + path,
                form: form
            },
            function(error, response, body) {

                expect(response.statusCode).to.equal(200);

                done();
            }
        );
    });

    step("Place Order With Credit Card Method", function(done){
        let path = "/app/payment/place-order-credit-card-payment";
        let qs = {
            cartCode: cartCode
        };
        let form = {
            accountHolderName: 'Customer',
            cardNumber: '',
            cardNumber: 41111111111111111,
            expiryMonth: 6,
            expiryYear: 2020,
            verificationNumber: 737,
            installments: 1,
            cardType: 'Visa',
            saveCC: false,
            AdobeID: null
        }
        request.post(
            {
                headers: headers,
                url: foodURL + siteId + path,
                qs: qs,
                form: form
            },
            function(error, response, body) {

                let _body = {};
                try {
                  _body = JSON.parse(body);
                } catch (e) {
                  _body = {};
                }

                expect(response.statusCode).to.equal(200);

                done();
            }
        );
    });

    after(() => console.log('\n\ncartCode ==> ', cartCode));
});