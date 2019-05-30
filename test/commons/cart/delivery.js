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

          let _body;
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

exports.retrieveDeliveryModesV2 = async function (env, requestData) {
  return new Promise((resolve, reject) => {
    let path = "/app/cart/v2/deliverymodes";
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

exports.retrieveDeliverySlots = async function (env, requestData) {
  return new Promise((resolve, reject) => {
    let path = "/app/cart/deliveryslots";
    let form = {
      deliveryMode   : env.deliverySlots.deliveryMode,
      consignmentCode: requestData.consignmentCode
    };
    if (env.debug) {
      logger.log("Form:", JSON.stringify(form, null, 1));
    }

    request.post(
        {
          headers  : requestData.headers,
          url      : `${requestData.url.foodURL}${requestData.url.siteId}${path}`,
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

          _body.should.have.property("availableSlotDataList");
          expect(_body.availableSlotDataList[0].code).to.be.a('string');
          expect(_body.availableSlotDataList[0].scheduleDate).to.be.a('string');

          let responseData = {
            slotCode: _body.availableSlotDataList[0].code,
            slotDate: _body.availableSlotDataList[0].scheduleDate
          };
          if (error) {
            reject(error);
          }

          resolve(responseData);
        }
    );
  });
};

exports.setDeliveryMode = async function (env, requestData) {
  return new Promise((resolve, reject) => {
    let path = "/app/cart/set-delivery-mode";
    let form = {
      deliveryMode   : env.deliveryMode,
      consignmentCode: requestData.consignmentCode,
      scheduleDate   : requestData.slotDate,
      slotCode       : requestData.slotCode
    };
    if (env.debug) {
      logger.log("Form:", JSON.stringify(form, null, 1));
    }

    request.post(
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

/*
//TODO: retornar pointofservice e somente code
step("Get Delivery Modes", async function (done) {
  let path = "/app/cart/v2/deliverymodes";
  let qs = {
    deliveryModeCode: env.deliveryModeCode
  };

  request.get(
      {
        headers: headers,
        url    : `${foodURL}${siteId}${path}`,
        qs: qs
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

        _body.should.have.property("deliveryModeList");
        expect(_body.deliveryModeList[0].consignmentCode).to.be.a('string');
        consignmentCode = _body.deliveryModeList[0].consignmentCode;

        done();
      }
  );
});

step("Retrieve Delivery Slots", async function (done) {
  let path = "/app/cart/v2/deliveryslots";
  let form = {
    deliveryMode   : env.deliveryModePeriodCode,
    consignmentCode: consignmentCode
  };
  if (env.debug) {
    logger.log("Form:", JSON.stringify(form, null, 1));
  }

  request.post(
      {
        headers: headers,
        url    : `${foodURL}${siteId}${path}`,
        form   : form
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

        _body.should.have.property("availableSlotDataList");
        expect(_body.availableSlotDataList[0].code).to.be.a('string');
        expect(_body.availableSlotDataList[0].scheduleDate).to.be.a('string');

        slotCode = _body.availableSlotDataList[0].code;
        slotDate = _body.availableSlotDataList[0].scheduleDate;

        done();
      }
  );
});

step("Set Delivery Mode", async function (done) {
  let path = "/app/cart/v2/set-delivery-mode";
  let form = {
    deliveryMode   : env.deliveryModePeriodCode,
    consignmentCode: consignmentCode,
    driveWarehouse : env.driveWarehouse,
    drivePos       : env.drivePos,
    modality       : env.modality,
    scheduleDate   : slotDate,
    slotCode       : slotCode
  };
  if (env.debug) {
    logger.log("Form:", JSON.stringify(form, null, 1));
  }

  request.post(
      {
        headers: headers,
        url    : `${foodURL}${siteId}${path}`,
        form   : form
      },
      function (error, response, body) {

        expect(response.statusCode).to.equal(200);

        done();
      }
  );
});
*/
