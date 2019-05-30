const should  = require("should");
const request = require("request");
const chai    = require("chai");
const logger  = require("mocha-logger");
const expect  = chai.expect;

exports.retrieveToken = async function (env, requestData) {
  return new Promise((resolve, reject) => {
    let path = "/oauth/token";
    // Chaves para realizar a autenticação
    let form = {
      client_id    : env.token.client_id,
      client_secret: env.token.client_secret,
      grant_type   : env.token.grant_type,
      username     : env.token.username,
      password     : env.token.password,
    };
    if (env.debug) {
      logger.log("Form:", JSON.stringify(form, null, 1));
    }

    request.post(
        {
          url      : `${requestData.url.urlAuthorization}${path}`,
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

          // Se o token de acesso é adquirido, seta o header com o mesmo.
          _body.should.have.property("access_token");
          expect(_body.access_token).to.be.a('string');
          _body.should.have.property("refresh_token");
          expect(_body.refresh_token).to.be.a('string');

          let responseData = {
            authorization: `bearer ${_body.access_token}`
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

